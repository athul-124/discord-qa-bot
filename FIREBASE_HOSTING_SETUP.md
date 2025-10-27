# Firebase Hosting Deployment Guide

Quick guide to deploying the dashboard to Firebase Hosting.

## Prerequisites

- Firebase project created
- Firebase CLI installed
- Heroku app deployed and running
- Node.js and npm installed

## Quick Deploy (3 minutes)

### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
firebase --version
```

### 2. Login to Firebase

```bash
firebase login
```

This will open a browser for authentication.

### 3. Link Firebase Project

```bash
# Use existing project
firebase use --add

# Select your project from the list
# Give it an alias (e.g., "production")
```

Or update `.firebaserc`:

```json
{
  "projects": {
    "default": "your-firebase-project-id"
  }
}
```

### 4. Configure Dashboard Environment

```bash
cd web
cp .env.example .env
nano .env
```

Edit `web/.env`:

```env
# Get these from Firebase Console → Project Settings → General → Your apps
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# Your Heroku app URL
VITE_API_BASE_URL=https://your-app-name.herokuapp.com
```

### 5. Build Dashboard

```bash
cd web
npm install
npm run build
```

Verify build output:
```bash
ls -la dist/
# Should contain: index.html, assets/, etc.
```

### 6. Deploy to Firebase Hosting

```bash
# From project root
firebase deploy --only hosting

# Or from web directory
cd web
npm run deploy:web
```

### 7. Get Hosting URL

Firebase will output:
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/your-project-id/overview
Hosting URL: https://your-project-id.web.app
```

Save these URLs:
- `https://your-project-id.web.app`
- `https://your-project-id.firebaseapp.com`

### 8. Update CORS in Heroku

```bash
# Add your Firebase Hosting URLs to CORS allowlist
heroku config:set ALLOWED_ORIGINS="https://your-project-id.web.app,https://your-project-id.firebaseapp.com"

# Restart to apply
heroku restart
```

## Verify Deployment

### 1. Open Dashboard

Visit: `https://your-project-id.web.app`

### 2. Test API Connection

Open browser console and check for:
- No CORS errors
- API requests to Heroku app succeed

### 3. Test Upload

1. Login to dashboard (if authentication enabled)
2. Navigate to KB upload page
3. Upload a test CSV file
4. Verify upload succeeds

## Firebase Hosting Configuration

The `firebase.json` file configures hosting:

```json
{
  "hosting": {
    "public": "web/dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

Key settings:
- **public**: Points to `web/dist` (Vite build output)
- **rewrites**: SPA routing - all routes serve `index.html`
- **headers**: Cache static assets for 1 year

## Updating the Dashboard

When you make changes:

```bash
# 1. Update environment if needed
cd web
nano .env

# 2. Rebuild
npm run build

# 3. Redeploy
cd ..
firebase deploy --only hosting

# Or one command
cd web && npm run deploy:web
```

## Custom Domain (Optional)

### 1. Add Custom Domain

1. Go to Firebase Console → Hosting
2. Click "Add custom domain"
3. Enter your domain (e.g., `bot.yourdomain.com`)
4. Click "Continue"

### 2. Verify Ownership

Follow Firebase instructions to verify domain ownership:
- Add TXT record to DNS
- Wait for verification (can take minutes to hours)

### 3. Update DNS Records

Add Firebase's recommended DNS records:
- Usually an A record to Firebase IPs
- Or CNAME to Firebase hosting

### 4. Wait for SSL

Firebase automatically provisions SSL certificate.
This can take up to 24 hours.

### 5. Update CORS

```bash
heroku config:set ALLOWED_ORIGINS="https://bot.yourdomain.com,https://your-project-id.web.app,https://your-project-id.firebaseapp.com"
```

## Firebase Console

Access your hosting dashboard:
```
https://console.firebase.google.com/project/your-project-id/hosting
```

View:
- Deployment history
- Traffic stats
- Performance metrics
- Usage quotas

## Deployment History

View previous deployments:

```bash
firebase hosting:channel:list
```

Firebase keeps deployment history, but rollback is manual:
1. Checkout previous version in Git
2. Rebuild
3. Redeploy

## Preview Channels (Optional)

Deploy to preview URL before production:

```bash
# Create preview channel
firebase hosting:channel:deploy preview

# Deploy to specific channel
firebase hosting:channel:deploy staging

# Access at:
# https://your-project-id--preview-random123.web.app
```

## Environment-Specific Builds

### Development Build

```bash
cd web
npm run dev
# Access at http://localhost:5173
```

### Production Build

```bash
cd web
npm run build
npm run preview
# Access at http://localhost:4173
```

## Troubleshooting

### Build Fails

```bash
cd web

# Clear cache
rm -rf node_modules dist .vite
npm install

# Try build again
npm run build

# Check for TypeScript errors
npx tsc --noEmit
```

### Dashboard Shows Blank Page

**Causes:**
- Build failed
- Wrong public directory in firebase.json
- Environment variables not set during build

**Fix:**
```bash
# Verify build output exists
ls -la web/dist/

# Check firebase.json public path
cat firebase.json | grep public

# Rebuild with env vars
cd web
cat .env
npm run build
cd ..
firebase deploy --only hosting
```

### API Requests Fail (CORS)

**Symptoms:** Console shows CORS errors

**Fix:**
```bash
# Verify ALLOWED_ORIGINS is set in Heroku
heroku config:get ALLOWED_ORIGINS

# Add Firebase URLs
heroku config:set ALLOWED_ORIGINS="https://your-project-id.web.app,https://your-project-id.firebaseapp.com"

# Restart Heroku
heroku restart web
```

### 404 on Refresh

**Cause:** Missing rewrite rules

**Fix:** Ensure `firebase.json` has:
```json
"rewrites": [
  {
    "source": "**",
    "destination": "/index.html"
  }
]
```

### Deployment Takes Too Long

Firebase deployment is usually fast (<1 minute).

If slow:
- Check internet connection
- Try: `firebase deploy --only hosting --debug`
- Clear Firebase CLI cache: `rm -rf ~/.config/firebase`

## Firebase CLI Commands

```bash
# Deploy hosting only
firebase deploy --only hosting

# Deploy with debug output
firebase deploy --only hosting --debug

# Deploy specific project
firebase deploy --only hosting --project your-project-id

# Deploy firestore rules
firebase deploy --only firestore:rules

# Deploy all indexes
firebase deploy --only firestore:indexes

# Deploy everything
firebase deploy

# Open Firebase Console
firebase open hosting

# List projects
firebase projects:list

# Switch project
firebase use another-project

# Logout
firebase logout
```

## CI/CD Integration (Optional)

### GitHub Actions

Create `.github/workflows/deploy-hosting.yml`:

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches:
      - main
    paths:
      - 'web/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: cd web && npm ci
        
      - name: Build
        run: cd web && npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.FIREBASE_APP_ID }}
          VITE_API_BASE_URL: ${{ secrets.API_BASE_URL }}
          
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: your-firebase-project-id
          channelId: live
```

Add secrets to GitHub repository settings.

## Monitoring

### View Hosting Metrics

Firebase Console → Hosting:
- Requests per second
- Bandwidth usage
- Geographic distribution
- Error rates

### Performance Monitoring

Enable Firebase Performance:

```bash
# Install performance library
cd web
npm install firebase/performance

# Add to your app
import { getPerformance } from 'firebase/performance';
const perf = getPerformance(app);
```

### Analytics

Enable Google Analytics in Firebase:
1. Firebase Console → Analytics
2. Enable Analytics
3. Add to your web app

## Cost & Quotas

### Free Tier (Spark Plan)
- 10 GB storage
- 360 MB/day downloads
- 10 GB/month bandwidth
- Usually sufficient for small-medium deployments

### Pay-as-you-go (Blaze Plan)
- Same free tier included
- Additional usage:
  - Storage: $0.026/GB/month
  - Bandwidth: $0.15/GB
  - Operations: minimal cost

### Check Usage

```bash
# View in Firebase Console
open https://console.firebase.google.com/project/your-project-id/usage

# Or via CLI
firebase projects:list
```

## Security

### Headers

Firebase Hosting automatically adds:
- SSL/TLS encryption
- Security headers
- DDoS protection

### Custom Headers

Add to `firebase.json`:

```json
"headers": [
  {
    "source": "**",
    "headers": [
      {
        "key": "X-Content-Type-Options",
        "value": "nosniff"
      },
      {
        "key": "X-Frame-Options",
        "value": "DENY"
      },
      {
        "key": "X-XSS-Protection",
        "value": "1; mode=block"
      }
    ]
  }
]
```

## Quick Reference

### URLs to Save

```
Production Dashboard: https://your-project-id.web.app
Alternative URL: https://your-project-id.firebaseapp.com
Firebase Console: https://console.firebase.google.com/project/your-project-id
Hosting Dashboard: https://console.firebase.google.com/project/your-project-id/hosting
```

### Environment Variables Checklist

In `web/.env`:
- [ ] `VITE_FIREBASE_API_KEY`
- [ ] `VITE_FIREBASE_AUTH_DOMAIN`
- [ ] `VITE_FIREBASE_PROJECT_ID`
- [ ] `VITE_FIREBASE_STORAGE_BUCKET`
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `VITE_FIREBASE_APP_ID`
- [ ] `VITE_API_BASE_URL` (Heroku URL)

### Deployment Checklist

- [ ] Firebase project created
- [ ] Firebase CLI installed and logged in
- [ ] `web/.env` configured with correct values
- [ ] `npm run build` succeeds
- [ ] `firebase deploy --only hosting` succeeds
- [ ] Dashboard accessible at hosting URL
- [ ] No CORS errors in browser console
- [ ] API connection to Heroku works
- [ ] ALLOWED_ORIGINS set in Heroku
- [ ] File upload works

---

**Dashboard Deployed!** 🎉

Access your dashboard at: `https://your-project-id.web.app`

Next: Configure your Discord server and upload knowledge base files!
