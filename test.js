// Test file for Chiropractic News Summarizer

const ChiropracticNewsSummarizer = require('./index');

async function runTests() {
  console.log('Running tests for Chiropractic News Summarizer...');
  
  try {
    const summarizer = new ChiropracticNewsSummarizer();
    
    // Test basic instantiation
    console.log('✓ Created summarizer instance');
    
    // Test key point extraction (mock data)
    const mockContent = "This is the first sentence. This is the second sentence. This is the third sentence. This is the fourth sentence.";
    const keyPoints = summarizer.extractKeyPoints(mockContent, "Test Article");
    console.log('✓ Key points extracted:', keyPoints.length, 'points found');
    
    // Test summary generation
    const summary = await summarizer.summarizeContent(mockContent, "Test Article");
    console.log('✓ Summary generated successfully');
    
    console.log('All tests passed!');
    
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = runTests;