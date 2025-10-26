# discord-qa-bot

A Discord bot that answers questions by searching a Firestore knowledge base and generating concise responses using Google's Gemini 2.5 Flash AI model.

## Features

- **Intelligent Knowledge Search**: Tokenizes queries, removes stop words, and searches Firestore using keyword matching with Jaccard similarity scoring
- **AI-Powered Responses**: Uses Gemini 2.5 Flash to generate concise, context-aware answers from knowledge base entries
- **Rate Limiting**: Respects Gemini's 500 requests/day limit with automatic queueing and admin alerts
- **Confidence Threshold**: Only responds when confidence score is ≥0.7 (configurable per server)
- **Fallback Handling**: Gracefully handles API errors, timeouts, and low-confidence matches
- **Citation Support**: Provides numbered references to knowledge base entries in responses
- **Usage Tracking**: Tracks user usage and enforces limits via Firestore
- **Per-Server Configuration**: Enable/disable AI responses and configure channels per Discord server
- **Owner Notifications**: DMs server owner when users repeatedly hit knowledge gaps

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and configure:
   ```
   DISCORD_BOT_TOKEN=your_discord_bot_token
   GEMINI_API_KEY=your_gemini_api_key
   FIREBASE_PROJECT_ID=your_firebase_project_id
   OWNER_USER_ID=your_discord_user_id
   ```

4. Build the project:
   ```bash
   npm run build
   ```

5. Start the bot:
   ```bash
   npm start
   ```

## Development

```bash
npm run dev
```

## Testing

```bash
npm test
npm run test:coverage
```

## Architecture

### Services

- **FirestoreKnowledgeSearchService**: Searches Firestore `kbs` collection using tokenized queries
- **GeminiService**: Manages Gemini API calls with rate limiting, timeouts, and fallbacks
- **UsageService**: Tracks per-user message counts and enforces limits
- **ConfigService**: Manages per-server configuration (AI enabled, channels, thresholds)

### Handlers

- **MessageHandler**: Orchestrates the message processing pipeline, confidence checks, and response generation

## Knowledge Base Schema

Each entry in the `kbs` Firestore collection should have:

```typescript
{
  question: string;
  answer: string;
  keywords: string[];
  category?: string;
}
```

## Configuration

Server-specific settings are stored in Firestore `server_configs` collection:

```typescript
{
  aiEnabled: boolean;
  enabledChannels: string[];
  confidenceThreshold: number;
  notifyOnMiss: boolean;
}
```

## License

ISC
