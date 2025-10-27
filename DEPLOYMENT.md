# Deployment Guide

This guide walks you through deploying the Discord Q&A Bot with moderation analytics.

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] Discord Bot created in Discord Developer Portal
- [ ] Firebase project created
- [ ] Firebase service account key downloaded
- [ ] Server or hosting platform ready

## Step 1: Discord Bot Setup

### Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Name your application and click "Create"
4. Navigate to the "Bot" section
5. Click "Add Bot"
6. Under "Privileged Gateway Intents", enable:
   - Message Content Intent
   - Server Members Intent
7. Copy the bot token (you'll need this for `.env`)

### Get Application ID

1. Navigate to "OAuth2" → "General"
2. Copy the "CLIENT ID" (you'll need this for `.env`)

### Bot Permissions

The bot needs these permissions:
- Manage Messages (8192)
- View Channels (1024)
- Send Messages (2048)
- Embed Links (16384)
- Read Message History (65536)

Total Permission Integer: **93248**

### Invite Bot to Server

Use this URL (replace YOUR_CLIENT_ID):
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=93248&scope=bot%20applications.commands
```

## Step 2: Firebase/Firestore Setup

### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Follow the setup wizard
4. Enable Firestore Database:
   - Navigate to "Firestore Database"
   - Click "Create database"
   - Choose production mode
   - Select a region

### Create Service Account

1. Navigate to Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Save it as `serviceAccountKey.json` in your project root
5. **IMPORTANT**: Never commit this file to version control

### Configure Firestore Indexes

Create composite indexes for efficient queries:

```javascript
// guildId + timestamp (for moderationLogs)
Collection: moderationLogs
Fields: guildId (Ascending), timestamp (Descending)

// guildId + timestamp (for trendLogs)
Collection: trendLogs
Fields: guildId (Ascending), timestamp (Ascending)
Fields: guildId (Ascending), timestamp (Descending)
```

You can create these in the Firebase Console under Firestore → Indexes.

## Step 3: Environment Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` with your values:
```env
# Discord Configuration
DISCORD_TOKEN=YOUR_BOT_TOKEN_FROM_STEP_1
DISCORD_CLIENT_ID=YOUR_CLIENT_ID_FROM_STEP_1

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json

# Bot Configuration
SPAM_DETECTION_ENABLED=true
DAILY_REPORT_CRON=0 9 * * *
DAILY_REPORT_TIMEZONE=America/New_York
```

### Cron Schedule Format

The cron schedule uses standard cron syntax:
```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, Sunday = 0 or 7)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

Examples:
- `0 9 * * *` - Daily at 9:00 AM
- `0 */6 * * *` - Every 6 hours
- `30 8 * * 1` - Every Monday at 8:30 AM

## Step 4: Installation

1. Install dependencies:
```bash
npm install
```

2. Build the TypeScript code:
```bash
npm run build
```

3. Verify the build:
```bash
ls dist/
```

You should see compiled JavaScript files.

## Step 5: Deployment Options

### Option A: Local/VPS Deployment with PM2

1. Install PM2 globally:
```bash
npm install -g pm2
```

2. Create PM2 ecosystem file (`ecosystem.config.js`):
```javascript
module.exports = {
  apps: [{
    name: 'discord-qa-bot',
    script: './dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

3. Start the bot:
```bash
pm2 start ecosystem.config.js
```

4. Save PM2 configuration:
```bash
pm2 save
pm2 startup
```

5. Monitor the bot:
```bash
pm2 logs discord-qa-bot
pm2 status
```

### Option B: Docker Deployment

1. Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

COPY serviceAccountKey.json ./

CMD ["node", "dist/index.js"]
```

2. Create `.dockerignore`:
```
node_modules
dist
.git
.env
README.md
```

3. Build and run:
```bash
docker build -t discord-qa-bot .
docker run -d --name discord-qa-bot --env-file .env discord-qa-bot
```

### Option C: Cloud Platform (Heroku, Railway, etc.)

1. Add a `Procfile`:
```
worker: node dist/index.js
```

2. Set environment variables in the platform dashboard

3. Deploy via Git push or platform CLI

## Step 6: Verification

1. Check bot is online in Discord
2. Test spam detection:
   - Send a message with a URL in your Discord server
   - Verify it gets deleted and you receive a DM
3. Test slash commands:
   - Run `/usage-stats`
   - Run `/trends`
4. Check logs:
```bash
# PM2
pm2 logs discord-qa-bot

# Docker
docker logs discord-qa-bot

# Direct
tail -f logs/bot.log
```

## Step 7: Post-Deployment Configuration

### Configure Guild Settings

In your Discord server, use these commands:

1. Add custom spam patterns:
```
/add-spam-pattern "unwanted-keyword"
```

2. View current patterns:
```
/list-spam-patterns
```

3. Check moderation history:
```
/moderation-history
```

### Test Daily Report

Force trigger the daily report to test:
```
/force-daily-report
```

## Monitoring & Maintenance

### Logs

Monitor application logs regularly:
- Check for Firebase connection errors
- Monitor Discord API rate limits
- Review spam detection false positives

### Firestore Usage

Monitor Firestore usage in Firebase Console:
- Read/Write operations
- Storage size
- Ensure within free tier or budget

### Bot Updates

To update the bot:
```bash
git pull
npm install
npm run build
pm2 restart discord-qa-bot
```

## Troubleshooting

### Bot not responding
- Check bot token is correct
- Verify bot has required permissions
- Check if bot is online in Discord

### Spam detection not working
- Verify `MANAGE_MESSAGES` permission
- Check `SPAM_DETECTION_ENABLED=true` in `.env`
- Review spam patterns with `/list-spam-patterns`

### Firebase errors
- Verify service account key path
- Check Firebase project ID
- Ensure Firestore is enabled
- Verify network connectivity

### Daily reports not sending
- Check cron schedule format
- Verify timezone setting
- Test with `/force-daily-report`
- Check bot can DM server owner

## Security Best Practices

1. **Never commit sensitive files**:
   - `.env`
   - `serviceAccountKey.json`

2. **Rotate tokens regularly**:
   - Discord bot token
   - Firebase service account

3. **Firestore Security Rules**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

4. **Monitor access logs** in Firebase Console

## Scaling Considerations

For large deployments:

1. **Sharding**: Discord.js supports sharding for bots in 2500+ servers
2. **Database**: Consider Firestore limits and quotas
3. **Rate Limits**: Implement additional rate limiting for Discord API
4. **Caching**: Add Redis for temporary data caching
5. **Load Balancing**: Deploy multiple instances with proper state management

## Support

If you encounter issues:
1. Check the logs first
2. Review the troubleshooting section
3. Open an issue on GitHub with logs and details
