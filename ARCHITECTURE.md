# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Discord Platform                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Messages   │  │   Commands   │  │   Gateway    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                            │
                    ┌───────▼───────┐
                    │  Discord.js   │
                    │    Client     │
                    └───────┬───────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
    ┌─────▼─────┐    ┌─────▼─────┐    ┌─────▼─────┐
    │  Message  │    │  Command  │    │   Event   │
    │  Handler  │    │  Handler  │    │ Listeners │
    └─────┬─────┘    └─────┬─────┘    └───────────┘
          │                │
          │                │
    ┌─────▼─────┐    ┌─────▼─────┐
    │  Message  │    │   Config  │
    │ Processor │    │  Service  │
    │ (Queue)   │    │           │
    └─────┬─────┘    └─────┬─────┘
          │                │
          │                │
    ┌─────▼─────┐    ┌─────▼─────┐
    │   Usage   │    │ Firebase  │
    │  Service  │    │ Firestore │
    └───────────┘    └───────────┘
```

## Component Details

### Discord.js Client
- **Purpose**: Interface with Discord API
- **Intents**: Guilds, GuildMessages, MessageContent
- **Responsibilities**:
  - Maintain WebSocket connection to Discord
  - Emit events for messages, commands, errors
  - Handle reconnection and lifecycle

### Message Handler
- **Location**: `src/bot/index.ts` (messageCreate event)
- **Responsibilities**:
  1. Filter unwanted messages (bots, DMs, mention-only)
  2. Check guild configuration
  3. Verify quota limits
  4. Enqueue eligible messages for processing
  5. Send quota exceeded notices

### Message Processor
- **Location**: `src/services/messageProcessor.ts`
- **Queue**: p-queue with concurrency limit of 5
- **Responsibilities**:
  1. Process messages sequentially with rate limiting
  2. Generate responses (currently placeholder)
  3. Send replies to Discord
  4. Increment usage counters
  5. Handle errors gracefully

### Command Handler
- **Location**: `src/bot/commandHandler.ts`
- **Commands**: `/config` with subcommands
- **Responsibilities**:
  1. Verify permissions (Manage Server)
  2. Parse command options
  3. Interact with ConfigService
  4. Send ephemeral responses

### Config Service
- **Location**: `src/services/configService.ts`
- **Storage**: Firestore `guild_configs` collection
- **Responsibilities**:
  1. Manage allowed channels per guild
  2. Store owner contact information
  3. CRUD operations on guild settings

### Usage Service
- **Location**: `src/services/usageService.ts`
- **Storage**: Firestore `usage_records` collection
- **Responsibilities**:
  1. Track monthly query usage per guild
  2. Check quota limits
  3. Increment usage counters
  4. Provide usage statistics

## Data Flow

### Message Processing Flow

```
User sends message
       │
       ▼
Is from bot? ──Yes──> [SKIP]
       │No
       ▼
Is DM? ──Yes──> [SKIP]
       │No
       ▼
Only mentions bot? ──Yes──> [SKIP]
       │No
       ▼
Has guild config? ──No──> [SKIP]
       │Yes
       ▼
Channel allowed? ──No──> [SKIP]
       │Yes
       ▼
Under quota? ──No──> Send quota message
       │Yes
       ▼
Add to queue
       │
       ▼
Process message
       │
       ▼
Generate response (placeholder)
       │
       ▼
Send reply to Discord
       │
       ▼
Increment usage counter
```

### Command Processing Flow

```
User runs /config command
       │
       ▼
In guild? ──No──> Error: Server only
       │Yes
       ▼
Has Manage Server? ──No──> Error: No permission
       │Yes
       ▼
Parse subcommand
       │
       ├─> add-channel
       │   └─> ConfigService.addAllowedChannel()
       │       └─> Success message
       │
       ├─> remove-channel
       │   └─> ConfigService.removeAllowedChannel()
       │       └─> Success message
       │
       ├─> list-channels
       │   └─> ConfigService.listAllowedChannels()
       │       └─> Channel list
       │
       └─> set-owner
           └─> ConfigService.setOwnerContact()
               └─> Success message
```

## Firestore Schema

### guild_configs Collection

```typescript
{
  // Document ID: guildId (string)
  allowedChannels: string[],      // Channel IDs
  ownerContact?: string,           // Email or username
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### usage_records Collection

```typescript
{
  // Document ID: `${guildId}_${YYYY-MM}`
  guildId: string,
  month: string,                   // "YYYY-MM" format
  count: number,                   // Queries processed
  limit: number,                   // Max queries allowed
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Error Handling Strategy

### Graceful Degradation
- Firebase errors: Log and allow (don't block bot)
- Message processing errors: Send generic error reply
- Command errors: Send ephemeral error message
- Network errors: Automatic reconnection via Discord.js

### Logging Levels
- **Info**: Normal operations, startup, successful actions
- **Warn**: Quota exceeded, skipped messages
- **Error**: Service failures, unhandled errors

### Process Management
- `SIGINT`/`SIGTERM`: Graceful shutdown, destroy client
- `unhandledRejection`: Log error, continue running
- Client errors: Log, rely on automatic reconnection

## Performance Considerations

### Rate Limiting
- **Message Queue**: Max 5 concurrent messages
- **Discord API**: Built-in rate limiting by Discord.js
- **Firestore**: Batched operations where possible

### Caching Strategy (Future)
- Cache guild configs in memory (TTL: 5 minutes)
- Cache usage records during same month
- Invalidate on configuration changes

### Scalability
- **Current**: Single instance, suitable for <100 guilds
- **Future**: Multiple instances with shared queue (Redis)
- **Database**: Firestore scales automatically

## Security Measures

### Authentication
- Discord token stored in environment variables
- Firebase service account with minimal permissions
- No hardcoded credentials

### Authorization
- Commands require "Manage Server" permission
- Bot can only read configured channels
- User data never exposed in logs

### Data Protection
- No PII stored except owner contact (optional)
- Messages not persisted (processed in memory)
- Firebase encryption at rest and in transit

## Deployment Architecture

### Development
```
Local Machine
├── Node.js Runtime
├── TypeScript (ts-node)
├── .env file (local config)
└── Firebase (cloud)
```

### Production
```
Cloud Platform (Heroku/Railway/etc)
├── Node.js Runtime
├── Compiled JavaScript
├── Environment Variables
└── Firebase (cloud)
```

## Future Enhancements

### Phase 2: Knowledge Base
- Gemini API integration
- Vector embeddings (Pinecone/Weaviate)
- Document processing pipeline
- Context-aware responses

### Phase 3: Dashboard
- React web application
- Firebase Authentication
- Document upload interface
- Analytics visualization

### Phase 4: Advanced Features
- Multi-language support
- Custom branding
- Webhook integrations
- Advanced analytics

## Monitoring & Observability

### Current Logging
- Console output with component prefixes
- Error stack traces
- Operation success/failure messages

### Future Monitoring (Planned)
- Structured logging (Winston/Pino)
- Error tracking (Sentry)
- Performance metrics (Prometheus)
- Uptime monitoring (UptimeRobot)

## Dependencies

### Production Dependencies
- `discord.js@^14.14.1` - Discord API wrapper
- `@discordjs/rest@^2.2.0` - REST API for commands
- `firebase-admin@^12.0.0` - Firebase SDK
- `p-queue@^8.0.1` - Promise-based queue
- `dotenv@^16.3.1` - Environment variable loading

### Development Dependencies
- `typescript@^5.3.3` - TypeScript compiler
- `ts-node@^10.9.2` - TypeScript execution
- `@types/node@^20.11.0` - Node.js type definitions

## Configuration Management

### Environment-Based Config
- Development: `.env` file
- Production: Platform environment variables
- Testing: Separate Firebase project

### Feature Flags (Future)
- Enable/disable experimental features
- A/B testing for response styles
- Gradual rollout of new functionality
