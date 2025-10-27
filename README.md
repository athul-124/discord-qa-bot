# Discord QA Bot

A Discord bot with a web dashboard for managing knowledge bases, monitoring usage, and linking servers with Whop subscriptions.

## Project Structure

```
discord-qa-bot/
├── web/                  # Web dashboard (Vite + React + TypeScript)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── README.md
├── firebase.json         # Firebase Hosting configuration
├── .firebaserc          # Firebase project configuration
└── README.md            # This file
```

## Features

### Web Dashboard
- **Authentication**: Firebase Auth with email/password and magic link support
- **Dashboard Home**: View usage metrics, monthly count, and remaining quota
- **Knowledge Base Uploader**: Drag-and-drop file upload for CSV/PDF files
- **Server Linking**: Link Discord servers with Whop subscriptions
- **Trends & Insights**: Advanced analytics for Pro tier subscribers

## Quick Start

### Web Dashboard Development

```bash
# Install dependencies
cd web
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Firebase configuration

# Start development server
npm run dev:web
```

The dashboard will be available at `http://localhost:3000`.

### Building for Production

```bash
# Build the web dashboard
cd web
npm run build:web

# Deploy to Firebase Hosting
npm run deploy:web
```

## Documentation

- [Web Dashboard README](web/README.md) - Detailed documentation for the web dashboard

## Requirements

- Node.js 18+
- Firebase project with Auth, Firestore, and Storage enabled
- Backend API (to be implemented) running on port 3001

## Environment Variables

See `web/.env.example` for required environment variables.

## License

MIT
