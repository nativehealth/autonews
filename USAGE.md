# How to Use the Chiropractic News Summarizer

This document provides instructions on how to use the chiropractic news summarizer tool.

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Basic Usage

### Run the main application
```bash
npm start
```
or
```bash
node index.js
```

This will fetch articles from https://www.chiroeco.com/category/news/chiropractic-news/ and output summaries to the console, saving results to `chiropractic_news_summary.json`.

### Run the example
```bash
npm run example
```

This demonstrates how to use the tool programmatically.

## Programmatic Usage

You can also use the summarizer in your own code:

```javascript
const ChiropracticNewsSummarizer = require('./index');

async function main() {
  const summarizer = new ChiropracticNewsSummarizer();
  
  // Fetch and summarize articles
  const results = await summarizer.fetchAndSummarize();
  
  // Process the results
  results.forEach(article => {
    console.log(`Title: ${article.title}`);
    console.log(`Summary: ${article.summary}`);
    console.log('---');
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

## Output Format

The tool outputs structured data including:
- Article title
- Author information
- Publication date
- URL of the original article
- Key points extracted from the content
- Summarized content

## Testing

Run tests with:
```bash
npm test
```

## Error Handling

The tool includes error handling for:
- Network connectivity issues
- Parsing failures due to website structure changes
- Timeout handling for slow responses
- Graceful degradation when summarization fails

## Limitations

- The current implementation uses basic text extraction and summarization techniques
- For production use, consider integrating with a more sophisticated LLM service
- The tool may need adjustments if the target website's HTML structure changes