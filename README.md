# Chiropractic News Summarizer

A tool that automatically fetches chiropractic news articles from chiroeco.com and extracts key points and highlights using summarization techniques.

## Features

- Fetches articles from the chiropractic news section
- Extracts article metadata (title, author, date)
- Identifies key points and highlights from articles
- Generates concise summaries using abstractive summarization
- Saves results to JSON file

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

### Basic Usage
```bash
node index.js
```

This will fetch articles from https://www.chiroeco.com/category/news/chiropractic-news/ and output summaries to the console, saving results to `chiropractic_news_summary.json`.

### Programmatic Usage
```javascript
const ChiropracticNewsSummarizer = require('./index');

async function main() {
  const summarizer = new ChiropracticNewsSummarizer();
  const results = await summarizer.fetchAndSummarize();
  
  // Process results
  results.forEach(article => {
    console.log(`Title: ${article.title}`);
    console.log(`Summary: ${article.summary}`);
  });
}

main();
```

## Configuration

Create a `.env` file based on `.env.example` to configure:
- API keys for LLM services (if integrated)
- Request timeouts
- Maximum articles to process
- Scraping delays

## Architecture

The tool follows this architecture:

1. **Web Scraping Module**: Uses Puppeteer to fetch and parse article pages
2. **Content Extraction**: Extracts title, author, date, and main content
3. **Key Points Detection**: Identifies important sentences from article content
4. **Summarization Engine**: Generates concise summaries using abstractive techniques
5. **Output Module**: Formats results and saves to file

## Dependencies

- axios: HTTP client for requests
- cheerio: Server-side jQuery for HTML parsing
- puppeteer: Headless Chrome browser automation
- dotenv: Environment variable management

## Testing

Run tests with:
```bash
npm test
```

## License

MIT
