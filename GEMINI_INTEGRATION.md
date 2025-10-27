# Gemini Integration Documentation

## Overview

This bot integrates Google's Gemini 2.0 Flash AI model to provide intelligent question-answering capabilities by searching a Firestore knowledge base and generating concise, accurate responses.

## Architecture

### Components

1. **FirestoreKnowledgeSearchService** - Searches knowledge base entries in Firestore
2. **GeminiService** - Manages AI response generation with rate limiting
3. **ConfigService** - Per-server configuration management
4. **MessageHandler** - Orchestrates the message processing pipeline
5. **UsageService** - Tracks user usage and enforces limits

### Data Flow

```
Discord Message
    ↓
MessageHandler (validate)
    ↓
FirestoreKnowledgeSearchService (search KB)
    ↓
Calculate confidence score
    ↓
If score ≥ 0.7 → GeminiService (generate response)
    ↓
Send response & increment usage
```

## Features

### 1. Intelligent Knowledge Search

- **Tokenization**: Removes stop words, lowercases, and extracts meaningful terms
- **Firestore Query**: Uses `array-contains-any` to find matching KB entries
- **Scoring**: Implements Jaccard similarity with keyword and question matching bonuses
- **Batching**: Handles Firestore's 10-item limit for `array-contains-any` queries
- **Top-N Results**: Returns top 3 matching entries by default

### 2. AI Response Generation

- **Model**: Gemini 2.0 Flash (fast, cost-effective)
- **Context Window**: Includes top 3 KB matches with questions and answers
- **Prompt Engineering**: 
  - Instructs AI to use ONLY information from KB
  - Requires citations with numbered references
  - Guardrails to prevent hallucinations
  - Concise response format (2-3 sentences)
- **Timeout Management**: 5-second timeout with fallback to KB concatenation
- **Error Handling**: Graceful fallback on API errors

### 3. Rate Limiting

- **Daily Limit**: 500 requests per day (configurable)
- **Tracking**: Stores daily usage counts in Firestore
- **Queueing**: Requests beyond limit are queued for next day
- **Admin Alerts**: Warning when approaching limit (50 requests remaining)
- **Queue Processing**: Automatic retry every 60 seconds

### 4. Confidence Threshold

- **Default Threshold**: 0.7 (70% confidence)
- **Per-Server Configuration**: Adjustable threshold
- **Low Confidence Response**: Polite message explaining uncertainty
- **No Match Response**: Suggests rephrasing or contacting support

### 5. Usage Tracking

- **Per-User Limits**: Free tier (10 msgs/month), Pro tier (1000 msgs/month)
- **Automatic Reset**: Monthly reset on first day of month
- **Increment Only on Success**: Usage only counted for successful AI responses
- **Graceful Limit Handling**: Clear message when limit exceeded

### 6. Per-Server Configuration

- **AI Enable/Disable**: Toggle AI responses per server
- **Channel Whitelist**: Restrict AI to specific channels (empty = all channels)
- **Confidence Threshold**: Customize per server
- **Miss Notifications**: DM owner on repeated knowledge gaps

### 7. Owner Notifications

- **Miss Tracking**: Counts consecutive failed queries per user
- **Threshold**: 3 consecutive misses (configurable)
- **DM Content**: User info, query text, server/channel details
- **Auto Reset**: Reset counter after successful response

## Configuration

### Environment Variables

```env
DISCORD_BOT_TOKEN=your_discord_bot_token
GEMINI_API_KEY=your_gemini_api_key
FIREBASE_PROJECT_ID=your_firebase_project_id
OWNER_USER_ID=your_discord_user_id
```

### Firestore Collections

#### `kbs` - Knowledge Base Entries
```typescript
{
  question: string;
  answer: string;
  keywords: string[];  // Lowercase, used for search
  category?: string;
}
```

#### `server_configs` - Server Configuration
```typescript
{
  aiEnabled: boolean;           // Default: true
  enabledChannels: string[];    // Default: [] (all channels)
  confidenceThreshold: number;  // Default: 0.7
  notifyOnMiss: boolean;        // Default: false
}
```

#### `gemini_rate_limits` - Daily Rate Tracking
```typescript
{
  date: string;      // YYYY-MM-DD
  count: number;     // Number of requests today
}
```

#### `usage` - User Usage Tracking
```typescript
{
  messageCount: number;
  monthlyLimit: number;
  resetDate: Timestamp;
  tier: 'free' | 'pro';
}
```

## Response Examples

### High Confidence Match
```
User: How do I reset my password?

Bot: To reset your password, click the "Forgot Password" link on the login 
page and follow the email instructions. You'll need access to your registered 
email address to complete the process [1].

**References:**
[1] How do I reset my password? (confidence: 85.3%)
```

### Low Confidence
```
User: What's the weather like?

Bot: I found some potentially relevant information, but I'm not confident 
enough (45.2% confidence) to provide an accurate answer. Please try rephrasing 
your question or contact support.
```

### No Match
```
User: Tell me about quantum physics

Bot: I couldn't find relevant information in my knowledge base to answer your 
question. Please try rephrasing or contact support for help.
```

### Rate Limited
```
User: How do I create an account?

Bot: (Response queued - will process when daily limit resets)
Fallback: Based on my knowledge base [1]:

To create an account, visit our signup page and fill out the registration form...

**References:**
[1] How do I create an account? (confidence: 92.1%)
```

## Testing

### Run All Tests
```bash
npm test
```

### Run with Coverage
```bash
npm run test:coverage
```

### Test Coverage Includes
- ✅ Firestore knowledge search with various query types
- ✅ Gemini service rate limiting and queueing
- ✅ Config service per-server settings
- ✅ Message handler confidence threshold logic
- ✅ Usage tracking and limit enforcement
- ✅ Miss tracking and owner notifications

## Performance Characteristics

- **Search Latency**: ~100-300ms (Firestore query)
- **AI Generation**: ~1-3 seconds (Gemini API)
- **Total Response Time**: ~2-4 seconds under normal conditions
- **Timeout**: 5 seconds maximum, then fallback
- **Memory**: Minimal (stateless design)
- **Scalability**: Horizontal scaling supported

## Best Practices

### Knowledge Base Management
1. Use descriptive questions (not too broad)
2. Include comprehensive answers (2-3 paragraphs)
3. Add relevant keywords (5-10 per entry)
4. Categorize entries for easier maintenance
5. Regularly review and update based on miss notifications

### Prompt Engineering
1. Keep context concise (top 3 matches only)
2. Use clear instructions with guardrails
3. Require citations for traceability
4. Set response length limits
5. Include fallback instructions

### Rate Limit Management
1. Monitor daily usage trends
2. Set up alerts for 50 requests remaining
3. Consider upgrading API tier for high-traffic servers
4. Implement smart queueing for off-peak processing
5. Cache common queries (future enhancement)

### Security Considerations
1. Validate all user input
2. Sanitize output for Discord formatting
3. Implement rate limiting per user
4. Use Gemini safety filters
5. Monitor for abuse patterns

## Future Enhancements

- [ ] Semantic search with embeddings
- [ ] Multi-language support
- [ ] Response caching
- [ ] A/B testing different prompts
- [ ] Analytics dashboard
- [ ] Auto-KB updates from Discord discussions
- [ ] Integration with external knowledge sources
- [ ] Voice query support
- [ ] Image-based queries

## Troubleshooting

### Bot not responding
1. Check AI is enabled for server: `ConfigService.getConfig(guildId)`
2. Verify channel is whitelisted
3. Check user hasn't exceeded usage limit
4. Verify Gemini API key is valid
5. Check Firestore connectivity

### Low quality responses
1. Review KB entries for completeness
2. Adjust confidence threshold
3. Add more relevant keywords to KB entries
4. Review Gemini prompt engineering
5. Check for hallucinations (add more guardrails)

### Rate limit issues
1. Monitor `gemini_rate_limits` collection
2. Check for unusual usage patterns
3. Consider upgrading API tier
4. Implement request queuing
5. Set up admin alerts

### Performance issues
1. Optimize Firestore queries (add indexes)
2. Reduce number of KB matches passed to Gemini
3. Implement caching layer
4. Use Firestore emulator for local testing
5. Monitor API latency

## Support

For issues or questions:
1. Check logs for error messages
2. Review Firestore collections for data integrity
3. Test with Firestore emulator
4. Verify environment variables
5. Check Discord bot permissions
