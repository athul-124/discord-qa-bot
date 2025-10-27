# KB Upload Implementation Summary

## Overview
This implementation provides a complete backend ingestion path for community managers to upload knowledge base files (CSV/PDF) that feed the chatbot's responses.

## What Was Implemented

### 1. Express Server (`src/server/index.ts`)
- Configurable PORT (defaults to 3000)
- Health check endpoint at `/health`
- JSON error middleware
- Multer configuration for file uploads (20MB limit, CSV/PDF only)
- POST `/upload-kb` endpoint

### 2. Authentication Middleware (`src/middleware/auth.ts`)
- Placeholder authentication checking for `x-server-id` and `x-api-token` headers
- Ready to be replaced with Whop/Firebase Auth in a future ticket

### 3. File Processing

#### CSV Processing (`src/utils/csvProcessor.ts`)
- Uses `csv-parser` library
- Validates required headers: `question` and `answer`
- Normalizes whitespace in both fields
- Skips rows with missing or empty fields
- Reports line-specific errors

#### PDF Processing (`src/utils/pdfProcessor.ts`)
- Uses `pdf-parse` library
- Splits text on double newlines to identify chunks
- Uses heuristics to extract Q&A pairs:
  - `Q:` / `A:` markers
  - `Question:` / `Answer:` markers
  - Falls back to splitting on `?` character
- Reports chunk-specific errors for unparseable content

### 4. Text Processing (`src/utils/textProcessing.ts`)
- Whitespace normalization
- Keyword extraction with:
  - Lowercase conversion
  - Punctuation removal
  - Stop word filtering
  - Basic stemming (removes -ing, -ed, -s, -ly suffixes)

### 5. Firebase Integration

#### Firestore Service (`src/services/firebaseService.ts`)
- Initializes Firebase Admin SDK
- Supports multiple authentication methods:
  - Service account file
  - Default credentials
  - Local emulators

#### Knowledge Base Service (`src/services/knowledgeBaseService.ts`)
- `saveKnowledgeEntries()` - Batch writes to Firestore (500 entries per batch)
- `saveIngestionMetadata()` - Logs upload metadata to `ingestions` collection

#### Storage Service (`src/utils/storageUtils.ts`)
- Uploads original files to Firebase Storage
- Path format: `kbs/{serverId}/{timestamp}-{filename}`
- Sanitizes filenames for security
- Cleans up temporary files after processing

### 6. Data Model

#### Knowledge Entry
Stored in Firestore `knowledge_base` collection:
- `question` (string): Normalized question text
- `answer` (string): Normalized answer text
- `keywords` (array): Extracted keywords for search
- `serverId` (string): Discord server ID
- `sourceFilePath` (string): Path to original file in Storage
- `createdAt` (timestamp): Entry creation time

#### Ingestion Metadata
Stored in Firestore `ingestions` collection:
- `serverId`: Discord server ID
- `fileName`: Original filename
- `fileSize`: File size in bytes
- `fileType`: File extension
- `entriesCreated`: Number of successful entries
- `entriesSkipped`: Number of skipped entries
- `errors`: Array of error details
- `sourceFilePath`: Storage path
- `timestamp`: Upload timestamp

### 7. API Response
Returns summary with:
- `success`: Boolean
- `entriesCreated`: Count of created entries
- `entriesSkipped`: Count of skipped entries
- `errors`: Array of error objects with line/chunk numbers and messages
- `sourceFilePath`: Storage path

### 8. Error Handling
- 401 Unauthorized: Missing authentication headers
- 400 Bad Request: Missing file, unsupported file type, malformed data
- 413 Payload Too Large: File exceeds 20MB
- 500 Internal Server Error: Processing failures with detailed messages

### 9. Documentation
- Complete API documentation in `docs/api.md`
- Includes curl examples
- Documents all endpoints, request/response formats
- Explains file format requirements

## Testing

### Manual Testing
Run `npm run dev:server` and test with:

```bash
# Health check
curl http://localhost:3000/health

# Upload CSV
curl -X POST http://localhost:3000/upload-kb \
  -H "x-server-id: test-server-123" \
  -H "x-api-token: test-token" \
  -F "file=@sample-kb.csv"
```

### Processing Test
Run `npx ts-node test-processing.ts` to verify:
- Text normalization
- Keyword extraction
- CSV parsing with well-formed and malformed data

### Test Files Included
- `sample-kb.csv` - Well-formed CSV example
- `test-malformed.csv` - CSV with errors for testing
- `test-processing.ts` - Unit test for processing logic
- `test-server.sh` - Integration test script

## Configuration

### Environment Variables
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode
- `FIREBASE_PROJECT_ID` - Firebase project ID
- `FIREBASE_STORAGE_BUCKET` - Storage bucket name
- `FIREBASE_SERVICE_ACCOUNT_PATH` - Path to service account JSON (optional)
- `FIRESTORE_EMULATOR_HOST` - Firestore emulator host (optional)
- `FIREBASE_STORAGE_EMULATOR_HOST` - Storage emulator host (optional)

### NPM Scripts
- `npm run dev:server` - Development server with hot reload
- `npm run build` - TypeScript compilation
- `npm start` - Run production build

## Security Features
- File type validation (CSV/PDF only)
- File size limit (20MB)
- Filename sanitization
- Temporary file cleanup
- Authentication middleware (placeholder)
- Error messages without sensitive data exposure

## Future Enhancements
- Replace placeholder auth with Whop/Firebase Auth
- Add rate limiting
- Add file upload progress tracking
- Support additional file formats
- Implement search endpoint using keywords
- Add batch deletion endpoint
- Add knowledge base versioning

## Project Structure
```
discord-qa-bot/
├── src/
│   ├── server/           # Express server & route handlers
│   ├── services/         # Firebase services
│   ├── middleware/       # Auth & error handling
│   ├── utils/            # File processing utilities
│   └── types/            # TypeScript types
├── docs/                 # API documentation
├── .env.example         # Environment template
├── tsconfig.json        # TypeScript config
├── nodemon.json         # Dev server config
└── package.json         # Dependencies & scripts
```
