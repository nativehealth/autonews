// Simple test runner for Chiropractic News Summarizer

const runTests = require('./test');

async function main() {
  try {
    await runTests();
    console.log('All tests passed successfully!');
  } catch (error) {
    console.error('Tests failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = main;