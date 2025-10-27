import * as dotenv from 'dotenv';
import { initializeFirebase, getFirestore, getStorage, getAuth } from '../config/firebase';
import { knowledgeBaseService } from '../services/knowledgeBaseService';
import { usageService } from '../services/usageService';
import { trendService } from '../services/trendService';
import { configService } from '../services/configService';
import { ServerTier, KnowledgeEntry, TrendEntry } from '../types';

dotenv.config();

async function testFirebaseLayer() {
  console.log('='.repeat(60));
  console.log('Firebase Layer Test Script');
  console.log('='.repeat(60));
  console.log();

  try {
    // Test 1: Firebase Initialization
    console.log('[Test 1] Initializing Firebase...');
    initializeFirebase();
    console.log('✓ Firebase initialized successfully');
    console.log();

    // Test 2: Get Firebase services
    console.log('[Test 2] Getting Firebase services...');
    const firestore = getFirestore();
    const storage = getStorage();
    const auth = getAuth();
    console.log('✓ Firestore:', firestore ? 'Connected' : 'Failed');
    console.log('✓ Storage:', storage ? 'Connected' : 'Failed');
    console.log('✓ Auth:', auth ? 'Connected' : 'Failed');
    console.log();

    // Test 3: Config Service
    console.log('[Test 3] Testing Config Service...');
    const testServerId = 'test-server-123';
    
    await configService.upsertServerConfig({
      serverId: testServerId,
      allowedChannelIds: ['channel-1', 'channel-2'],
      ownerId: 'owner-123',
      tier: ServerTier.FREE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('✓ Created test server config');

    const config = await configService.getServerConfig(testServerId);
    console.log('✓ Retrieved config:', config ? 'Success' : 'Failed');
    if (config) {
      console.log('  - Server ID:', config.serverId);
      console.log('  - Tier:', config.tier);
      console.log('  - Channels:', config.allowedChannelIds.length);
    }
    console.log();

    // Test 4: Knowledge Base Service
    console.log('[Test 4] Testing Knowledge Base Service...');
    const testEntry: KnowledgeEntry = {
      serverId: testServerId,
      question: 'What is the meaning of life?',
      answer: '42',
      keywords: knowledgeBaseService.extractKeywords('What is the meaning of life? 42'),
      createdAt: new Date(),
    };

    const entryId = await knowledgeBaseService.saveKnowledgeEntry(testEntry);
    console.log('✓ Saved knowledge entry:', entryId);

    const matches = await knowledgeBaseService.getTopMatches(testServerId, ['meaning', 'life'], 5);
    console.log('✓ Retrieved matches:', matches.length);
    if (matches.length > 0) {
      console.log('  - Question:', matches[0].question);
      console.log('  - Answer:', matches[0].answer);
    }
    console.log();

    // Test 5: Usage Service
    console.log('[Test 5] Testing Usage Service...');
    await usageService.incrementUsage(testServerId);
    console.log('✓ Incremented usage');

    const usageCheck = await usageService.checkTierLimits(testServerId, ServerTier.FREE);
    console.log('✓ Checked tier limits:');
    console.log('  - Allowed:', usageCheck.allowed);
    console.log('  - Current:', usageCheck.current);
    console.log('  - Limit:', usageCheck.limit);
    console.log();

    // Test 6: Trend Service
    console.log('[Test 6] Testing Trend Service...');
    const testTrend: TrendEntry = {
      serverId: testServerId,
      timestamp: new Date(),
      keywords: ['test', 'firebase', 'integration'],
      engagement: 5,
    };

    const trendId = await trendService.recordTrend(testTrend);
    console.log('✓ Recorded trend:', trendId);

    const trends = await trendService.getTrends({ serverId: testServerId, limit: 10 });
    console.log('✓ Retrieved trends:', trends.length);
    console.log();

    // Test 7: Batch Operations
    console.log('[Test 7] Testing Batch Operations...');
    const batchEntries: KnowledgeEntry[] = Array.from({ length: 10 }, (_, i) => ({
      serverId: testServerId,
      question: `Test question ${i + 1}`,
      answer: `Test answer ${i + 1}`,
      keywords: [`keyword${i + 1}`],
      createdAt: new Date(),
    }));

    const batchIds = await knowledgeBaseService.saveKnowledgeEntries(batchEntries);
    console.log('✓ Batch saved entries:', batchIds.length);
    console.log();

    // Test 8: Cleanup
    console.log('[Test 8] Cleaning up test data...');
    await knowledgeBaseService.deleteServerEntries(testServerId);
    await configService.deleteServerConfig(testServerId);
    console.log('✓ Cleanup complete');
    console.log();

    console.log('='.repeat(60));
    console.log('All tests passed! Firebase layer is working correctly.');
    console.log('='.repeat(60));

  } catch (error) {
    console.error();
    console.error('❌ Test failed with error:');
    console.error(error);
    console.error();
    console.error('Make sure you have configured Firebase credentials in .env file');
    console.error('See .env.example for configuration options');
    process.exit(1);
  }
}

testFirebaseLayer();
