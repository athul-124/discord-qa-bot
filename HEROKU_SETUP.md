# Heroku Deployment Quick Start

Fast-track guide for deploying to Heroku. For complete details, see [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md).

## Prerequisites

- Heroku account
- Heroku CLI installed
- Discord bot token and client ID
- Firebase service account credentials
- Gemini API key

## Quick Deploy (5 minutes)

### 1. Install Heroku CLI

```bash
# macOS
brew tap heroku/brew && brew install heroku

# Ubuntu/Debian
curl https://cli-assets.heroku.com/install-ubuntu.sh | sh

# Windows
# Download from: https://devcenter.heroku.com/articles/heroku-cli
```

### 2. Login and Create App

```bash
heroku login
heroku create your-app-name
```

### 3. Set Environment Variables

**Required variables:**

```bash
# Discord
heroku config:set DISCORD_TOKEN="your_discord_token"
heroku config:set DISCORD_CLIENT_ID="your_client_id"

# Gemini AI
heroku config:set GEMINI_API_KEY="your_gemini_key"

# Whop
heroku config:set WHOP_API_KEY="your_whop_key"

# Firebase (Option 1: Individual vars - RECOMMENDED)
heroku config:set FIREBASE_PROJECT_ID="your-project-id"
heroku config:set FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
heroku config:set FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
your-private-key-here
-----END PRIVATE KEY-----
"

# App settings
heroku config:set NODE_ENV="production"
heroku config:set FREE_TIER_MESSAGE_LIMIT="100"
```

**Alternative Firebase config (Option 2: Full JSON):**

```bash
# If you prefer, use the full service account JSON
heroku config:set SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'
```

### 4. Deploy

```bash
# Install dependencies and build
npm install
npm run build

# Deploy
git push heroku deploy/bot-dashboard-heroku-firebase:main

# Or if on different branch
git push heroku $(git branch --show-current):main
```

### 5. Scale Dynos

```bash
# Start bot worker
heroku ps:scale worker=1

# Start API web server
heroku ps:scale web=1
```

### 6. Verify

```bash
# Check dyno status
heroku ps

# Watch logs
heroku logs --tail

# Test health endpoint
curl https://your-app-name.herokuapp.com/health
```

## Expected Log Output

**Success messages:**
```
worker.1: Logged in as YourBot#1234
worker.1: Firebase initialized successfully
worker.1: Slash commands registered successfully
worker.1: Daily report job started
web.1: Server is running on port 3000
web.1: Environment: production
```

## Common Issues

### Build Fails

```bash
# Make sure TypeScript compiles
npm run build

# Check for errors
npm run lint
```

### Bot Offline

```bash
# Check worker logs
heroku logs --tail --dyno worker

# Restart worker
heroku restart worker

# Verify DISCORD_TOKEN is set
heroku config:get DISCORD_TOKEN
```

### API Errors

```bash
# Check web logs
heroku logs --tail --dyno web

# Restart web dyno
heroku restart web

# Verify Firebase credentials
heroku config:get FIREBASE_PROJECT_ID
```

### Firebase Connection Failed

**Most common cause:** Newlines in `FIREBASE_PRIVATE_KEY` not properly escaped.

**Fix:**
```bash
# Re-set with proper format (newlines should be actual newlines, not \n literals)
heroku config:set FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
Line1
Line2
Line3
-----END PRIVATE KEY-----
"
```

## Dyno Types Explained

The app uses **two dyno types**:

| Dyno Type | Purpose | Process Command |
|-----------|---------|-----------------|
| `worker` | Discord bot | `node dist/index.js --worker` |
| `web` | Express API | `node dist/index.js --web` |

Both are required for full functionality:
- **worker** - Handles Discord messages, commands, and events
- **web** - Handles dashboard API requests, KB uploads, health checks

## Environment Variables Reference

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DISCORD_TOKEN` | Bot token from Discord Developer Portal | `MTIzNDU2Nzg5...` |
| `DISCORD_CLIENT_ID` | Discord application ID | `123456789012345678` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIzaSy...` |
| `WHOP_API_KEY` | Whop subscription API key | `whop_...` |
| `FIREBASE_PROJECT_ID` | Firebase project ID | `my-project-id` |
| `FIREBASE_CLIENT_EMAIL` | Service account email | `firebase-adminsdk-xxx@my-project.iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | Service account private key | `-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `FREE_TIER_MESSAGE_LIMIT` | Free tier monthly limit | `100` |
| `FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | `{project-id}.appspot.com` |
| `ALLOWED_ORIGINS` | CORS allowed origins | (none) |
| `SERVICE_ACCOUNT_JSON` | Alternative to individual Firebase vars | (none) |

## Update Environment Variables

```bash
# Set/update a variable
heroku config:set KEY=value

# View all variables
heroku config

# View specific variable
heroku config:get KEY

# Remove a variable
heroku config:unset KEY

# After changing variables, restart dynos
heroku restart
```

## Monitoring

```bash
# View all dyno status
heroku ps

# Real-time logs (all dynos)
heroku logs --tail

# Worker logs only
heroku logs --tail --dyno worker

# Web logs only
heroku logs --tail --dyno web

# Last 200 lines
heroku logs -n 200

# Logs since 1 hour ago
heroku logs --since="1 hour ago"
```

## Scaling

```bash
# Scale up
heroku ps:scale worker=2 web=2

# Scale down
heroku ps:scale worker=1 web=1

# Stop all
heroku ps:scale worker=0 web=0

# Check current scale
heroku ps
```

**Note:** Free tier allows 550-1000 dyno hours per month. Running 2 dynos 24/7 uses ~1440 hours.

## Maintenance

### Restart Dynos

```bash
# Restart all dynos
heroku restart

# Restart specific dyno type
heroku restart worker
heroku restart web
```

### View Releases

```bash
# Show deployment history
heroku releases

# Rollback to previous
heroku rollback

# Rollback to specific version
heroku rollback v42
```

### View Build History

```bash
heroku builds
heroku builds:info BUILD_ID
```

## Logs Management

### Enable Log Drain (Optional)

Send logs to external service:

```bash
# Papertrail
heroku addons:create papertrail

# View logs in Papertrail
heroku addons:open papertrail
```

### Enable Metrics (Optional)

```bash
# View in Heroku dashboard
# Go to: https://dashboard.heroku.com/apps/your-app-name/metrics
```

## Cost Estimation

### Free Tier
- 550 free dyno hours per month (unverified account)
- 1000 free dyno hours per month (verified with credit card)
- 2 dynos × 730 hours = 1460 hours needed for 24/7
- **Result:** Free tier insufficient for 24/7 operation without credit card

### Hobby Tier ($7/dyno/month)
- worker: $7/month
- web: $7/month
- **Total:** $14/month for 24/7 operation

### Auto-Sleep on Free Tier
- Free dynos sleep after 30 minutes of inactivity
- Bot will go offline when dyno sleeps
- Not suitable for production Discord bots

**Recommendation:** Use Hobby tier ($14/month) for production.

## Heroku CLI Reference

```bash
# App info
heroku info
heroku apps:info

# Open app in browser
heroku open

# Open Heroku dashboard
heroku dashboard

# Run one-off commands
heroku run bash
heroku run node

# Database (if using Postgres addon)
heroku pg:info
heroku pg:psql

# Addons
heroku addons
heroku addons:create addon-name
heroku addons:open addon-name
```

## Troubleshooting Checklist

When things go wrong:

- [ ] Check `heroku logs --tail` for errors
- [ ] Verify all environment variables are set: `heroku config`
- [ ] Ensure dynos are running: `heroku ps`
- [ ] Test health endpoint: `curl https://your-app.herokuapp.com/health`
- [ ] Check Discord Developer Portal for MESSAGE_CONTENT intent
- [ ] Verify bot token is valid
- [ ] Confirm Firebase credentials are correct
- [ ] Check build succeeded: `heroku builds`
- [ ] Try restarting dynos: `heroku restart`
- [ ] Review recent releases: `heroku releases`

## Getting Help

```bash
# Heroku CLI help
heroku help
heroku help ps
heroku help config

# Check status
https://status.heroku.com/

# Support
https://help.heroku.com/
```

## Next Steps

After successful Heroku deployment:

1. ✅ Deploy dashboard to Firebase Hosting - See [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md#firebase-hosting-deployment)
2. ✅ Update CORS: `heroku config:set ALLOWED_ORIGINS="https://your-project.web.app"`
3. ✅ Generate Discord invite link - See [DISCORD_INVITE.md](./DISCORD_INVITE.md)
4. ✅ Invite bot to Discord server
5. ✅ Configure bot: `/config channel:#qa keywords:help,support`
6. ✅ Upload knowledge base via dashboard
7. ✅ Test bot responses
8. ✅ Monitor logs for first 24 hours

## Quick Links

- **Heroku Dashboard**: https://dashboard.heroku.com/apps/your-app-name
- **Heroku Logs**: https://dashboard.heroku.com/apps/your-app-name/logs
- **Heroku Metrics**: https://dashboard.heroku.com/apps/your-app-name/metrics
- **Heroku Settings**: https://dashboard.heroku.com/apps/your-app-name/settings
- **Heroku Documentation**: https://devcenter.heroku.com/

---

**Deployment Status:**
- Bot: ✅ Running on Heroku worker dyno
- API: ✅ Running on Heroku web dyno
- Dashboard: ⏳ Deploy to Firebase Hosting next

**Health Check:** `https://your-app-name.herokuapp.com/health`
