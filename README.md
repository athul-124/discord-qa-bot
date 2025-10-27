# discord-qa-bot

A Discord Q&A bot with knowledge base management capabilities.

## Features

- Upload knowledge base files (CSV or PDF)
- Parse and normalize Q&A pairs
- Store entries in Firestore with keyword indexing
- Archive original files in Firebase Storage
- Track ingestion metadata for auditing

## Setup

### Prerequisites

- Node.js 18+ and npm
- Firebase project (or use local emulators)

### Installation

```bash
npm install
```

### Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update `.env` with your Firebase configuration:
```env
PORT=3000
NODE_ENV=development
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

For production with service account:
```env
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/serviceAccountKey.json
```

For local development with emulators:
```env
FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_STORAGE_EMULATOR_HOST=localhost:9199
```

## Usage

### Development

Start the server in development mode with hot reload:

```bash
npm run dev:server
```

The server will start on http://localhost:3000

### Production

Build and run:

```bash
npm run build
npm start
```

## API

See [API Documentation](docs/api.md) for detailed endpoint information.

### Quick Start

Upload a knowledge base file:

```bash
curl -X POST http://localhost:3000/upload-kb \
  -H "x-server-id: 123456789012345678" \
  -H "x-api-token: your-api-token-here" \
  -F "file=@sample-kb.csv"
```

Check server health:

```bash
curl http://localhost:3000/health
```

## File Formats

### CSV Format

CSV files must have `question` and `answer` columns:

```csv
question,answer
"How do I reset my password?","Click the 'Forgot Password' link."
"What are your hours?","We are open 9 AM to 5 PM EST."
```

### PDF Format

PDF files should contain Q&A pairs with markers:

```
Q: How do I reset my password?
A: Click the 'Forgot Password' link.

Q: What are your hours?
A: We are open 9 AM to 5 PM EST.
```

## Project Structure

```
discord-qa-bot/
├── src/
│   ├── server/
│   │   ├── index.ts          # Express server setup
│   │   └── uploadHandler.ts  # Upload endpoint handler
│   ├── services/
│   │   ├── firebaseService.ts      # Firebase initialization
│   │   └── knowledgeBaseService.ts # Firestore operations
│   ├── middleware/
│   │   ├── auth.ts           # Authentication middleware
│   │   └── errorHandler.ts   # Error handling middleware
│   ├── utils/
│   │   ├── csvProcessor.ts   # CSV parsing logic
│   │   ├── pdfProcessor.ts   # PDF parsing logic
│   │   ├── textProcessing.ts # Text normalization & keywords
│   │   └── storageUtils.ts   # Firebase Storage operations
│   └── types/
│       └── index.ts          # TypeScript types
├── docs/
│   └── api.md               # API documentation
├── uploads/                 # Temporary upload directory
├── .env                     # Environment variables
├── .env.example            # Example environment file
├── tsconfig.json           # TypeScript configuration
├── nodemon.json            # Nodemon configuration
└── package.json            # Project dependencies
```

## Development Notes

### Authentication

The current authentication is a placeholder that checks for `x-server-id` and `x-api-token` headers. This will be replaced with Whop/Firebase Auth in a future update.

### File Processing

- Maximum file size: 20MB
- Supported formats: CSV, PDF
- Files are temporarily stored during processing and deleted afterward
- Original files are archived in Firebase Storage

### Keyword Extraction

The system automatically extracts keywords from Q&A pairs for search indexing:
- Converts to lowercase
- Removes punctuation and stop words
- Applies basic stemming
- Stores unique keywords for each entry

## Testing

To test the upload functionality, use the provided sample file:

```bash
curl -X POST http://localhost:3000/upload-kb \
  -H "x-server-id: test-server-123" \
  -H "x-api-token: test-token" \
  -F "file=@sample-kb.csv"
```

## License

ISC
