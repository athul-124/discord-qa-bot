# API Documentation

This document describes the backend API endpoints that the web dashboard integrates with.

## Base URL

Development: `http://localhost:3001`
Production: `https://your-api-domain.com`

## Authentication

All protected endpoints require a Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

## Endpoints

### 1. Get Usage Statistics

**Endpoint:** `GET /usage`

**Query Parameters:**
- `serverId` (required): Discord server ID

**Headers:**
```
Authorization: Bearer <firebase-id-token>
```

**Success Response (200):**
```json
{
  "monthlyCount": 150,
  "remainingQuota": 850,
  "tier": "free"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing authentication token
- `400 Bad Request`: Missing serverId parameter
- `404 Not Found`: Server not found

---

### 2. Link Server

**Endpoint:** `POST /link-server`

**Headers:**
```
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "whopToken": "whop_token_here",
  "serverId": "123456789"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "tier": "pro",
  "message": "Server linked successfully with Pro tier"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing authentication token
- `400 Bad Request`: Missing required fields
- `403 Forbidden`: Invalid Whop token
- `409 Conflict`: Server already linked

---

### 3. Upload Knowledge Base

**Endpoint:** `POST /upload-kb`

**Headers:**
```
Authorization: Bearer <firebase-id-token>
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: File (CSV or PDF, max 10MB)
- `serverId`: Discord server ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "File uploaded and processed successfully",
  "fileId": "file_123abc"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing authentication token
- `400 Bad Request`: Missing file or serverId
- `413 Payload Too Large`: File exceeds 10MB
- `415 Unsupported Media Type`: Invalid file type

---

### 4. Get Trends (Pro Only)

**Endpoint:** `GET /trends`

**Query Parameters:**
- `serverId` (required): Discord server ID

**Headers:**
```
Authorization: Bearer <firebase-id-token>
```

**Success Response (200):**
```json
{
  "totalQuestions": 1250,
  "averageResponseTime": 145,
  "topTopics": [
    {
      "topic": "Account Issues",
      "count": 45
    },
    {
      "topic": "Technical Support",
      "count": 38
    },
    {
      "topic": "Billing Questions",
      "count": 22
    }
  ],
  "dailyUsage": [
    {
      "date": "2024-10-20",
      "count": 45
    },
    {
      "date": "2024-10-21",
      "count": 52
    },
    {
      "date": "2024-10-22",
      "count": 38
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing authentication token
- `403 Forbidden`: Server is not on Pro tier
- `404 Not Found`: Server not found

---

### 5. Exchange Whop Token

**Endpoint:** `POST /auth/whop-exchange`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "whopToken": "whop_token_here"
}
```

**Success Response (200):**
```json
{
  "firebaseToken": "firebase_custom_token_here"
}
```

**Error Responses:**
- `400 Bad Request`: Missing whopToken
- `401 Unauthorized`: Invalid Whop token
- `500 Internal Server Error`: Failed to create Firebase token

**Usage:**
After receiving the Firebase token, the client should use it to sign in:
```javascript
import { signInWithCustomToken } from 'firebase/auth';
await signInWithCustomToken(auth, firebaseToken);
```

---

## Error Response Format

All error responses follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- Anonymous requests: 10 requests per minute
- Authenticated requests: 100 requests per minute
- File uploads: 5 uploads per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1634567890
```

## CORS

The API supports CORS for requests from:
- `http://localhost:3000` (development)
- `https://your-firebase-app.web.app` (production)
- `https://your-custom-domain.com` (if configured)

## Webhooks (Future)

The API may support webhooks for:
- File processing completion
- Usage limit warnings
- Subscription tier changes

## Testing

### With Firebase Emulators

When using Firebase emulators, the API should connect to:
- Auth Emulator: `http://localhost:9099`
- Firestore Emulator: `http://localhost:8080`
- Storage Emulator: `http://localhost:9199`

### Mock Server

For testing without a backend, see `docs/examples/mock-server.js`

## Implementation Notes

### Authentication Flow

1. User signs in via Firebase Auth (email/password or magic link)
2. Client obtains Firebase ID token: `await user.getIdToken()`
3. Client includes token in API requests
4. Backend verifies token with Firebase Admin SDK
5. Backend performs authorized action

### Whop Integration Flow

1. User purchases subscription on Whop
2. User receives Whop token
3. User enters token in "Link Server" page
4. Client calls `/link-server` with Whop token
5. Backend validates Whop token with Whop API
6. Backend stores server-subscription mapping
7. Backend returns subscription tier

### File Upload Flow

1. User selects CSV/PDF file
2. Client validates file type and size
3. Client uploads via multipart/form-data
4. Backend validates and stores file in Cloud Storage
5. Backend processes file (extracts text, chunks, embeds)
6. Backend stores embeddings in vector database
7. Backend returns success with fileId

### Trends Data Aggregation

1. Backend listens to bot question events
2. Events are stored in Firestore with metadata
3. Backend aggregates data periodically
4. `/trends` endpoint queries aggregated data
5. Client displays charts and metrics

## Security Considerations

- All endpoints validate Firebase ID tokens
- File uploads scan for malware
- Rate limiting prevents abuse
- Server IDs are validated against user permissions
- Sensitive data is encrypted at rest
- HTTPS required for all production traffic

## Monitoring

Monitor API health with:
- Firebase Performance Monitoring
- Cloud Logging
- Custom metrics for:
  - Request count
  - Error rate
  - Response time
  - Upload success rate

## Support

For API issues:
1. Check API logs in Cloud Logging
2. Verify Firebase token is valid
3. Ensure server is properly linked
4. Check rate limit headers
5. Review CORS configuration
