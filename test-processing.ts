import { processCsvFile } from './src/utils/csvProcessor';
import { extractKeywords, normalizeWhitespace } from './src/utils/textProcessing';

async function testProcessing() {
  console.log('=== Testing Text Processing ===\n');
  
  const text = '  How   do I   reset my    password?  ';
  const normalized = normalizeWhitespace(text);
  console.log('Original:', text);
  console.log('Normalized:', normalized);
  
  const keywords = extractKeywords('How do I reset my password?');
  console.log('Keywords:', keywords);
  
  console.log('\n=== Testing CSV Processing ===\n');
  
  try {
    const result = await processCsvFile('sample-kb.csv', 'test-server-123', 'test-path');
    console.log('Entries created:', result.summary.entriesCreated);
    console.log('Entries skipped:', result.summary.entriesSkipped);
    console.log('Errors:', result.summary.errors);
    
    if (result.entries.length > 0) {
      console.log('\nFirst entry:');
      console.log('Question:', result.entries[0].question);
      console.log('Answer:', result.entries[0].answer);
      console.log('Keywords:', result.entries[0].keywords);
    }
  } catch (error: any) {
    console.error('CSV processing error:', error.message);
  }
  
  console.log('\n=== Testing Malformed CSV ===\n');
  
  try {
    const result = await processCsvFile('test-malformed.csv', 'test-server-123', 'test-path');
    console.log('Entries created:', result.summary.entriesCreated);
    console.log('Entries skipped:', result.summary.entriesSkipped);
    console.log('Errors:', result.summary.errors);
  } catch (error: any) {
    console.error('CSV processing error:', error.message);
  }
}

testProcessing().catch(console.error);
