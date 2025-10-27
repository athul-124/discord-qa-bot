import dotenv from 'dotenv';

dotenv.config();

export const config = {
  discord: {
    token: process.env.DISCORD_TOKEN || '',
    clientId: process.env.DISCORD_CLIENT_ID || '',
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json',
  },
  bot: {
    spamDetectionEnabled: process.env.SPAM_DETECTION_ENABLED !== 'false',
    dailyReportCron: process.env.DAILY_REPORT_CRON || '0 9 * * *',
    dailyReportTimezone: process.env.DAILY_REPORT_TIMEZONE || 'UTC',
  },
};

export const SPAM_BASE_PATTERN = /https?:\/\/|spam/i;
export const DEFAULT_SPAM_PATTERNS = [
  /discord\.gg\/[a-zA-Z0-9]+/i,
  /free\s+nitro/i,
  /click\s+here/i,
];
