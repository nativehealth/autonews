// Comprehensive test for Chiropractic News Summarizer

const ChiropracticNewsSummarizer = require('./index');

async function runComprehensiveTests() {
  console.log('Running comprehensive tests for Chiropractic News Summarizer...');
  
  try {
    const summarizer = new ChiropracticNewsSummarizer();
    
    // Test 1: Basic class instantiation
    console.log('Test 1: Class instantiation');
    if (summarizer instanceof ChiropracticNewsSummarizer) {
      console.log('✓ Successfully created summarizer instance');
    } else {
      throw new Error('Failed to create summarizer instance');
    }
    
    // Test 2: Key points extraction with mock data
    console.log('\nTest 2: Key points extraction');
    const mockContent = "This is the first sentence. This is the second sentence. This is the third sentence. This is the fourth sentence.";
    const keyPoints = summarizer.extractKeyPoints(mockContent, "Test Article");
    if (Array.isArray(keyPoints) && keyPoints.length > 0) {
      console.log(`✓ Extracted ${keyPoints.length} key points`);
    } else {
      throw new Error('Failed to extract key points');
    }
    
    // Test 3: Summary generation
    console.log('\nTest 3: Summary generation');
    const summary = await summarizer.summarizeContent(mockContent, "Test Article");
    if (typeof summary === 'string' && summary.length > 0) {
      console.log('✓ Successfully generated summary');
    } else {
      throw new Error('Failed to generate summary');
    }
    
    // Test 4: Check that we have the expected methods
    console.log('\nTest 4: Method availability');
    const requiredMethods = ['fetchArticleUrls', 'fetchArticleContent', 'extractKeyPoints', 'summarizeContent', 'processArticle', 'fetchAndSummarize'];
    for (const method of requiredMethods) {
      if (typeof summarizer[method] === 'function') {
        console.log(`✓ Method ${method} is available`);
      } else {
        throw new Error(`Missing required method: ${method}`);
      }
    }
    
    console.log('\n✅ All comprehensive tests passed!');
    
  } catch (error) {
    console.error('Comprehensive test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runComprehensiveTests();
}

module.exports = runComprehensiveTests;