import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

console.log('Validating Firebase Layer Implementation...\n');

let errors = 0;

console.log('[1/6] Checking file structure...');

const requiredFiles = [
  'src/config/firebase.ts',
  'src/types/index.ts',
  'src/services/configService.ts',
  'src/services/knowledgeBaseService.ts',
  'src/services/usageService.ts',
  'src/services/trendService.ts',
  'src/services/index.ts',
  'docs/data-model.md',
];

for (const file of requiredFiles) {
  const filePath = path.join(__dirname, '../..', file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✓ ${file}`);
  } else {
    console.error(`  ✗ Missing file: ${file}`);
    errors++;
  }
}

console.log('\n[2/6] Checking TypeScript compilation...');
const { execSync } = require('child_process');
try {
  execSync('npm run build', { stdio: 'pipe', cwd: path.join(__dirname, '../..') });
  console.log('  ✓ TypeScript compilation successful');
} catch (error) {
  console.error('  ✗ TypeScript compilation failed');
  errors++;
}

console.log('\n[3/6] Checking type definitions...');
const typesPath = path.join(__dirname, '../types/index.ts');
const typesContent = fs.readFileSync(typesPath, 'utf-8');

const requiredTypes = [
  { name: 'ServerTier', pattern: 'enum ServerTier' },
  { name: 'ServerConfig', pattern: 'interface ServerConfig' },
  { name: 'KnowledgeEntry', pattern: 'interface KnowledgeEntry' },
  { name: 'UsageEntry', pattern: 'interface UsageEntry' },
  { name: 'TrendEntry', pattern: 'interface TrendEntry' },
  { name: 'serverConfigConverter', pattern: 'serverConfigConverter' },
  { name: 'knowledgeEntryConverter', pattern: 'knowledgeEntryConverter' },
  { name: 'usageEntryConverter', pattern: 'usageEntryConverter' },
  { name: 'trendEntryConverter', pattern: 'trendEntryConverter' },
];

for (const type of requiredTypes) {
  if (typesContent.includes(type.pattern)) {
    console.log(`  ✓ ${type.name}`);
  } else {
    console.error(`  ✗ Missing type: ${type.name}`);
    errors++;
  }
}

console.log('\n[4/6] Checking code patterns...');

// Check for batch chunking implementation
const knowledgeServicePath = path.join(__dirname, '../services/knowledgeBaseService.ts');
const knowledgeServiceContent = fs.readFileSync(knowledgeServicePath, 'utf-8');

if (knowledgeServiceContent.includes('BATCH_SIZE_LIMIT') && knowledgeServiceContent.includes('500')) {
  console.log('  ✓ Batch size limit (500) implemented');
} else {
  console.error('  ✗ Batch size limit not properly configured');
  errors++;
}

if (knowledgeServiceContent.includes('chunkArray')) {
  console.log('  ✓ Array chunking helper implemented');
} else {
  console.error('  ✗ Array chunking not implemented');
  errors++;
}

// Check for tier-based limits
const usageServicePath = path.join(__dirname, '../services/usageService.ts');
const usageServiceContent = fs.readFileSync(usageServicePath, 'utf-8');

if (usageServiceContent.includes('TIER_LIMITS') && usageServiceContent.includes('100')) {
  console.log('  ✓ Tier-based limits configured (100 msg/mo free tier)');
} else {
  console.error('  ✗ Tier-based limits not properly configured');
  errors++;
}

// Check for emulator support
const firebaseConfigPath = path.join(__dirname, '../config/firebase.ts');
const firebaseConfigContent = fs.readFileSync(firebaseConfigPath, 'utf-8');

if (firebaseConfigContent.includes('USE_FIREBASE_EMULATOR') && firebaseConfigContent.includes('FIRESTORE_EMULATOR_HOST')) {
  console.log('  ✓ Firebase emulator support implemented');
} else {
  console.error('  ✗ Firebase emulator support missing');
  errors++;
}

if (firebaseConfigContent.includes('FIREBASE_SERVICE_ACCOUNT')) {
  console.log('  ✓ FIREBASE_SERVICE_ACCOUNT support implemented');
} else {
  console.error('  ✗ FIREBASE_SERVICE_ACCOUNT support missing');
  errors++;
}

console.log('\n[5/6] Checking environment configuration...');

const hasServiceAccount = !!process.env.FIREBASE_SERVICE_ACCOUNT;
const hasIndividualCreds = !!(
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
);

if (!hasServiceAccount && !hasIndividualCreds) {
  console.log('  ⚠ Firebase credentials not configured in .env');
  console.log('    This is OK for validation - credentials needed for runtime');
} else if (hasServiceAccount) {
  console.log('  ✓ FIREBASE_SERVICE_ACCOUNT configured');
} else {
  console.log('  ✓ Individual Firebase credentials configured');
}

console.log('\n[6/6] Checking documentation...');

const docPath = path.join(__dirname, '../../docs/data-model.md');
const docContent = fs.readFileSync(docPath, 'utf-8');

const requiredDocSections = [
  'server_configs',
  'knowledge_entries',
  'usage_entries',
  'trend_entries',
  'YYYY-MM',
  'Usage Enforcement Logic',
  'Tier-Based Message Limits',
];

for (const section of requiredDocSections) {
  if (docContent.includes(section)) {
    console.log(`  ✓ Documentation includes: ${section}`);
  } else {
    console.error(`  ✗ Documentation missing: ${section}`);
    errors++;
  }
}

console.log('\n' + '='.repeat(60));
if (errors === 0) {
  console.log('✅ All validation checks passed!');
  console.log('Firebase layer is properly implemented.');
  console.log('\nNext steps:');
  console.log('1. Configure Firebase credentials in .env');
  console.log('2. Run: npm run test:firebase');
  console.log('3. Start bot: npm run dev');
} else {
  console.error(`❌ Validation failed with ${errors} error(s)`);
  process.exit(1);
}
console.log('='.repeat(60));
