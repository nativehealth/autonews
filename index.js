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
        timeout: 30000
      });
      const page = await browser.newPage();
      
      // Set user agent to avoid being blocked
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      await page.goto(this.newsCategoryURL, {
        waitUntil: 'networkidle0',
        timeout: 30000
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
        timeout: 30000
      });
      const page = await browser.newPage();
      
      // Set user agent to avoid being blocked
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      await page.goto(articleUrl, {
        waitUntil: 'networkidle0',
        timeout: 30000
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
        let authorElement = document.querySelector('.author-name') ||
                           document.querySelector('.vcard .fn');
        if (!authorElement) {
          // Try to find author in meta tags or other common locations
          const metaAuthor = document.querySelector('meta[name="author"]');
          if (metaAuthor) authorElement = { innerText: metaAuthor.getAttribute('content') };
        }
        
        const author = authorElement ? authorElement.innerText.trim() : 'Unknown Author';
        
        // Extract publication date with multiple fallbacks
        let dateElement = document.querySelector('.published') ||
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
    // This is a simplified approach - in a real implementation,
    // this would use more sophisticated NLP techniques or LLM integration
    
    if (!content || content.length < 50) {
      return ['Content too short to summarize'];
    }
    
    // Simple approach: extract first few sentences as key points
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    // Take the first 3 sentences as key points, or all if less than 3
    const keyPoints = sentences.slice(0, Math.min(3, sentences.length));
    
    return keyPoints.map(point => point.trim());
  }

  /**
   * Summarize article content using LLM (placeholder for actual implementation)
   */
  async summarizeContent(content, title) {
    // This is a placeholder - in a real implementation,
    // this would integrate with an LLM service like OpenAI or similar
    
    console.log('Summarizing content using LLM...');
    
    // For now, we'll return a simple summary based on key points
    const keyPoints = this.extractKeyPoints(content, title);
    
    if (keyPoints.length === 0) {
      return 'No significant content found to summarize.';
    }
    
    // Create a basic summary from key points
    const summary = `Main points from "${title}":\n\n${keyPoints.map((point, i) => `${i + 1}. ${point}`).join('\n')}`;
    
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
    
    // Save results to file
    await summarizer.saveResults(results);
    
  } catch (error) {
    console.error('Failed to complete summarization:', error);
  }
}

// Run main function if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = ChiropracticNewsSummarizer;