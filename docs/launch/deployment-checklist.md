# Deployment Checklist

## Pre-Deployment Setup

### Repository & Code
- [ ] All tests passing locally
- [ ] Code linted and formatted
- [ ] Dependencies locked with exact versions
- [ ] Security audit completed (npm audit / pip check)
- [ ] Environment-specific configs separated
- [ ] Secrets removed from codebase
- [ ] .gitignore properly configured

### Infrastructure Accounts
- [ ] Firebase project created
- [ ] Heroku account set up
- [ ] Whop developer account approved
- [ ] Domain registered (if custom domain)
- [ ] SSL certificates obtained
- [ ] Database provisioned (if applicable)
- [ ] Redis/cache service ready (if applicable)

## Firebase Hosting Deployment (Dashboard)

### Environment Variables
Create `.env.production` file with the following variables:

| Variable Name | Description | Example | Required |
|---------------|-------------|---------|----------|
| `REACT_APP_API_URL` | Backend API endpoint | `https://api.yourbot.com` | Yes |
| `REACT_APP_WHOP_CLIENT_ID` | Whop OAuth client ID | `whop_xxxxxxxxxxxxx` | Yes |
| `REACT_APP_WHOP_REDIRECT_URI` | OAuth callback URL | `https://dashboard.yourbot.com/auth/callback` | Yes |
| `REACT_APP_BOT_INVITE_URL` | Discord bot invite link | `https://discord.com/api/oauth2/authorize?client_id=...` | Yes |
| `REACT_APP_FIREBASE_API_KEY` | Firebase config | `AIzaSy...` | Yes |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | `yourapp.firebaseapp.com` | Yes |
| `REACT_APP_FIREBASE_PROJECT_ID` | Firebase project ID | `yourapp-12345` | Yes |
| `REACT_APP_ANALYTICS_ID` | Google Analytics ID | `G-XXXXXXXXXX` | No |
| `REACT_APP_ENVIRONMENT` | Deployment environment | `production` | Yes |

### Deployment Steps

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Initialize Firebase Project**
   ```bash
   firebase init hosting
   # Select existing project
   # Set build directory: build (or dist)
   # Configure as single-page app: Yes
   # Set up automatic builds and deploys: No (for now)
   ```

3. **Build Production Assets**
   ```bash
   npm run build
   # Verify build output in build/ directory
   # Check bundle size (should be < 5MB total)
   ```

4. **Deploy to Firebase**
   ```bash
   firebase deploy --only hosting
   # Note the deployed URL
   ```

5. **Configure Custom Domain (Optional)**
   ```bash
   firebase hosting:channel:deploy production
   # Add custom domain in Firebase Console
   # Update DNS records as instructed
   # Wait for SSL provisioning (up to 24hrs)
   ```

### Verification Tests

- [ ] Dashboard loads at deployed URL
- [ ] No console errors in browser devtools
- [ ] Whop OAuth login flow completes successfully
- [ ] Dashboard fetches data from API correctly
- [ ] File upload interface functional
- [ ] Analytics tracking events fire
- [ ] Mobile responsive layout works
- [ ] All links/buttons functional
- [ ] SSL certificate valid (check with SSL Labs)
- [ ] Performance: Lighthouse score > 90

## Heroku Deployment (Bot Backend)

### Environment Variables
Configure in Heroku Dashboard or via CLI:

| Variable Name | Description | Example | Required |
|---------------|-------------|---------|----------|
| `DISCORD_BOT_TOKEN` | Bot token from Discord Dev Portal | `MTIzNDU2Nzg5MDEyMzQ1Njc4OQ...` | Yes |
| `DISCORD_CLIENT_ID` | Discord application client ID | `123456789012345678` | Yes |
| `DISCORD_CLIENT_SECRET` | Discord OAuth secret | `abcdef123456...` | Yes |
| `WHOP_API_KEY` | Whop API key for subscription checks | `whop_sk_xxxxx` | Yes |
| `WHOP_WEBHOOK_SECRET` | Whop webhook signing secret | `whsec_xxxxx` | Yes |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` | Yes |
| `REDIS_URL` | Redis connection string for cache | `redis://host:6379` | Yes |
| `OPENAI_API_KEY` | OpenAI API key | `sk-proj-xxxxx` | Yes |
| `PINECONE_API_KEY` | Pinecone vector DB key | `xxxxx-xxxxx` | Yes |
| `PINECONE_ENVIRONMENT` | Pinecone environment | `us-west1-gcp` | Yes |
| `PINECONE_INDEX_NAME` | Pinecone index name | `discord-qa-bot-prod` | Yes |
| `JWT_SECRET` | Secret for JWT token signing | `random-256-bit-string` | Yes |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` | Yes |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) | `60000` | Yes |
| `LOG_LEVEL` | Logging level | `info` | Yes |
| `NODE_ENV` | Environment | `production` | Yes |
| `SENTRY_DSN` | Sentry error tracking DSN | `https://xxx@sentry.io/xxx` | No |
| `SUPPORT_EMAIL` | Support contact email | `support@yourbot.com` | Yes |

### Deployment Steps

1. **Create Heroku App**
   ```bash
   heroku login
   heroku create discord-qa-bot-prod
   ```

2. **Add Required Add-ons**
   ```bash
   # PostgreSQL database
   heroku addons:create heroku-postgresql:mini
   
   # Redis cache
   heroku addons:create heroku-redis:mini
   
   # Papertrail logging (optional)
   heroku addons:create papertrail:choklad
   ```

3. **Configure Environment Variables**
   ```bash
   # Set all environment variables
   heroku config:set DISCORD_BOT_TOKEN="your-token-here"
   heroku config:set WHOP_API_KEY="your-key-here"
   # ... (continue for all variables)
   
   # Verify all variables set
   heroku config
   ```

4. **Deploy Application**
   ```bash
   # Add Heroku remote
   heroku git:remote -a discord-qa-bot-prod
   
   # Deploy
   git push heroku prep-whop-launch-assets:main
   
   # Or use main branch
   git push heroku main
   ```

5. **Scale Dynos**
   ```bash
   # For MVP, start with basic dyno
   heroku ps:scale web=1 worker=1
   
   # Check status
   heroku ps
   ```

6. **Run Database Migrations**
   ```bash
   heroku run npm run migrate:latest
   # or
   heroku run python manage.py migrate
   ```

### Verification Tests

- [ ] App deployed successfully (heroku logs --tail shows no errors)
- [ ] Health check endpoint responds: `curl https://your-app.herokuapp.com/health`
- [ ] Database connection working
- [ ] Redis connection working
- [ ] Discord bot shows online in Discord
- [ ] Bot responds to test question in Discord
- [ ] Response time < 5 seconds for typical query
- [ ] Whop subscription check working (test with valid/invalid subs)
- [ ] Rate limiting functional (test with rapid requests)
- [ ] Error logging to Sentry (trigger test error)
- [ ] Webhook endpoint receives Whop events
- [ ] File upload and processing working
- [ ] Vector search returning relevant results

## Discord Bot Configuration

### Bot Setup in Discord Developer Portal

- [ ] Bot user created with appropriate username/avatar
- [ ] Required intents enabled:
  - [ ] Guild Messages
  - [ ] Message Content
  - [ ] Guild Members (if using member features)
- [ ] OAuth2 URL generated with correct scopes:
  - [ ] `bot`
  - [ ] `applications.commands`
- [ ] Bot permissions set:
  - [ ] Read Messages/View Channels
  - [ ] Send Messages
  - [ ] Embed Links
  - [ ] Attach Files
  - [ ] Read Message History
  - [ ] Add Reactions
  - [ ] Use Slash Commands

### Bot Invite URL Template
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=277025508416&scope=bot%20applications.commands
```

## Whop Integration

### App Configuration

- [ ] Whop app created and submitted for review
- [ ] Webhook URL configured: `https://your-api.herokuapp.com/webhooks/whop`
- [ ] Webhook events subscribed:
  - [ ] `payment.succeeded`
  - [ ] `payment.refunded`
  - [ ] `membership.went_valid`
  - [ ] `membership.went_invalid`
- [ ] OAuth redirect URLs whitelisted
- [ ] Pricing plans created matching listing
- [ ] API credentials secured in environment variables

### Testing Subscription Flow

- [ ] Test purchase flow in Whop sandbox
- [ ] Verify webhook received and processed
- [ ] Confirm user access granted in dashboard
- [ ] Test bot permissions update in Discord
- [ ] Verify access revoked on subscription cancel
- [ ] Test upgrade/downgrade tier changes

## Performance & Monitoring

### Performance Targets

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| Bot Response Time | < 3s | < 5s |
| Dashboard Load Time | < 2s | < 4s |
| API Response Time | < 500ms | < 1s |
| Document Processing | < 2min | < 5min |
| Uptime | > 99.5% | > 99% |
| Error Rate | < 0.1% | < 1% |

### Monitoring Setup

- [ ] Health check endpoints configured
- [ ] Uptime monitoring (UptimeRobot, Pingdom, etc.)
- [ ] Error tracking (Sentry, Rollbar, etc.)
- [ ] Performance monitoring (New Relic, DataDog, etc.)
- [ ] Log aggregation (Papertrail, Loggly, etc.)
- [ ] Alerts configured for:
  - [ ] API errors
  - [ ] Bot offline
  - [ ] High response times
  - [ ] Rate limit hits
  - [ ] Database connection issues
  - [ ] High memory/CPU usage

## Security Checklist

- [ ] All secrets in environment variables (not code)
- [ ] HTTPS enforced on all endpoints
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitized outputs)
- [ ] CSRF tokens where applicable
- [ ] Webhook signature verification
- [ ] JWT tokens with expiration
- [ ] Secure password hashing (if applicable)
- [ ] Dependencies vulnerability scan clean
- [ ] Bot permissions principle of least privilege

## Pre-Launch Final Checks

- [ ] Terms of Service published
- [ ] Privacy Policy published
- [ ] Support documentation complete
- [ ] Support email monitored
- [ ] Billing flow tested end-to-end
- [ ] Refund process documented
- [ ] Backup strategy in place
- [ ] Rollback plan documented
- [ ] Team notified of launch timing
- [ ] Social media accounts ready
- [ ] Analytics/tracking tested
- [ ] Customer onboarding email configured
- [ ] Success metrics tracking setup

## Post-Deployment Monitoring (First 48 Hours)

- [ ] Hour 1: Monitor logs for errors
- [ ] Hour 2: Check first user signups
- [ ] Hour 4: Verify analytics data flowing
- [ ] Hour 8: Review performance metrics
- [ ] Hour 24: Check subscription conversions
- [ ] Hour 48: Analyze user feedback
- [ ] Week 1: Review all metrics and iterate

## Rollback Procedure

If critical issues arise:

1. **Dashboard Rollback**
   ```bash
   firebase hosting:rollback
   ```

2. **Backend Rollback**
   ```bash
   heroku rollback
   # or to specific version
   heroku releases
   heroku rollback v12
   ```

3. **Communication**
   - Post status update on Discord
   - Send email to affected subscribers
   - Update status page

4. **Investigation**
   - Pull error logs
   - Reproduce issue locally
   - Fix and redeploy

## Support Resources

- Heroku Status: https://status.heroku.com
- Firebase Status: https://status.firebase.google.com
- Discord Status: https://discordstatus.com
- Whop Support: https://whop.com/help
