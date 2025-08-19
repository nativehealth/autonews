// Example usage of the Chiropractic News Summarizer

const ChiropracticNewsSummarizer = require('./index');

async function main() {
  console.log('=== Chiropractic News Summarizer Example ===\n');
  
  try {
    // Create an instance of the summarizer
    const summarizer = new ChiropracticNewsSummarizer();
    
    // Fetch and summarize articles (this will take some time)
    console.log('Fetching and summarizing chiropractic news articles...\n');
    
    const results = await summarizer.fetchAndSummarize();
    
    if (results.length === 0) {
      console.log('No articles were successfully processed.');
      return;
    }
    
    // Display the results
    console.log(`\n=== Processed ${results.length} Articles ===\n`);
    
    results.forEach((article, index) => {
      console.log(`${index + 1}. ${article.title}`);
      console.log(`   Author: ${article.author}`);
      console.log(`   Date: ${article.date}`);
      console.log(`   URL: ${article.url}`);
      console.log(`   Key Points:`);
      article.keyPoints.forEach((point, i) => {
        console.log(`     ${i + 1}. ${point}`);
      });
      console.log(`   Summary: ${article.summary.substring(0, 150)}...`);
      console.log('');
    });
    
    console.log('Example completed successfully!');
    
  } catch (error) {
    console.error('Error in example:', error);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = main;