# Deployment Guide

This guide explains how to deploy the Discord QA Bot web dashboard to Firebase Hosting.

## Prerequisites

1. **Firebase CLI**: Install globally if not already installed
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase Project**: Create a Firebase project at https://console.firebase.google.com/

3. **Firebase Services**: Enable the following services in your Firebase project:
   - Authentication (Email/Password provider)
   - Firestore Database
   - Cloud Storage
   - Hosting

## Initial Setup

### 1. Firebase Login

```bash
firebase login
```

### 2. Initialize Firebase Project

If not already initialized:

```bash
firebase init
```

Select:
- Hosting
- Configure as a single-page app: Yes
- Set up automatic builds: No
- Overwrite index.html: No

### 3. Link Firebase Project

Update `.firebaserc` with your actual Firebase project ID:

```json
{
  "projects": {
    "default": "your-firebase-project-id"
  }
}
```

Or use the Firebase CLI:

```bash
firebase use --add
```

### 4. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cd web
   cp .env.example .env
   ```

2. Update `web/.env` with your Firebase project configuration:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_API_BASE_URL=https://your-api-domain.com
   ```

You can find these values in:
- Firebase Console → Project Settings → General → Your apps → Web app

## Building and Deploying

### Quick Deploy

From the project root:

```bash
npm run deploy:web
```

This will:
1. Build the web app (`npm run build:web`)
2. Deploy to Firebase Hosting

### Manual Deploy

1. **Build the app**:
   ```bash
   cd web
   npm run build
   ```

2. **Test locally** (optional):
   ```bash
   firebase serve --only hosting
   ```
   
   The app will be available at `http://localhost:5000`

3. **Deploy to Firebase Hosting**:
   ```bash
   firebase deploy --only hosting
   ```

## Deployment with Emulators (Testing)

To test deployment locally with Firebase emulators:

1. **Start emulators**:
   ```bash
   firebase emulators:start
   ```

2. **In another terminal, serve the hosting**:
   ```bash
   cd web
   npm run build
   firebase emulators:start --only hosting
   ```

3. Access the emulator UI at `http://localhost:4000`

## Production Deployment Checklist

Before deploying to production:

- [ ] Update `.env` with production Firebase config
- [ ] Set `VITE_API_BASE_URL` to production backend URL
- [ ] Test all authentication flows
- [ ] Verify file upload functionality
- [ ] Test server linking
- [ ] Verify Pro tier features work correctly
- [ ] Check responsive design on mobile
- [ ] Test on multiple browsers
- [ ] Review Firebase security rules
- [ ] Set up Firebase Auth email templates
- [ ] Configure Firebase domain (if using custom domain)

## Custom Domain Setup

To use a custom domain:

1. In Firebase Console, go to Hosting
2. Click "Add custom domain"
3. Follow the wizard to verify domain ownership
4. Update DNS records as instructed
5. Wait for SSL certificate provisioning (can take up to 24 hours)

## CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches:
      - main

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

Add the following secrets to your GitHub repository:
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `API_BASE_URL`
- `FIREBASE_SERVICE_ACCOUNT` (download from Firebase Console → Project Settings → Service Accounts)

## Rollback

To rollback to a previous deployment:

1. View deployment history:
   ```bash
   firebase hosting:channel:list
   ```

2. Rollback to specific version:
   ```bash
   firebase hosting:clone SOURCE_SITE_ID:SOURCE_CHANNEL_ID TARGET_SITE_ID:live
   ```

## Monitoring

Monitor your deployment:

1. **Firebase Console**: https://console.firebase.google.com/
   - Hosting dashboard for traffic and performance
   - Authentication for user activity
   - Firestore for database operations

2. **Firebase Performance Monitoring**: Enable in Firebase Console for detailed performance metrics

3. **Firebase Analytics**: Track user behavior and conversion

## Troubleshooting

### Build Fails

- Ensure all dependencies are installed: `cd web && npm install`
- Clear cache: `rm -rf web/node_modules web/.vite && cd web && npm install`
- Check for TypeScript errors: `cd web && npx tsc --noEmit`

### Deploy Fails

- Verify Firebase CLI is logged in: `firebase login`
- Check project ID in `.firebaserc`
- Ensure you have deploy permissions in Firebase Console

### 404 Errors After Deploy

- Check that `firebase.json` has the correct rewrite rules
- Ensure `public` points to `web/dist`
- Rebuild the app before deploying

### Environment Variables Not Working

- Ensure all environment variables start with `VITE_`
- Rebuild after changing `.env` file
- Variables are embedded at build time, not runtime

## Support

For issues:
1. Check Firebase Console for errors
2. Review deployment logs: `firebase hosting:channel:list`
3. Test locally with emulators first
4. Review Firebase documentation: https://firebase.google.com/docs/hosting
