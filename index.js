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
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      
      await page.goto(this.newsCategoryURL, { 
        waitUntil: 'networkidle0',
        timeout: 30000
      });
      
      // Wait for article elements to load
      await page.waitForSelector('.post-title a', { timeout: 10000 });
      
      // Extract article URLs and titles
      const articles = await page.evaluate(() => {
        const articleElements = document.querySelectorAll('.post-title a');
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
      throw error;
    }
  }

  /**
   * Fetch and parse individual article content
   */
  async fetchArticleContent(articleUrl) {
    try {
      console.log(`Fetching content from: ${articleUrl}`);
      
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      
      await page.goto(articleUrl, { 
        waitUntil: 'networkidle0',
        timeout: 30000
      });
      
      // Wait for content to load
      await page.waitForSelector('.entry-content', { timeout: 10000 });
      
      const articleData = await page.evaluate(() => {
        // Extract title
        const titleElement = document.querySelector('h1.entry-title') || 
                            document.querySelector('title');
        const title = titleElement ? titleElement.innerText.trim() : 'No Title';
        
        // Extract author
        const authorElement = document.querySelector('.author-name') || 
                             document.querySelector('.vcard .fn');
        const author = authorElement ? authorElement.innerText.trim() : 'Unknown Author';
        
        // Extract publication date
        const dateElement = document.querySelector('.published') || 
                           document.querySelector('time');
        const date = dateElement ? dateElement.getAttribute('datetime') || dateElement.innerText.trim() : 'Unknown Date';
        
        // Extract main content
        const contentElement = document.querySelector('.entry-content');
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
      throw error;
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