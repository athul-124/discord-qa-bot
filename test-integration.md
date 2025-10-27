# Integration Test Guide

This document outlines how to test the Discord Q&A Bot with Whop subscription gating.

## Prerequisites

Before testing, ensure you have:
- Discord bot token
- Whop API key
- (Optional) Firebase credentials

## Test Plan

### 1. Whop Service Tests

#### Test Token Validation
```typescript
// Valid token should return user info
const result = await whopService.validateToken('valid_token');
// Expected: { valid: true, user: {...}, memberships: [...] }

// Invalid token should fail
const result = await whopService.validateToken('invalid_token');
// Expected: { valid: false }
```

#### Test Subscription Check
```typescript
const hasSubscription = await whopService.hasActiveSubscription('token');
// Expected: true/false based on user's subscription status

const tier = await whopService.getSubscriptionTier('token');
// Expected: 'free' or 'pro'
```

### 2. Config Service Tests

#### Test Server Configuration
```typescript
// Link a server
const config = configService.linkServer(
  'server_123',
  'owner_456',
  'pro',
  'whop_customer_789',
  'whop_token',
  Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
);

// Get configuration
const retrieved = configService.getConfig('server_123');
// Expected: config object with tier 'pro'

// Check tier
const tier = configService.getTier('server_123');
// Expected: 'pro'
```

### 3. Usage Service Tests

#### Test Message Tracking
```typescript
// Start with clean slate
usageService.resetUsage('server_123');

// Increment usage
for (let i = 0; i < 50; i++) {
  usageService.incrementUsage('server_123');
}

// Check usage
const usage = usageService.getUsage('server_123');
// Expected: { messageCount: 50, limitReached: false, ... }

// Check remaining
const remaining = usageService.getRemainingMessages('server_123');
// Expected: 50 (100 - 50)
```

#### Test Limit Enforcement
```typescript
// Reset and reach limit
usageService.resetUsage('server_123');
for (let i = 0; i < 100; i++) {
  usageService.incrementUsage('server_123');
}

const hasReached = usageService.hasReachedLimit('server_123');
// Expected: true
```

### 4. API Endpoint Tests

#### Test Health Endpoint
```bash
curl http://localhost:3000/api/health
# Expected: {"status":"ok","timestamp":"...","bot":"ready"}
```

#### Test Link Server
```bash
curl -X POST http://localhost:3000/api/link-server \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "whopToken": "valid_whop_token",
    "serverId": "discord_server_id"
  }'
# Expected 200: {"success":true,"config":{...}}
# Expected 401 for invalid token: {"error":"Invalid or expired Whop token"}
```

#### Test Upload Knowledge Base
```bash
curl -X POST http://localhost:3000/api/upload-kb \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": "discord_server_id",
    "knowledgeBase": "Product documentation..."
  }'
# Expected 200: {"success":true,"message":"Knowledge base updated successfully"}
# Expected 401 for no auth: {"error":"Authorization header required"}
```

#### Test Get Usage
```bash
curl http://localhost:3000/api/usage/discord_server_id \
  -H "Authorization: Bearer YOUR_TOKEN"
# Expected 200: {
#   "serverId": "...",
#   "tier": "free",
#   "usage": {
#     "messageCount": 45,
#     "limitReached": false,
#     "lastReset": 1234567890000,
#     "remaining": 55
#   }
# }
```

#### Test Get Subscription
```bash
curl http://localhost:3000/api/subscription/discord_server_id \
  -H "Authorization: Bearer YOUR_TOKEN"
# Expected 200: {
#   "serverId": "...",
#   "tier": "pro",
#   "whopCustomerId": "...",
#   "expiresAt": 1234567890000,
#   "linkedAt": 1234567890000
# }
```

### 5. Discord Bot Tests

#### Test Bot Startup
1. Start bot with valid Discord token
2. Check console for "Discord bot logged in as..."
3. Verify bot appears online in Discord

#### Test Message Processing

**Free Tier Server:**
1. Send message in configured channel
2. Bot should respond
3. Usage should increment
4. After 100 messages, bot should send limit notice

**Pro Tier Server:**
1. Send message in configured channel
2. Bot should respond
3. No usage limits enforced

#### Test Daily Insights
1. Set up Pro tier server
2. Wait for or manually trigger daily insights
3. Server owner should receive DM with insights

### 6. Freemium Logic Tests

#### Test Free Tier Enforcement
```typescript
// Setup free tier server
configService.setConfig('server_123', {
  serverId: 'server_123',
  ownerId: 'owner_123',
  tier: 'free'
});

// Send 99 messages - should work
for (let i = 0; i < 99; i++) {
  // Send message to bot
  // Expected: Bot responds
}

// Send 100th message
// Expected: Bot responds

// Send 101st message
// Expected: Bot sends limit notice and doesn't process
```

#### Test Pro Tier Benefits
```typescript
// Setup pro tier server
configService.setConfig('server_123', {
  serverId: 'server_123',
  ownerId: 'owner_123',
  tier: 'pro'
});

// Send unlimited messages - should all work
for (let i = 0; i < 200; i++) {
  // Send message to bot
  // Expected: Bot responds every time
}

// Check usage tracking
const usage = usageService.getUsage('server_123');
// Expected: No limit enforcement for pro tier
```

### 7. Authentication Tests

#### Test Firebase Auth
```bash
# Get Firebase ID token from your app
FIREBASE_TOKEN="eyJhbGc..."

curl http://localhost:3000/api/config/server_123 \
  -H "Authorization: Bearer $FIREBASE_TOKEN"
# Expected 200: Server config
# Expected 401 for invalid token
```

#### Test Whop Auth
```bash
# Get Whop user token
WHOP_TOKEN="..."

curl http://localhost:3000/api/config/server_123 \
  -H "Authorization: Bearer $WHOP_TOKEN"
# Expected 200: Server config
# Expected 401 for invalid token
```

## Manual Testing Checklist

- [ ] Bot connects to Discord successfully
- [ ] Bot responds to messages in configured channels
- [ ] Bot ignores messages from other bots
- [ ] Free tier servers hit limit at 100 messages
- [ ] Limit notice is sent to server owner
- [ ] Pro tier servers bypass limits
- [ ] Daily insights sent to Pro server owners
- [ ] Link server endpoint validates Whop tokens
- [ ] Link server endpoint verifies server ownership
- [ ] Upload KB endpoint requires authentication
- [ ] Usage endpoint returns accurate statistics
- [ ] Config endpoint allows channel configuration
- [ ] Invalid tokens return 401 errors
- [ ] Missing auth headers return 401 errors
- [ ] Server not found returns 404 errors

## Heroku Deployment Tests

- [ ] App deploys successfully
- [ ] Environment variables are set
- [ ] Web dyno starts and responds to requests
- [ ] Worker dyno starts and bot comes online
- [ ] Logs show no errors
- [ ] Data persists between dyno restarts (if using external storage)

## Performance Tests

- [ ] Token validation caching works (check response times)
- [ ] Concurrent requests handled properly
- [ ] Message processing is fast (<1s response time)
- [ ] No memory leaks under load
- [ ] Data files don't grow excessively

## Security Tests

- [ ] Invalid tokens rejected
- [ ] Expired tokens rejected
- [ ] Server ownership verified before linking
- [ ] Authentication required for protected endpoints
- [ ] No sensitive data exposed in error messages
- [ ] CORS headers properly configured
