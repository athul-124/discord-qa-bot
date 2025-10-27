# Knowledge Base Upload API

## Overview

The KB Upload API allows community managers to upload knowledge base files (CSV or PDF) that feed the chatbot's responses.

## Base URL

```
http://localhost:3000
```

## Endpoints

### Health Check

Check if the server is running.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```

---

### Upload Knowledge Base File

Upload a CSV or PDF file containing question-answer pairs.

**Endpoint:** `POST /upload-kb`

**Headers:**
- `x-server-id` (required): The Discord server ID
- `x-api-token` (required): API authentication token

**Request Body:**
- Content-Type: `multipart/form-data`
- `file` (required): The knowledge base file (CSV or PDF, max 20MB)

**Supported File Formats:**

#### CSV Format
CSV files must contain headers `question` and `answer`:

```csv
question,answer
"How do I reset my password?","You can reset your password by clicking the 'Forgot Password' link on the login page."
"What are your business hours?","We are open Monday to Friday, 9 AM to 5 PM EST."
```

#### PDF Format
PDF files should contain Q&A pairs with clear markers:

```
Q: How do I reset my password?
A: You can reset your password by clicking the 'Forgot Password' link on the login page.

Q: What are your business hours?
A: We are open Monday to Friday, 9 AM to 5 PM EST.
```

Alternative formats are also supported:
- `Question: ... Answer: ...`
- Questions ending with `?` followed by answers

**Example cURL Command:**

```bash
curl -X POST http://localhost:3000/upload-kb \
  -H "x-server-id: 123456789012345678" \
  -H "x-api-token: your-api-token-here" \
  -F "file=@/path/to/knowledge-base.csv"
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "entriesCreated": 45,
  "entriesSkipped": 2,
  "errors": [
    {
      "line": 5,
      "message": "Missing required fields 'question' or 'answer'"
    },
    {
      "chunk": 12,
      "message": "Could not extract Q&A pair from chunk"
    }
  ],
  "sourceFilePath": "kbs/123456789012345678/1234567890-knowledge-base.csv"
}
```

**Error Responses:**

**400 Bad Request** - Invalid request:
```json
{
  "error": "Bad Request",
  "message": "No file uploaded. Please provide a file in the 'file' field."
}
```

**400 Bad Request** - Unsupported file type:
```json
{
  "error": "Bad Request",
  "message": "Unsupported file type. Only CSV and PDF files are accepted."
}
```

**401 Unauthorized** - Missing authentication:
```json
{
  "error": "Authentication required",
  "message": "Missing x-server-id or x-api-token headers"
}
```

**413 Payload Too Large** - File exceeds size limit:
```json
{
  "error": "File too large",
  "message": "File size exceeds 20MB limit"
}
```

**500 Internal Server Error** - Processing failure:
```json
{
  "error": "Processing Failed",
  "message": "Failed to process file",
  "details": "..." // Only in development mode
}
```

## Data Model

Each knowledge entry stored in Firestore contains:

- `question` (string): The normalized question text
- `answer` (string): The normalized answer text
- `keywords` (array): Extracted keywords for search indexing
- `serverId` (string): The Discord server ID
- `sourceFilePath` (string): Path to the original file in Firebase Storage
- `createdAt` (timestamp): When the entry was created

## Ingestion Metadata

Each upload creates an ingestion record in the `ingestions` collection:

- `serverId`: Discord server ID
- `fileName`: Original file name
- `fileSize`: File size in bytes
- `fileType`: File extension (.csv or .pdf)
- `entriesCreated`: Number of entries successfully created
- `entriesSkipped`: Number of entries skipped due to errors
- `errors`: Array of error details
- `sourceFilePath`: Storage path of the original file
- `timestamp`: When the ingestion occurred

## File Processing Details

### CSV Processing
1. Validates presence of `question` and `answer` headers
2. Normalizes whitespace in both fields
3. Extracts keywords from combined question and answer text
4. Skips rows with missing or empty required fields

### PDF Processing
1. Extracts text from PDF
2. Splits text on double newlines to identify chunks
3. Uses heuristics to identify Q&A pairs:
   - Looks for `Q:` and `A:` markers
   - Looks for `Question:` and `Answer:` markers
   - Falls back to splitting on `?` character
4. Skips chunks that cannot be parsed into Q&A pairs

### Keyword Extraction
- Converts text to lowercase
- Removes punctuation
- Filters out common stop words
- Applies basic stemming (removes -ing, -ed, -s, -ly suffixes)
- Returns unique keywords for search indexing

## Security Notes

- Authentication is currently a placeholder and will be replaced with Whop/Firebase Auth in a future update
- Files are temporarily stored during processing and deleted after upload
- Original files are stored in Firebase Storage for audit purposes
- File size limited to 20MB to prevent abuse
- Only CSV and PDF file types are accepted
