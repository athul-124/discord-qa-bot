# Production Deployment Guide

Complete guide for deploying the Discord Q&A Bot and Dashboard to production using Heroku and Firebase.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Discord Setup](#discord-setup)
- [Firebase Setup](#firebase-setup)
- [Heroku Deployment](#heroku-deployment)
- [Firebase Hosting Deployment](#firebase-hosting-deployment)
- [Configuration](#configuration)
- [Verification & Testing](#verification--testing)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Accounts
1. **Discord Developer Account** - https://discord.com/developers
2. **Firebase Account** - https://console.firebase.google.com
3. **Heroku Account** - https://heroku.com
4. **Google Cloud Account** - For Gemini API
5. **Whop Account** - For subscription management (optional)

### Required Tools
```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Install Firebase CLI
npm install -g firebase-tools

# Verify installations
heroku --version
firebase --version
```

## Discord Setup

### 1. Create Discord Application

1. Go to https://discord.com/developers/applications
2. Click "New Application"
3. Name your application (e.g., "Q&A Bot")
4. Navigate to the "Bot" section
5. Click "Add Bot"

### 2. Enable Required Intents

In the Bot section, enable:
- ✅ **MESSAGE CONTENT INTENT** (required!)
- ✅ Server Members Intent
- ✅ Presence Intent

### 3. Get Bot Token

1. In the Bot section, click "Reset Token"
2. Copy the token (you'll need this for `DISCORD_TOKEN`)
3. **Never commit this token to Git!**

### 4. Get Client ID

1. Navigate to "General Information"
2. Copy the "Application ID" (you'll need this for `DISCORD_CLIENT_ID`)

### 5. Generate OAuth2 Invite URL

1. Navigate to "OAuth2" → "URL Generator"
2. Select scopes:
   - ✅ `bot`
   - ✅ `applications.commands`
3. Select bot permissions:
   - ✅ Read Messages/View Channels
   - ✅ Send Messages
   - ✅ Manage Messages
   - ✅ Embed Links
   - ✅ Attach Files
   - ✅ Read Message History
   - ✅ Use Slash Commands
4. Copy the generated URL
5. Save this URL - you'll use it to invite the bot to servers

**Example invite URL:**
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=274878221376&scope=bot%20applications.commands
```

## Firebase Setup

### 1. Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click "Add Project"
3. Enter project name (e.g., "discord-qa-bot")
4. Disable Google Analytics (optional)
5. Click "Create Project"

### 2. Enable Required Services

#### Firestore Database
1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Select "Start in production mode"
4. Choose a region (closest to your users)
5. Click "Enable"

#### Storage
1. Go to "Storage"
2. Click "Get started"
3. Use default security rules for now
4. Click "Done"

#### Authentication (Optional, for dashboard)
1. Go to "Authentication"
2. Click "Get started"
3. Enable "Email/Password" provider
4. Click "Save"

### 3. Deploy Firestore Rules and Indexes

```bash
# From project root
firebase login
firebase use --add  # Select your project

# Deploy security rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes
```

### 4. Get Firebase Credentials

#### Option A: Service Account JSON (Recommended for Heroku)

1. Go to Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. **Keep this file secure and never commit it!**

You'll use this in two ways:
- Set `SERVICE_ACCOUNT_JSON` environment variable (stringified)
- OR set individual variables: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`

#### Option B: Individual Environment Variables

From the downloaded service account JSON, extract:
- `project_id` → `FIREBASE_PROJECT_ID`
- `client_email` → `FIREBASE_CLIENT_EMAIL`
- `private_key` → `FIREBASE_PRIVATE_KEY` (escape newlines: `\n` → `\\n`)

### 5. Get Gemini API Key

1. Go to https://makersuite.google.com/app/apikey
2. Create a new API key
3. Copy the key (you'll need this for `GEMINI_API_KEY`)

## Heroku Deployment

### 1. Create Heroku App

```bash
# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Or use auto-generated name
heroku create
```

### 2. Configure Environment Variables

Set all required environment variables:

```bash
# Discord Configuration
heroku config:set DISCORD_TOKEN="your_bot_token_here"
heroku config:set DISCORD_CLIENT_ID="your_client_id_here"

# Gemini AI
heroku config:set GEMINI_API_KEY="your_gemini_api_key_here"

# Whop (Optional)
heroku config:set WHOP_API_KEY="your_whop_api_key_here"

# Firebase - Option A: Individual variables
heroku config:set FIREBASE_PROJECT_ID="your-project-id"
heroku config:set FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
heroku config:set FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nPrivate\nKey\nHere\n-----END PRIVATE KEY-----\n"

# Firebase - Option B: Full JSON (alternative to above)
# heroku config:set SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"..."}'

# Application Settings
heroku config:set NODE_ENV="production"
heroku config:set FREE_TIER_MESSAGE_LIMIT="100"

# CORS (set after deploying dashboard)
# heroku config:set ALLOWED_ORIGINS="https://your-project.web.app,https://your-project.firebaseapp.com"
```

**Important:** When setting `FIREBASE_PRIVATE_KEY`, ensure newlines are escaped:
```bash
# Correct format
heroku config:set FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nLine1\nLine2\n-----END PRIVATE KEY-----\n"
```

### 3. Deploy to Heroku

```bash
# Make sure you're on the deployment branch
git checkout deploy/bot-dashboard-heroku-firebase

# Add Heroku remote (if not already added)
heroku git:remote -a your-app-name

# Build the TypeScript code
npm install
npm run build

# Commit build artifacts
git add dist/
git commit -m "Add build artifacts for Heroku deployment"

# Push to Heroku
git push heroku deploy/bot-dashboard-heroku-firebase:main

# Or if on different branch
# git push heroku your-branch-name:main
```

### 4. Scale Dynos

The app uses two dyno types:
- **worker** - Runs the Discord bot
- **web** - Runs the Express API server

```bash
# Enable worker dyno (Discord bot)
heroku ps:scale worker=1

# Enable web dyno (API server)
heroku ps:scale web=1

# Check dyno status
heroku ps
```

### 5. Verify Deployment

```bash
# Check logs
heroku logs --tail

# Look for these success messages:
# - "Logged in as YourBot#1234" (worker dyno)
# - "Server is running on port XXXX" (web dyno)
# - "Firebase initialized successfully"

# Test health endpoint
curl https://your-app-name.herokuapp.com/health
```

## Firebase Hosting Deployment

### 1. Configure Dashboard Environment

```bash
cd web
cp .env.example .env
```

Edit `web/.env`:
```env
VITE_FIREBASE_API_KEY=your_web_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_BASE_URL=https://your-app-name.herokuapp.com
```

Get Firebase web config from:
- Firebase Console → Project Settings → General → Your apps → Web app

### 2. Build Dashboard

```bash
cd web
npm install
npm run build
```

### 3. Deploy to Firebase Hosting

```bash
# From project root
firebase deploy --only hosting
```

### 4. Get Hosting URL

```bash
# Firebase will output URLs like:
# Hosting URL: https://your-project.web.app
# Hosting URL: https://your-project.firebaseapp.com
```

### 5. Update CORS Configuration

```bash
# Update Heroku CORS to allow your Firebase Hosting domain
heroku config:set ALLOWED_ORIGINS="https://your-project.web.app,https://your-project.firebaseapp.com"

# Restart dynos to apply
heroku restart
```

## Configuration

### Update Firebase Hosting API Endpoint

The dashboard needs to point to your Heroku API. This was set in `VITE_API_BASE_URL` during the build.

If you need to change it:
1. Update `web/.env`
2. Rebuild: `cd web && npm run build`
3. Redeploy: `firebase deploy --only hosting`

### Invite Bot to Server

1. Use the OAuth2 URL you generated earlier
2. Open the URL in a browser
3. Select your Discord server
4. Click "Authorize"
5. Complete the captcha

The bot should now appear online in your server!

### Configure Bot with /config Command

In your Discord server:
```
/config channel:#qa-channel keywords:help,support
```

This tells the bot which channel to monitor and what keywords trigger responses.

## Verification & Testing

### Smoke Tests Checklist

#### 1. Bot Connection
- [ ] Bot appears online in Discord
- [ ] Bot responds to `/config` command
- [ ] Bot creates slash commands successfully

#### 2. Knowledge Base Upload
- [ ] Dashboard is accessible at Firebase Hosting URL
- [ ] Can upload CSV file
- [ ] Can upload PDF file
- [ ] Uploads are written to Firestore `kbs` collection
- [ ] API endpoint returns success

#### 3. Message Handling
- [ ] Send test message with keyword in configured channel
- [ ] Bot responds within 5 seconds
- [ ] Response uses knowledge base context
- [ ] Response time is acceptable (<5s requirement)

#### 4. Usage Tracking
- [ ] Usage is tracked in Firestore `usage` collection
- [ ] Message count increments
- [ ] Free tier limit enforced at 100 messages/month

#### 5. Spam Detection
- [ ] Send message with spam pattern
- [ ] Message is deleted
- [ ] Server owner receives DM
- [ ] Action logged to Firestore `moderationLogs`

#### 6. Trend Logging
- [ ] Questions are logged to `trendLogs` collection
- [ ] Timestamps are correct
- [ ] Keywords are extracted

#### 7. Health Checks
```bash
# Test API health endpoint
curl https://your-app-name.herokuapp.com/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2024-...",
  "uptime": 123.456
}
```

## Monitoring & Maintenance

### Heroku Logs

```bash
# View real-time logs
heroku logs --tail

# View logs for specific dyno
heroku logs --tail --dyno worker
heroku logs --tail --dyno web

# View logs from last hour
heroku logs --tail --since="1 hour ago"
```

### Key Log Messages

**Success indicators:**
```
Logged in as YourBot#1234
Server is running on port 3000
Firebase initialized successfully
Slash commands registered successfully
Daily report job started
```

**Error indicators:**
```
Failed to login
Discord client error
Failed to initialize Firebase
```

### Heroku Monitoring

1. Go to https://dashboard.heroku.com/apps/your-app-name/metrics
2. Check:
   - Dyno load (should be stable)
   - Memory usage (should not be constantly at limit)
   - Response times (should be <5s)

### Firebase Monitoring

1. Go to Firebase Console → Firestore Database
2. Verify collections are being populated:
   - `kbs` - Knowledge base entries
   - `usage` - Usage tracking
   - `trendLogs` - Trend data
   - `moderationLogs` - Moderation actions
   - `guildConfigs` - Server configurations

### Set Up Alerts

#### Heroku
1. Go to app dashboard
2. Configure alerts for:
   - Dyno crashes
   - High memory usage
   - High response times

#### Firebase
1. Go to Firebase Console → Performance
2. Set up alerts for:
   - High error rates
   - Slow queries

### Health Check Monitoring

Use a service like UptimeRobot or Pingdom to monitor:
- Bot health: `https://your-app-name.herokuapp.com/health`
- Dashboard: `https://your-project.web.app`

## Rollback Procedures

### Heroku Rollback

```bash
# View release history
heroku releases

# Rollback to previous release
heroku rollback

# Rollback to specific release
heroku rollback v42

# Verify
heroku releases
heroku logs --tail
```

### Firebase Hosting Rollback

```bash
# View deployment history
firebase hosting:channel:list

# Firebase doesn't have direct rollback, but you can:
# 1. Revert code changes
# 2. Rebuild
cd web && npm run build

# 3. Redeploy
firebase deploy --only hosting
```

### Emergency Shutdown

```bash
# Stop all dynos
heroku ps:scale worker=0 web=0

# Restart when ready
heroku ps:scale worker=1 web=1
```

## Troubleshooting

### Bot Won't Start

**Symptom:** Worker dyno crashes immediately

**Checks:**
```bash
heroku logs --tail --dyno worker
```

**Common causes:**
1. Missing `DISCORD_TOKEN`
2. Invalid bot token
3. Missing MESSAGE_CONTENT intent
4. Firebase credentials not set

**Fix:**
```bash
# Verify all environment variables are set
heroku config

# Reset bot token in Discord Developer Portal
# Update Heroku config
heroku config:set DISCORD_TOKEN="new_token_here"
```

### API Server Errors

**Symptom:** 500 errors from API endpoints

**Checks:**
```bash
heroku logs --tail --dyno web
```

**Common causes:**
1. CORS misconfiguration
2. Firebase credentials invalid
3. Missing environment variables

**Fix:**
```bash
# Check CORS settings
heroku config:get ALLOWED_ORIGINS

# Update if needed
heroku config:set ALLOWED_ORIGINS="https://your-project.web.app"

# Restart web dyno
heroku restart web
```

### Firebase Connection Issues

**Symptom:** "Failed to initialize Firebase"

**Common causes:**
1. Invalid service account credentials
2. Newlines not properly escaped in `FIREBASE_PRIVATE_KEY`
3. Missing required environment variables

**Fix:**
```bash
# Verify Firebase credentials
heroku config:get FIREBASE_PROJECT_ID
heroku config:get FIREBASE_CLIENT_EMAIL
heroku config:get FIREBASE_PRIVATE_KEY

# If using JSON format
heroku config:get SERVICE_ACCOUNT_JSON

# Re-set with proper escaping
# Make sure newlines in private key are escaped: \n (not \\n in bash)
```

### Dashboard Not Loading

**Symptom:** Dashboard shows blank page or errors

**Checks:**
1. Browser console for errors
2. Firebase Hosting logs
3. Verify API URL in dashboard build

**Fix:**
```bash
# Rebuild with correct API URL
cd web
nano .env  # Update VITE_API_BASE_URL
npm run build

# Redeploy
firebase deploy --only hosting
```

### Rate Limiting / 429 Errors

**Symptom:** Bot stops responding to messages

**Cause:** Discord rate limits exceeded

**Fix:**
1. Review bot logic for excessive API calls
2. Implement rate limiting in code
3. Add delays between requests
4. Cache data where possible

### Out of Memory

**Symptom:** R14 errors in Heroku logs

**Fix:**
```bash
# Upgrade to larger dyno
heroku ps:scale worker=1:standard-1x
heroku ps:scale web=1:standard-1x
```

## Cost Optimization

### Heroku Free Tier
- 550-1000 free dyno hours per month
- Worker + Web = 2 dynos = ~360 hours of both running 24/7
- Free tier sufficient for small-medium Discord servers

### Firebase Free Tier
- 50k reads, 20k writes, 20k deletes per day
- 1GB storage
- 10GB/month bandwidth
- Usually sufficient for small-medium deployments

### Upgrade Triggers
- Heroku: Upgrade if you need 24/7 uptime (free tier sleeps after 30 min inactivity)
- Firebase: Upgrade if you exceed daily quotas

## Security Best practices

1. **Never commit secrets** - Use environment variables
2. **Rotate tokens** - Periodically reset bot token and API keys
3. **Monitor logs** - Check for unauthorized access attempts
4. **Firebase rules** - Review and tighten security rules
5. **CORS** - Only allow your specific domains
6. **HTTPS only** - Never use HTTP endpoints

## Support Resources

- **Heroku Documentation:** https://devcenter.heroku.com/
- **Firebase Documentation:** https://firebase.google.com/docs
- **Discord.js Guide:** https://discordjs.guide/
- **Discord Developer Portal:** https://discord.com/developers/docs

## Quick Reference

### Useful Commands

```bash
# Heroku
heroku logs --tail
heroku ps
heroku restart
heroku config
heroku config:set KEY=value
heroku releases

# Firebase
firebase deploy --only hosting
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase hosting:channel:list

# Git
git push heroku main
git log --oneline
```

### Environment Variables Checklist

- [ ] `DISCORD_TOKEN`
- [ ] `DISCORD_CLIENT_ID`
- [ ] `GEMINI_API_KEY`
- [ ] `WHOP_API_KEY`
- [ ] `FIREBASE_PROJECT_ID`
- [ ] `FIREBASE_CLIENT_EMAIL`
- [ ] `FIREBASE_PRIVATE_KEY`
- [ ] `NODE_ENV=production`
- [ ] `ALLOWED_ORIGINS`

### URLs to Save

- Heroku App: `https://your-app-name.herokuapp.com`
- Firebase Hosting: `https://your-project.web.app`
- Discord Invite: `https://discord.com/api/oauth2/authorize?client_id=...`
- Heroku Dashboard: `https://dashboard.heroku.com/apps/your-app-name`
- Firebase Console: `https://console.firebase.google.com/project/your-project`

---

**Deployment complete!** 🚀

Your Discord Q&A Bot should now be running in production. Monitor logs for the first few hours to ensure everything is stable.
