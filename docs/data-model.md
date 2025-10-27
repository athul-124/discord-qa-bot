# Firebase Data Model

This document describes the Firestore collections, their schemas, and usage enforcement logic for the Discord QA Bot.

## Collections Overview

The bot uses four main Firestore collections:

1. **server_configs** - Server/Guild configuration and subscription information
2. **knowledge_entries** - Knowledge base question-answer pairs
3. **usage_entries** - Message usage tracking and rate limiting
4. **trend_entries** - Analytics and trend tracking data

---

## Collection Schemas

### 1. server_configs

Stores configuration data for each Discord server using the bot.

**Document ID**: `{serverId}` (Discord Guild ID)

**Schema**:
```typescript
{
  serverId: string;              // Discord Guild ID
  allowedChannelIds: string[];   // Channel IDs where bot is allowed to respond
  ownerId: string;               // Discord User ID of server owner
  whopCustomerId?: string;       // Whop customer ID for payment integration
  tier: 'free' | 'premium' | 'enterprise';  // Subscription tier
  createdAt: Timestamp;          // When config was created
  updatedAt: Timestamp;          // Last update time
}
```

**Indexes Required**:
- `tier` (for querying servers by subscription level)
- `whopCustomerId` (for linking payment systems)

**Example**:
```json
{
  "serverId": "123456789012345678",
  "allowedChannelIds": ["987654321098765432", "876543210987654321"],
  "ownerId": "111222333444555666",
  "whopCustomerId": "cus_abc123xyz",
  "tier": "premium",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-20T14:45:00Z"
}
```

---

### 2. knowledge_entries

Stores question-answer pairs that form the knowledge base for each server.

**Document ID**: Auto-generated

**Schema**:
```typescript
{
  serverId: string;              // Discord Guild ID
  question: string;              // The question or topic
  answer: string;                // The answer or response
  keywords: string[];            // Searchable keywords extracted from content
  createdAt: Timestamp;          // When entry was created
  updatedAt?: Timestamp;         // Last update time (optional)
  sourceFilePath?: string;       // Path to source file in Cloud Storage (optional)
}
```

**Indexes Required**:
- `serverId` (for server-specific queries)
- Composite: `serverId` + `createdAt` (for chronological listing)
- `keywords` (array-contains-any for keyword search)

**Example**:
```json
{
  "serverId": "123456789012345678",
  "question": "How do I reset my password?",
  "answer": "To reset your password, visit the settings page and click 'Forgot Password'. You'll receive an email with reset instructions.",
  "keywords": ["password", "reset", "settings", "email", "forgot"],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-16T09:15:00Z",
  "sourceFilePath": "artifacts/123456789012345678/1705315800000_faq.pdf"
}
```

---

### 3. usage_entries

Tracks message usage for rate limiting and tier enforcement.

**Document ID**: Auto-generated (query by serverId + monthKey)

**Schema**:
```typescript
{
  serverId: string;              // Discord Guild ID
  monthKey: string;              // Month identifier in YYYY-MM format
  messageCount: number;          // Number of messages processed this month
  lastMessageAt: Timestamp;      // When the last message was processed
  createdAt: Timestamp;          // When tracking started for this month
}
```

**Indexes Required**:
- Composite: `serverId` + `monthKey` (for current month lookup)
- `monthKey` (for cross-server analytics)

**Month Key Format**: `YYYY-MM` (e.g., `2024-01`, `2024-12`)

**Example**:
```json
{
  "serverId": "123456789012345678",
  "monthKey": "2024-01",
  "messageCount": 45,
  "lastMessageAt": "2024-01-15T14:22:33Z",
  "createdAt": "2024-01-01T08:15:00Z"
}
```

---

### 4. trend_entries

Logs processed messages for analytics and trend analysis.

**Document ID**: Auto-generated

**Schema**:
```typescript
{
  serverId: string;              // Discord Guild ID
  timestamp: Timestamp;          // When the message was processed
  keywords: string[];            // Keywords extracted from the message
  engagement: number;            // Engagement score (reactions, replies, etc.)
  messageId?: string;            // Discord message ID (optional)
}
```

**Indexes Required**:
- Composite: `serverId` + `timestamp` (for time-series queries)
- `timestamp` (for cleanup of old data)

**Example**:
```json
{
  "serverId": "123456789012345678",
  "timestamp": "2024-01-15T14:22:33Z",
  "keywords": ["pricing", "subscription", "upgrade"],
  "engagement": 5,
  "messageId": "998877665544332211"
}
```

---

## Usage Enforcement Logic

### Tier-Based Message Limits

The bot enforces monthly message limits based on the server's subscription tier:

| Tier       | Monthly Limit | Description                        |
|------------|---------------|------------------------------------|
| Free       | 100 messages  | Basic tier for small communities   |
| Premium    | 1,000 messages| Mid-tier for growing communities   |
| Enterprise | 10,000 messages| High-volume tier for large servers |

### Enforcement Flow

1. **Message Received**: When a message is received in an allowed channel
2. **Check Tier**: Look up server configuration to determine tier
3. **Check Usage**: Query `usage_entries` for current month's usage
4. **Validate Limit**: Compare `messageCount` against tier limit
5. **Process or Reject**:
   - If under limit: Process message and increment counter
   - If at/over limit: Send limit exceeded message to user
6. **Increment Counter**: Update `messageCount` and `lastMessageAt`

### Monthly Reset Logic

Usage counters are **NOT automatically reset**. Instead:

- New month entries are created automatically when the first message of a new month is processed
- Old entries remain for historical data and analytics
- Cleanup can be performed via cron job if storage optimization is needed

**Reset Process** (for cron jobs):
1. Run at the start of each month (e.g., 1st day at 00:00 UTC)
2. Archive or delete entries older than 6-12 months
3. No need to "reset" counters - they naturally segment by `monthKey`

**Manual Reset** (for testing):
```typescript
await usageService.resetUsage(serverId, monthKey);
```

---

## Cloud Storage Structure

Raw artifacts (uploaded files, documents) are stored in Firebase Cloud Storage:

```
artifacts/
  {serverId}/
    {timestamp}_{filename}
```

**Example**:
```
artifacts/
  123456789012345678/
    1705315800000_faq.pdf
    1705402200000_documentation.txt
    1705488600000_knowledge_base.json
```

**Metadata**:
- Content-Type: Preserved from upload
- Custom Metadata:
  - `serverId`: Discord Guild ID
  - `uploadedAt`: ISO timestamp

---

## Security Rules (To Be Implemented)

### Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Server configs - only bot service account can write
    match /server_configs/{serverId} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.admin == true;
    }
    
    // Knowledge entries - server-specific access
    match /knowledge_entries/{entryId} {
      allow read: if request.auth != null && 
                     resource.data.serverId == request.auth.token.serverId;
      allow write: if request.auth.token.admin == true;
    }
    
    // Usage entries - read-only for clients, write for bot
    match /usage_entries/{entryId} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.admin == true;
    }
    
    // Trend entries - admin only
    match /trend_entries/{entryId} {
      allow read: if request.auth.token.admin == true;
      allow write: if request.auth.token.admin == true;
    }
  }
}
```

### Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Artifacts - server-specific access
    match /artifacts/{serverId}/{fileName} {
      allow read: if request.auth != null && 
                     request.auth.token.serverId == serverId;
      allow write: if request.auth.token.admin == true;
    }
  }
}
```

**Note**: These rules assume Firebase Auth with custom claims. Adjust based on your authentication strategy.

---

## Composite Indexes Required

Some queries require composite indexes. Create these in the Firebase Console:

1. **knowledge_entries**:
   - Collection: `knowledge_entries`
   - Fields: `serverId` (Ascending), `createdAt` (Descending)

2. **usage_entries**:
   - Collection: `usage_entries`
   - Fields: `serverId` (Ascending), `monthKey` (Ascending)

3. **trend_entries**:
   - Collection: `trend_entries`
   - Fields: `serverId` (Ascending), `timestamp` (Descending)

---

## Batch Operations

All services respect Firestore's 500-operation batch limit:

- **Batch Writes**: Automatically chunked into groups of 500
- **Batch Reads**: Use pagination for large result sets
- **Transactions**: Keep under 500 document reads/writes

Example batch write flow:
```typescript
const entries = [...]; // Array of 1000+ entries
// Automatically chunked into batches of 500
await knowledgeBaseService.saveKnowledgeEntries(entries);
```

---

## Data Retention

Recommended retention policies:

| Collection         | Retention Period | Cleanup Strategy           |
|--------------------|------------------|----------------------------|
| server_configs     | Permanent        | Delete on server removal   |
| knowledge_entries  | Permanent        | Server-managed             |
| usage_entries      | 12 months        | Monthly cron cleanup       |
| trend_entries      | 6 months         | Weekly cron cleanup        |

---

## Migration Notes

### Legacy Collections

The bot maintains backward compatibility with legacy collections:

- `guild_configs` → Migrated to `server_configs`
- `usage_records` → Replaced by `usage_entries` (different schema)

Legacy service methods are still available but deprecated.

---

## Environment Variables

Required for Firebase initialization:

```bash
# Option 1: Service account JSON (base64 or file path)
FIREBASE_SERVICE_ACCOUNT=<base64-encoded-json-or-path>

# Option 2: Individual credentials
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Optional: Storage bucket
FIREBASE_STORAGE_BUCKET=your-project.appspot.com

# Optional: Emulator support
USE_FIREBASE_EMULATOR=true
FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
FIREBASE_STORAGE_EMULATOR_HOST=localhost:9199
```

---

## API Reference

See individual service files for detailed API documentation:

- `src/services/configService.ts` - Server configuration management
- `src/services/knowledgeBaseService.ts` - Knowledge base operations
- `src/services/usageService.ts` - Usage tracking and limits
- `src/services/trendService.ts` - Analytics and trends

---

## Testing with Emulators

To test locally with Firebase Emulators:

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Initialize emulators: `firebase init emulators`
3. Start emulators: `firebase emulators:start`
4. Set environment variables:
   ```bash
   export USE_FIREBASE_EMULATOR=true
   export FIRESTORE_EMULATOR_HOST=localhost:8080
   ```
5. Run your bot: `npm run dev`

---

## Support and Questions

For questions about the data model or Firebase integration, refer to:

- Firebase Admin SDK Documentation: https://firebase.google.com/docs/admin/setup
- Firestore Data Modeling: https://firebase.google.com/docs/firestore/data-model
- This project's ARCHITECTURE.md for overall system design
