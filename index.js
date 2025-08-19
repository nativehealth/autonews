// Chiropractic News Summarizer
// Main entry point for fetching and summarizing chiropractic news articles

const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
require('dotenv').config();

/**
 * Chiropractic News Summarizer Class
 */
class ChiropracticNewsSummarizer {
  constructor() {
    this.baseURL = 'https://www.chiroeco.com';
    this.newsCategoryURL = 'https://www.chiroeco.com/category/news/chiropractic-news/';
    this.articles = [];
    
    // Load configuration from environment variables with defaults
    this.config = {
      requestTimeout: parseInt(process.env.REQUEST_TIMEOUT) || 30000,
      maxArticles: parseInt(process.env.MAX_ARTICLES) || 10,
      userAgent: process.env.USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      scrapingDelay: parseInt(process.env.SCRAPING_DELAY) || 1000,
      logLevel: process.env.LOG_LEVEL || 'info'
    };
  }

  /**
   * Fetch article URLs from the chiropractic news category page
   */
  async fetchArticleUrls() {
    try {
      console.log('Fetching article URLs from chiropractic news section...');
      
      // Using Puppeteer to handle potential JavaScript rendering
      const browser = await puppeteer.launch({
        headless: true,
        timeout: this.config.requestTimeout
      });
      const page = await browser.newPage();
      
      // Set user agent from configuration to avoid being blocked
      await page.setUserAgent(this.config.userAgent);
      
      await page.goto(this.newsCategoryURL, {
        waitUntil: 'networkidle0',
        timeout: this.config.requestTimeout
      });
      
      // Wait for article elements to load with retry logic
      try {
        await page.waitForSelector('.entry-title a', { timeout: 10000 });
      } catch (waitError) {
        console.log('Waiting for .entry-title a failed, trying alternative selectors...');
        // Try alternative selectors if the first one fails
        await page.waitForSelector('h2.entry-title a', { timeout: 5000 });
      }
      
      // Extract article URLs and titles
      const articles = await page.evaluate(() => {
        // Try multiple selectors to find article elements
        let articleElements = document.querySelectorAll('.entry-title a');
        
        if (articleElements.length === 0) {
          articleElements = document.querySelectorAll('h2.entry-title a');
        }
        
        if (articleElements.length === 0) {
          // Fallback to any link with title in the content area
          const contentArea = document.querySelector('.entry-content') || document.querySelector('.post-content');
          if (contentArea) {
            articleElements = contentArea.querySelectorAll('a[href*="/20"]');
          }
        }
        
        return Array.from(articleElements).map(el => ({
          title: el.innerText.trim(),
          url: el.href
        }));
      });
      
      await browser.close();
      
      console.log(`Found ${articles.length} articles`);
      
      // Limit articles based on configuration
      if (articles.length > this.config.maxArticles) {
        console.log(`Limiting to ${this.config.maxArticles} articles based on configuration`);
        return articles.slice(0, this.config.maxArticles);
      }
      
      return articles;
      
    } catch (error) {
      console.error('Error fetching article URLs:', error);
      // Return empty array instead of throwing to prevent complete failure
      return [];
    }
  }

  /**
   * Fetch and parse individual article content
   */
  async fetchArticleContent(articleUrl) {
    try {
      console.log(`Fetching content from: ${articleUrl}`);
      
      const browser = await puppeteer.launch({
        headless: true,
        timeout: this.config.requestTimeout
      });
      const page = await browser.newPage();
      
      // Set user agent from configuration to avoid being blocked
      await page.setUserAgent(this.config.userAgent);
      
      await page.goto(articleUrl, {
        waitUntil: 'networkidle0',
        timeout: this.config.requestTimeout
      });
      
      // Wait for content to load with retry logic
      try {
        await page.waitForSelector('.entry-content', { timeout: 10000 });
      } catch (waitError) {
        console.log('Waiting for .entry-content failed, trying alternative selectors...');
        // Try alternative selectors if the first one fails
        await page.waitForSelector('.post-content', { timeout: 5000 });
      }
      
      const articleData = await page.evaluate(() => {
        // Extract title with multiple fallbacks
        let titleElement = document.querySelector('h1.entry-title');
        if (!titleElement) titleElement = document.querySelector('h1.entry-title');
        if (!titleElement) titleElement = document.querySelector('title');
        
        const title = titleElement ? titleElement.innerText.trim() : 'No Title';
        
        // Extract author with multiple fallbacks
        let authorElement = document.querySelector('.entry-author-name') ||
                           document.querySelector('.author-name') ||
                           document.querySelector('.vcard .fn') ||
                           document.querySelector('.byline') ||
                           document.querySelector('[rel="author"]');
        if (!authorElement) {
          // Try to find author in meta tags or other common locations
          const metaAuthor = document.querySelector('meta[name="author"]');
          if (metaAuthor) authorElement = { innerText: metaAuthor.getAttribute('content') };
        }
        
        const author = authorElement ? authorElement.innerText.trim() : 'Unknown Author';
        
        // Extract publication date with multiple fallbacks
        let dateElement = document.querySelector('.entry-time') ||
                         document.querySelector('time');
        if (!dateElement) {
          // Try to find date in meta tags or other common locations
          const metaDate = document.querySelector('meta[property="article:published_time"]');
          if (metaDate) dateElement = { innerText: metaDate.getAttribute('content') };
        }
        
        const date = dateElement ? dateElement.getAttribute('datetime') || dateElement.innerText.trim() : 'Unknown Date';
        
        // Extract main content with multiple fallbacks
        let contentElement = document.querySelector('.entry-content');
        if (!contentElement) contentElement = document.querySelector('.post-content');
        if (!contentElement) {
          // Try to find any content div that might contain the article text
          const contentDivs = document.querySelectorAll('div');
          contentElement = Array.from(contentDivs).find(div =>
            div.innerText.length > 100 &&
            (div.querySelector('p') || div.querySelector('h2') || div.querySelector('h3'))
          );
        }
        
        const content = contentElement ? contentElement.innerText.trim() : '';
        
        return {
          title,
          author,
          date,
          url: window.location.href,
          content
        };
      });
      
      await browser.close();
      
      return articleData;
      
    } catch (error) {
      console.error('Error fetching article content:', error);
      // Return a minimal article object instead of throwing to prevent complete failure
      return {
        title: 'Failed to fetch article',
        author: 'Unknown',
        date: new Date().toISOString(),
        url: articleUrl,
        content: ''
      };
    }
  }

  /**
   * Extract key points and highlights from article content
   */
  extractKeyPoints(content, title) {
    // Enhanced approach with better text processing
    if (!content || content.length < 50) {
      return ['Content too short to summarize'];
    }
    
    // Clean and normalize the content
    const cleanContent = content
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s.,!?;:-]/g, '') // Remove special characters
      .trim();
    
    // Split into sentences with better handling of abbreviations
    const sentences = cleanContent.split(/[.!?]+/)
      .filter(s => s.trim().length > 30) // Longer minimum for quality
      .map(s => s.trim());
    
    // Score sentences based on various factors
    const scoredSentences = sentences.map(sentence => {
      let score = 0;
      
      // Prefer sentences with title words
      const titleWords = title.toLowerCase().split(/\s+/);
      const sentenceWords = sentence.toLowerCase().split(/\s+/);
      const titleMatches = titleWords.filter(word => 
        word.length > 3 && sentenceWords.some(sw => sw.includes(word))
      ).length;
      score += titleMatches * 2;
      
      // Prefer sentences with important keywords
      const importantWords = ['study', 'research', 'treatment', 'patient', 'therapy', 'clinical', 'effective', 'result'];
      const keywordMatches = importantWords.filter(word => 
        sentence.toLowerCase().includes(word)
      ).length;
      score += keywordMatches;
      
      // Prefer sentences in the beginning (more likely to be important)
      const position = sentences.indexOf(sentence);
      score += Math.max(0, 5 - position);
      
      // Prefer sentences of moderate length
      const length = sentence.split(/\s+/).length;
      if (length >= 10 && length <= 30) {
        score += 2;
      }
      
      return { sentence, score };
    });
    
    // Sort by score and take top 3
    const topSentences = scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.min(3, sentences.length))
      .map(item => item.sentence);
    
    return topSentences.length > 0 ? topSentences : ['No key points could be extracted'];
  }

  /**
   * Summarize article content using enhanced algorithms (placeholder for LLM integration)
   */
  async summarizeContent(content, title) {
    console.log('Generating enhanced summary...');
    
    if (!content || content.length < 50) {
      return 'Article content too short to generate meaningful summary.';
    }
    
    // Extract key points using enhanced method
    const keyPoints = this.extractKeyPoints(content, title);
    
    if (keyPoints.length === 0 || keyPoints[0] === 'No key points could be extracted') {
      return 'Unable to extract key insights from this article.';
    }
    
    // Create an enhanced summary with better structure
    let summary = `**${title}**\n\n`;
    
    // Add overview based on content length and complexity
    const wordCount = content.split(/\s+/).length;
    const complexity = wordCount > 500 ? 'comprehensive' : wordCount > 200 ? 'detailed' : 'brief';
    summary += `This ${complexity} article covers the following key insights:\n\n`;
    
    // Format key points with better presentation
    keyPoints.forEach((point, i) => {
      // Clean up the point text
      const cleanPoint = point.replace(/^\W+/, '').replace(/\W+$/, '');
      summary += `• ${cleanPoint}\n`;
    });
    
    // Add contextual conclusion based on content analysis
    const hasStudyMention = content.toLowerCase().includes('study') || content.toLowerCase().includes('research');
    const hasTreatmentMention = content.toLowerCase().includes('treatment') || content.toLowerCase().includes('therapy');
    
    if (hasStudyMention && hasTreatmentMention) {
      summary += `\n*This article appears to discuss research findings related to chiropractic treatments.*`;
    } else if (hasStudyMention) {
      summary += `\n*This article focuses on research and clinical studies in chiropractic care.*`;
    } else if (hasTreatmentMention) {
      summary += `\n*This article covers treatment approaches and therapeutic methods.*`;
    }
    
    return summary;
  }

  /**
   * Process a single article
   */
  async processArticle(articleUrl) {
    try {
      console.log(`Processing article: ${articleUrl}`);
      
      // Fetch article content
      const articleData = await this.fetchArticleContent(articleUrl);
      
      // Extract key points and highlights
      const keyPoints = this.extractKeyPoints(articleData.content, articleData.title);
      
      // Summarize using LLM (placeholder)
      const summary = await this.summarizeContent(articleData.content, articleData.title);
      
      return {
        title: articleData.title,
        author: articleData.author,
        date: articleData.date,
        url: articleData.url,
        keyPoints: keyPoints,
        summary: summary
      };
      
    } catch (error) {
      console.error(`Error processing article ${articleUrl}:`, error);
      return null;
    }
  }

  /**
   * Main method to fetch and summarize all articles
   */
  async fetchAndSummarize() {
    try {
      console.log('Starting chiropractic news summarization process...');
      
      // Fetch article URLs
      const articleUrls = await this.fetchArticleUrls();
      
      if (articleUrls.length === 0) {
        console.log('No articles found');
        return [];
      }
      
      // Process each article
      const results = [];
      for (const article of articleUrls) {
        console.log(`Processing: ${article.title}`);
        const result = await this.processArticle(article.url);
        if (result) {
          results.push(result);
        }
      }
      
      console.log(`Successfully processed ${results.length} articles`);
      return results;
      
    } catch (error) {
      console.error('Error in fetchAndSummarize:', error);
      throw error;
    }
  }

  /**
   * Save results to a file
   */
  async saveResults(results, filename = 'chiropractic_news_summary.json') {
    try {
      const fs = require('fs');
      const data = JSON.stringify(results, null, 2);
      fs.writeFileSync(filename, data);
      console.log(`Results saved to ${filename}`);
    } catch (error) {
      console.error('Error saving results:', error);
    }
  }

  /**
   * Convert results to Markdown format
   */
  resultsToMarkdown(results) {
    if (!results || results.length === 0) {
      return '# Chiropractic News Summary\n\nNo articles processed.';
    }

    let markdown = '# Chiropractic News Summary\n\n';
    markdown += `*Generated on ${new Date().toLocaleDateString()}*\n\n`;
    markdown += `Total articles processed: **${results.length}**\n\n---\n\n`;

    results.forEach((article, index) => {
      markdown += `## ${index + 1}. ${article.title}\n\n`;
      markdown += `**Author:** ${article.author}\n\n`;
      markdown += `**Date:** ${article.date}\n\n`;
      markdown += `**URL:** [Read full article](${article.url})\n\n`;
      
      if (article.keyPoints && article.keyPoints.length > 0) {
        markdown += `### Key Points\n\n`;
        article.keyPoints.forEach((point, i) => {
          markdown += `${i + 1}. ${point}\n`;
        });
        markdown += '\n';
      }

      if (article.summary) {
        markdown += `### Summary\n\n${article.summary}\n\n`;
      }

      markdown += '---\n\n';
    });

    return markdown;
  }

  /**
   * Save results as Markdown file
   */
  async saveResultsAsMarkdown(results, filename = 'chiropractic_news_summary.md') {
    try {
      const fs = require('fs');
      const markdown = this.resultsToMarkdown(results);
      fs.writeFileSync(filename, markdown);
      console.log(`Markdown results saved to ${filename}`);
    } catch (error) {
      console.error('Error saving Markdown results:', error);
    }
  }
}

// Main execution
async function main() {
  const summarizer = new ChiropracticNewsSummarizer();
  
  try {
    // Fetch and summarize articles
    const results = await summarizer.fetchAndSummarize();
    
    // Display results
    console.log('\n=== SUMMARY RESULTS ===');
    results.forEach((article, index) => {
      console.log(`\n${index + 1}. ${article.title}`);
      console.log(`   Author: ${article.author}`);
      console.log(`   Date: ${article.date}`);
      console.log(`   URL: ${article.url}`);
      console.log(`   Summary: ${article.summary.substring(0, 200)}...`);
    });
    
    // Save results to files
    await summarizer.saveResults(results);
    await summarizer.saveResultsAsMarkdown(results);
    
  } catch (error) {
    console.error('Failed to complete summarization:', error);
  }
}

// Run main function if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = ChiropracticNewsSummarizer;