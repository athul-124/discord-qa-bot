# Discord QA Bot - Web Dashboard

Web dashboard for managing the Discord QA Bot, built with Vite, React, TypeScript, and Firebase.

## Features

- **Authentication**: Firebase Auth with email/password and magic link support
- **Dashboard Home**: View usage metrics, monthly count, and remaining quota
- **Knowledge Base Uploader**: Drag-and-drop file upload for CSV/PDF files
- **Server Linking**: Link Discord servers with Whop subscriptions
- **Trends & Insights**: Advanced analytics for Pro tier subscribers (Pro feature)

## Setup

### Prerequisites

- Node.js 18+ and npm
- Firebase project with Auth, Firestore, and Storage enabled
- Backend API running (see main README)

### Installation

```bash
cd web
npm install
```

### Environment Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your Firebase configuration:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_API_BASE_URL=http://localhost:3001
   ```

## Development

### Local Development

Run the development server:

```bash
npm run dev
# or
npm run dev:web
```

The dashboard will be available at `http://localhost:3000`.

### With Firebase Emulators

To use Firebase emulators for local development:

1. Start the Firebase emulators (from project root):
   ```bash
   firebase emulators:start
   ```

2. In another terminal, start the web dev server:
   ```bash
   cd web
   npm run dev
   ```

The app will automatically connect to the Firebase emulators when running in development mode.

## Building

Build the production-ready app:

```bash
npm run build
# or
npm run build:web
```

Build artifacts will be output to `web/dist/`.

## Deployment

### Deploy to Firebase Hosting

1. Build the app:
   ```bash
   npm run build:web
   ```

2. Deploy to Firebase Hosting:
   ```bash
   npm run deploy:web
   # or from project root:
   firebase deploy --only hosting
   ```

### Manual Deployment

If you need to deploy manually:

```bash
cd web
npm run build
firebase deploy --only hosting
```

## Project Structure

```
web/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── Layout.tsx
│   │   ├── Loading.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── ToastContainer.tsx
│   ├── pages/            # Page components
│   │   ├── Dashboard.tsx
│   │   ├── LinkServer.tsx
│   │   ├── Login.tsx
│   │   ├── Trends.tsx
│   │   └── UploadKB.tsx
│   ├── hooks/            # Custom React hooks
│   │   ├── useAuth.tsx
│   │   └── useToast.tsx
│   ├── lib/              # Utilities and configurations
│   │   ├── api.ts
│   │   └── firebase.ts
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── public/               # Static assets
├── index.html            # HTML template
├── vite.config.ts        # Vite configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies and scripts
```

## API Integration

The dashboard integrates with the following backend endpoints:

- `GET /usage?serverId={id}` - Fetch usage metrics
- `POST /link-server` - Link a Discord server with Whop subscription
- `POST /upload-kb` - Upload knowledge base files
- `GET /trends?serverId={id}` - Fetch trends and insights (Pro tier)
- `POST /auth/whop-exchange` - Exchange Whop token for Firebase token

## Features by Tier

### Free Tier
- Basic dashboard with usage metrics
- Knowledge base file upload
- Server linking

### Pro Tier
- All Free tier features
- Advanced trends and insights
- Topic analysis
- Daily usage charts
- Average response time metrics

## Troubleshooting

### Firebase Emulator Connection Issues

If you can't connect to Firebase emulators:

1. Ensure emulators are running: `firebase emulators:start`
2. Check that ports 9099 (Auth), 8080 (Firestore), and 9199 (Storage) are not in use
3. Clear browser cache and local storage

### Build Errors

If you encounter build errors:

1. Clear node_modules: `rm -rf node_modules && npm install`
2. Clear Vite cache: `rm -rf node_modules/.vite`
3. Ensure all dependencies are installed: `npm install`

### Authentication Issues

If authentication isn't working:

1. Verify Firebase configuration in `.env`
2. Check that Firebase Auth is enabled in your Firebase project
3. Ensure invited users are added to Firebase Auth

## License

See main project README.
