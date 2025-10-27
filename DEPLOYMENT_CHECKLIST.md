# Production Deployment Checklist

Complete checklist for deploying Discord Q&A Bot to Heroku and Firebase.

## Pre-Deployment Setup

### Discord Developer Portal
- [ ] Create Discord application at https://discord.com/developers
- [ ] Enable **MESSAGE_CONTENT INTENT** (critical!)
- [ ] Enable Server Members Intent
- [ ] Copy Bot Token → `DISCORD_TOKEN`
- [ ] Copy Application ID → `DISCORD_CLIENT_ID`
- [ ] Generate OAuth2 invite URL with:
  - Scopes: `bot`, `applications.commands`
  - Permissions: `274878221376` (Read, Send, Manage Messages, etc.)

### Firebase Console
- [ ] Create Firebase project at https://console.firebase.google.com
- [ ] Enable Firestore Database (production mode)
- [ ] Enable Storage
- [ ] Enable Authentication (optional, for dashboard)
- [ ] Generate service account key (Project Settings → Service Accounts)
- [ ] Note down:
  - Project ID
  - Client Email
  - Private Key
  - Web app config (for dashboard)

### Google Cloud
- [ ] Get Gemini API key from https://makersuite.google.com/app/apikey

### Whop (Optional)
- [ ] Get API key from Whop dashboard
- [ ] Note Product ID for Pro tier

## Code Preparation

### Repository Setup
- [ ] Code committed to branch: `deploy/bot-dashboard-heroku-firebase`
- [ ] Dependencies installed: `npm install`
- [ ] Build succeeds: `npm run build`
- [ ] dist/ folder contains compiled JavaScript

### Configuration Files
- [ ] `Procfile` exists with web and worker processes
- [ ] `firebase.json` configured for hosting
- [ ] `firestore.rules` configured for production
- [ ] `firestore.indexes.json` has required indexes
- [ ] `.gitignore` excludes secrets and credentials
- [ ] `app.json` defines Heroku config

## Heroku Deployment

### 1. Create App
```bash
heroku login
heroku create your-app-name
```
- [ ] App created
- [ ] App URL noted: `https://your-app-name.herokuapp.com`

### 2. Set Environment Variables
```bash
# Discord
heroku config:set DISCORD_TOKEN="..."
heroku config:set DISCORD_CLIENT_ID="..."

# Gemini
heroku config:set GEMINI_API_KEY="..."

# Whop
heroku config:set WHOP_API_KEY="..."

# Firebase
heroku config:set FIREBASE_PROJECT_ID="..."
heroku config:set FIREBASE_CLIENT_EMAIL="..."
heroku config:set FIREBASE_PRIVATE_KEY="..."

# App config
heroku config:set NODE_ENV="production"
heroku config:set FREE_TIER_MESSAGE_LIMIT="100"
```

- [ ] All environment variables set
- [ ] `heroku config` shows all vars
- [ ] `FIREBASE_PRIVATE_KEY` newlines escaped correctly

### 3. Deploy Code
```bash
git push heroku deploy/bot-dashboard-heroku-firebase:main
```
- [ ] Build succeeds
- [ ] No build errors
- [ ] Deployment complete

### 4. Scale Dynos
```bash
heroku ps:scale worker=1 web=1
```
- [ ] Worker dyno running (Discord bot)
- [ ] Web dyno running (API server)
- [ ] `heroku ps` shows both dynos active

### 5. Verify Deployment
```bash
heroku logs --tail
curl https://your-app-name.herokuapp.com/health
```
- [ ] Worker logs show: "Logged in as BotName#1234"
- [ ] Worker logs show: "Slash commands registered"
- [ ] Web logs show: "Server is running on port XXXX"
- [ ] Health endpoint returns OK

## Firebase Hosting Deployment

### 1. Configure Dashboard
```bash
cd web
cp .env.example .env
```
Edit `web/.env`:
- [ ] `VITE_FIREBASE_API_KEY` set
- [ ] `VITE_FIREBASE_AUTH_DOMAIN` set
- [ ] `VITE_FIREBASE_PROJECT_ID` set
- [ ] `VITE_FIREBASE_STORAGE_BUCKET` set
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID` set
- [ ] `VITE_FIREBASE_APP_ID` set
- [ ] `VITE_API_BASE_URL` set to Heroku URL

### 2. Build Dashboard
```bash
cd web
npm install
npm run build
```
- [ ] Build succeeds
- [ ] `web/dist/` folder exists
- [ ] `web/dist/index.html` exists

### 3. Deploy to Firebase
```bash
firebase login
firebase use --add  # Select your project
firebase deploy --only hosting
```
- [ ] Deploy succeeds
- [ ] Hosting URL provided
- [ ] URLs noted:
  - `https://your-project.web.app`
  - `https://your-project.firebaseapp.com`

### 4. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```
- [ ] Rules deployed
- [ ] Indexes deployed

### 5. Update CORS in Heroku
```bash
heroku config:set ALLOWED_ORIGINS="https://your-project.web.app,https://your-project.firebaseapp.com"
heroku restart
```
- [ ] CORS origins set
- [ ] Dynos restarted

## Discord Server Setup

### 1. Invite Bot
- [ ] Use OAuth2 URL from Discord Developer Portal
- [ ] Bot added to test server
- [ ] Bot appears online
- [ ] Bot has correct permissions

### 2. Configure Bot
Run in Discord:
```
/config channel:#qa-channel keywords:help,support,question
```
- [ ] Command executes successfully
- [ ] Bot confirms configuration
- [ ] Channel and keywords saved

## Verification Tests

### Bot Functionality
- [ ] Bot shows online in Discord
- [ ] Bot responds to `/config` command
- [ ] Slash commands registered and visible

### Dashboard Access
- [ ] Dashboard loads at Firebase URL
- [ ] No console errors
- [ ] Can navigate between pages
- [ ] Login works (if authentication enabled)

### API Connection
- [ ] Dashboard can connect to Heroku API
- [ ] No CORS errors in browser console
- [ ] API health check returns success

### Knowledge Base Upload
- [ ] Upload CSV file via dashboard
- [ ] Upload succeeds
- [ ] Data written to Firestore `kbs` collection
- [ ] Upload PDF file via dashboard
- [ ] PDF upload succeeds

### Message Handling
- [ ] Send message with keyword in configured channel
- [ ] Bot responds within 5 seconds
- [ ] Response includes knowledge base context
- [ ] Response is relevant

### Usage Tracking
- [ ] Send multiple messages
- [ ] Usage increments in Firestore
- [ ] Free tier limit enforced at 100 messages/month
- [ ] Limit message shown when exceeded

### Spam Detection
- [ ] Send spam message (e.g., discord.gg/invite)
- [ ] Bot deletes message
- [ ] Server owner receives DM notification
- [ ] Action logged to `moderationLogs` collection

### Trend Logging
- [ ] Questions logged to `trendLogs` collection
- [ ] Timestamps correct
- [ ] Keywords extracted
- [ ] Data queryable

## Monitoring Setup

### Heroku
- [ ] Visit app dashboard: https://dashboard.heroku.com/apps/your-app-name
- [ ] Check metrics: dyno load, memory, response times
- [ ] Set up log drain (optional)
- [ ] Configure alerts for:
  - Dyno crashes
  - High memory usage
  - Error rates

### Firebase
- [ ] Check Firestore usage in Firebase Console
- [ ] Verify collections are populating:
  - `kbs`
  - `usage`
  - `trendLogs`
  - `moderationLogs`
  - `guildConfigs`
- [ ] Check hosting traffic
- [ ] Set up budget alerts

### External Monitoring
- [ ] Set up UptimeRobot or similar for:
  - Heroku health endpoint
  - Firebase hosting URL
- [ ] Configure alerts for downtime

## Documentation

- [ ] Discord invite URL saved and shared
- [ ] Heroku app URL documented
- [ ] Firebase hosting URL documented
- [ ] Environment variables documented (not values!)
- [ ] Deployment process documented
- [ ] Rollback procedure documented

## Post-Deployment

### Immediate (First Hour)
- [ ] Monitor logs continuously
- [ ] Watch for errors or crashes
- [ ] Test all major features
- [ ] Verify performance (<5s response time)

### First 24 Hours
- [ ] Check logs periodically
- [ ] Monitor Firebase quota usage
- [ ] Monitor Heroku dyno metrics
- [ ] Test with real users

### First Week
- [ ] Review usage patterns
- [ ] Check for any errors or crashes
- [ ] Optimize if needed
- [ ] Gather user feedback

## Troubleshooting Resources

If issues occur, refer to:
- [ ] `PRODUCTION_DEPLOYMENT.md` - Full deployment guide
- [ ] `HEROKU_SETUP.md` - Heroku-specific guide
- [ ] `FIREBASE_HOSTING_SETUP.md` - Firebase hosting guide
- [ ] `DISCORD_INVITE.md` - Discord setup guide
- [ ] Heroku logs: `heroku logs --tail`
- [ ] Firebase Console logs
- [ ] Discord Developer Portal

## Rollback Plan

If deployment fails:

### Heroku
```bash
heroku releases
heroku rollback
```

### Firebase Hosting
```bash
# Revert code, rebuild, redeploy
git checkout previous-version
cd web && npm run build
firebase deploy --only hosting
```

### Discord Bot
```bash
# Stop dynos
heroku ps:scale worker=0

# Fix issues
# Redeploy
git push heroku main
heroku ps:scale worker=1
```

## Success Criteria

Deployment is successful when:
- [ ] Bot online and responding in Discord
- [ ] Dashboard accessible and functional
- [ ] Knowledge base uploads working
- [ ] Message handling working with KB context
- [ ] Response time <5 seconds
- [ ] Usage tracking functional
- [ ] Spam detection functional
- [ ] Trend logging functional
- [ ] Free tier limits enforced
- [ ] No critical errors in logs
- [ ] All monitoring in place

## URLs Reference

Save these for quick access:

```
Heroku App: https://your-app-name.herokuapp.com
Heroku Dashboard: https://dashboard.heroku.com/apps/your-app-name
Heroku Logs: https://dashboard.heroku.com/apps/your-app-name/logs

Firebase Hosting: https://your-project.web.app
Firebase Console: https://console.firebase.google.com/project/your-project
Firestore: https://console.firebase.google.com/project/your-project/firestore

Discord Bot Invite: https://discord.com/api/oauth2/authorize?client_id=YOUR_ID&permissions=274878221376&scope=bot%20applications.commands
Discord Developer Portal: https://discord.com/developers/applications/YOUR_ID
```

## Notes

- Free tier Heroku requires credit card for 1000 dyno hours/month (otherwise only 550)
- Running 2 dynos 24/7 requires ~1460 hours = need paid plan ($14/month)
- Firebase free tier: 50k reads, 20k writes/day - sufficient for most use cases
- MESSAGE_CONTENT intent must be enabled or bot cannot read messages
- CORS must include Firebase hosting URLs or API calls will fail
- Private key newlines must be escaped correctly in Heroku config

---

**Deployment Complete!** 🎉

Your Discord Q&A Bot is now live in production!
