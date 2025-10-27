import dotenv from 'dotenv';

dotenv.config();

console.log('[Validation] Checking environment configuration...\n');

const requiredVars = [
  'DISCORD_TOKEN',
  'DISCORD_CLIENT_ID',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
];

let hasErrors = false;

requiredVars.forEach((varName) => {
  const value = process.env[varName];
  if (!value || value.includes('your_') || value.includes('here')) {
    console.log(`❌ ${varName}: Not configured`);
    hasErrors = true;
  } else {
    const displayValue = varName.includes('TOKEN') || varName.includes('KEY') || varName.includes('EMAIL')
      ? '***' + value.slice(-4)
      : value;
    console.log(`✅ ${varName}: ${displayValue}`);
  }
});

console.log('\nOptional variables:');
const optionalVars = ['DISCORD_GUILD_ID', 'NODE_ENV'];
optionalVars.forEach((varName) => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value}`);
  } else {
    console.log(`ℹ️  ${varName}: Not set (optional)`);
  }
});

console.log('\n' + '='.repeat(50));

if (hasErrors) {
  console.log('\n⚠️  Some required environment variables are not configured.');
  console.log('Please update your .env file before running the bot.\n');
  console.log('See .env.example for reference and README for setup instructions.\n');
  process.exit(1);
} else {
  console.log('\n✅ All required environment variables are configured!');
  console.log('You can now run the bot with: npm run dev\n');
  process.exit(0);
}
