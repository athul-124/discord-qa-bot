# Quick Start Guide

Get the Discord QA Bot web dashboard up and running in minutes.

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Firebase account (optional for local dev)
- Git

## 1. Install Dependencies

```bash
cd web
npm install
```

## 2. Configure Environment

```bash
cd web
cp .env.example .env
```

Edit `.env` and add your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_BASE_URL=http://localhost:3001
```

**Don't have Firebase yet?** Use the demo values in `.env` for local development.

## 3. Start Development Server

```bash
npm run dev
```

The dashboard will open at http://localhost:3000

## 4. (Optional) Start Backend Mock Server

For testing API integration without a real backend:

```bash
# In a new terminal
cd docs/examples
npm install express cors multer
node mock-server.js
```

Mock server runs at http://localhost:3001

## 5. Test the Dashboard

### Login
1. Go to http://localhost:3000
2. Enter any email and password (mock auth)
3. Or check "Use magic link instead" and enter email

### Dashboard
1. Enter a server ID (e.g., `123456789` for free tier or `987654321` for pro tier)
2. View usage metrics

### Upload KB
1. Navigate to "Upload KB"
2. Drag and drop a CSV or PDF file (or click to select)
3. Click "Upload Knowledge Base"

### Link Server
1. Navigate to "Link Server"
2. Enter server ID and Whop token
3. Click "Link Server"
4. View subscription tier

### Trends (Pro Only)
1. Navigate to "Trends"
2. If pro tier: View analytics
3. If free tier: See upgrade prompt

## Common Commands

```bash
# Development
npm run dev                 # Start dev server
npm run dev:web             # Same as above

# Building
npm run build               # Build for production
npm run build:web           # Same as above

# Preview production build
npm run preview

# Deployment
npm run deploy:web          # Build and deploy to Firebase
```

## With Firebase Emulators

### Install Firebase CLI
```bash
npm install -g firebase-tools
```

### Start Emulators
```bash
# From project root
firebase emulators:start
```

This starts:
- Auth: http://localhost:9099
- Firestore: http://localhost:8080
- Storage: http://localhost:9199
- Hosting: http://localhost:5000
- UI: http://localhost:4000

### Use Emulators
The app automatically connects to emulators in development mode.

## Testing Different Scenarios

### Test Free Tier User
- Server ID: `123456789`
- Usage: 150/1000 questions
- No access to Trends

### Test Pro Tier User
- Server ID: `987654321`
- Usage: 450/10000 questions
- Full access to Trends

### Test File Upload
- Drag any `.csv` or `.pdf` file < 10MB
- Upload should succeed with mock server

### Test Error Handling
- Try uploading `.txt` file (should fail)
- Try uploading file > 10MB (should fail)
- Try accessing Trends with free tier (upgrade prompt)

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- --port 3001
```

### Dependencies Not Installing
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install
```

### Build Errors
```bash
# Clear build cache
rm -rf node_modules/.vite dist
npm install
npm run build
```

### Firebase Connection Issues
- Check `.env` configuration
- Verify Firebase project exists
- Check emulators are running
- Clear browser cache

## Next Steps

1. **Read Documentation**
   - [README.md](README.md) - Project overview
   - [FEATURES.md](docs/FEATURES.md) - Feature details
   - [API.md](docs/API.md) - API documentation

2. **Set Up Firebase**
   - Create Firebase project
   - Enable Auth, Firestore, Storage
   - Update `.firebaserc` with project ID

3. **Deploy**
   - Follow [DEPLOYMENT.md](DEPLOYMENT.md)
   - Deploy to Firebase Hosting

4. **Integrate Backend**
   - Implement backend API
   - Update `VITE_API_BASE_URL`
   - Test end-to-end flows

## Tips

### Development
- Use React DevTools extension
- Enable verbose logging in console
- Check Network tab for API calls
- Use Firebase Emulator UI for debugging

### Code Style
- Follow existing patterns
- Use TypeScript types
- Apply Tailwind utilities
- Write functional components

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes
git add .
git commit -m "Add my feature"

# Push to remote
git push origin feature/my-feature
```

## Getting Help

- Check [TESTING.md](TESTING.md) for test scenarios
- Review [docs/](docs/) for detailed docs
- Check console for errors
- Review Firebase logs

## Quick Reference

### File Structure
```
web/src/
├── components/    # Reusable UI
├── pages/        # Route pages
├── hooks/        # Custom hooks
├── lib/          # Utilities
└── types/        # TypeScript types
```

### Key Files
- `src/App.tsx` - Router setup
- `src/lib/firebase.ts` - Firebase config
- `src/lib/api.ts` - API client
- `src/hooks/useAuth.tsx` - Auth hook
- `.env` - Environment config

### Important URLs
- Dev: http://localhost:3000
- Mock API: http://localhost:3001
- Emulator UI: http://localhost:4000
- Hosting Emulator: http://localhost:5000

---

**You're all set!** Start building amazing features. 🚀
