# discord-qa-bot

A Discord Q&A bot with AI-powered knowledge base search, usage tracking, spam detection, and subscription management.

## Features

- **Knowledge Base Management**: Parse and search knowledge bases from CSV and PDF files
- **AI-Powered Search**: Intelligent keyword matching and relevance scoring powered by Google Gemini
- **Usage Tracking**: Monthly message limits with automatic reset (100 free, unlimited pro)
- **Spam Detection**: Comprehensive spam and malicious content filtering
- **Subscription Tiers**: Free and Pro tier support with Whop integration
- **Easy Upgrade**: `/upgrade` slash command with Whop checkout integration
- **Smart Notifications**: DM server owners when limits are reached with upgrade instructions
- **Firebase/Firestore**: Cloud storage for user data and usage tracking

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Firebase project (for production)
- Discord bot token
- Gemini API key
- Whop API key (optional, for subscription management)

### Installation

```bash
npm install
```

### Environment Setup

Create a `.env` file in the root directory:

```env
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_client_id
GEMINI_API_KEY=your_gemini_api_key
WHOP_API_KEY=your_whop_api_key
WHOP_PRODUCT_ID=your_whop_product_id
WHOP_CHECKOUT_URL=https://whop.com/your-product-checkout-url
DASHBOARD_URL=https://your-dashboard-url.com/dashboard

# Firebase/Firestore settings
FIREBASE_PROJECT_ID=your-project-id

# Optional settings
NODE_ENV=development
LOG_LEVEL=info
```

### Building

```bash
npm run build
```

### Running

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

### Deploying Slash Commands

After setting up your bot, deploy the slash commands:

```bash
npx ts-node src/scripts/deployCommands.ts
```

## Usage

### Available Commands

- `/config add-channel #channel` - Add a channel where the bot will respond
- `/config remove-channel #channel` - Remove a channel from the bot's response list
- `/config list-channels` - List all configured channels
- `/config set-owner contact` - Set owner contact information
- `/upgrade` - Get information about upgrading to Pro tier

### Subscription Tiers

**Free Tier**
- 100 messages per month per server
- Automatic monthly reset on the 1st
- All core features included

**Pro Tier ($10/month)**
- Unlimited message processing
- Daily insights and analytics
- Priority support
- Advanced features

Use `/upgrade` in your Discord server to see upgrade options and get your Whop checkout link.

## Testing

This project uses Mocha, Chai, and Sinon for comprehensive testing.

### Running Tests

Execute all tests:

```bash
npm test
```

Run tests in watch mode (auto-rerun on file changes):

```bash
npm run test:watch
```

Run tests with coverage report:

```bash
npm run test:coverage
```

### Test Structure

The test suite includes:

#### Unit Tests

- **Knowledge Base Parser** (`test/services/knowledgeBase.test.ts`)
  - CSV parsing with validation
  - PDF Q&A extraction
  - Keyword extraction and filtering
  - Invalid row rejection

- **Knowledge Search** (`test/services/knowledgeSearch.test.ts`)
  - Relevance scoring algorithm
  - Result ordering and ranking
  - Threshold behavior
  - Exact and partial matching

- **Usage Service** (`test/services/usageService.test.ts`)
  - Monthly limit enforcement
  - Usage count tracking
  - Automatic reset on month boundary
  - Tier-based limits (free vs pro)

- **Spam Detection** (`test/utils/spamDetection.test.ts`)
  - URL detection
  - Suspicious pattern matching
  - Excessive caps and repetition
  - Clean message validation

- **Subscription Service** (`test/services/subscriptionService.test.ts`)
  - Tier differentiation (free/pro)
  - Feature gating logic
  - Whop API integration
  - Expiration handling

#### Integration Tests

- **Message Flow** (`test/integration/messageFlow.test.ts`)
  - Complete message pipeline validation
  - Service interaction testing
  - Error handling across services
  - End-to-end user flows

### Testing with Firebase Emulator

To test against the Firebase Firestore emulator:

1. Install Firebase tools:
   ```bash
   npm install -g firebase-tools
   ```

2. Start the Firestore emulator:
   ```bash
   firebase emulators:start --only firestore
   ```

3. Use the test environment configuration:
   ```bash
   cp .env.test .env
   ```

4. Run tests:
   ```bash
   npm test
   ```

The tests use mocked Firestore and external services by default, so the emulator is optional but recommended for more realistic integration testing.

### Coverage Report

After running `npm run test:coverage`, view the HTML coverage report:

```bash
open coverage/index.html
```

Coverage targets:
- Lines: 70%
- Functions: 70%
- Branches: 70%
- Statements: 70%

### Key Modules Covered

All core services have comprehensive test coverage:

- ✅ Knowledge base parsing and keyword extraction
- ✅ Search algorithm and scoring
- ✅ Usage tracking and limit enforcement
- ✅ Spam detection patterns
- ✅ Subscription tier management
- ✅ Integration between services

### Continuous Integration

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

The CI workflow (`.github/workflows/test.yml`) runs tests on Node.js 18.x and 20.x, ensuring compatibility across versions.

## Architecture

```
src/
├── services/
│   ├── knowledgeBase.ts      # CSV/PDF parsing
│   ├── knowledgeSearch.ts    # Search and scoring
│   ├── usageService.ts       # Usage tracking
│   └── subscriptionService.ts # Tier management
└── utils/
    └── spamDetection.ts      # Spam filtering

test/
├── services/                 # Unit tests
├── utils/                    # Utility tests
└── integration/              # Integration tests
```

## Development

### Code Style

Run linting:

```bash
npm run lint
```

Format code:

```bash
npm run format
```

### Adding Tests

When adding new features:

1. Create corresponding test file in `test/` directory
2. Follow existing test patterns (describe/it blocks)
3. Mock external dependencies (Firestore, APIs)
4. Ensure tests are isolated and reproducible
5. Run `npm run test:coverage` to verify coverage

Example test structure:

```typescript
import { expect } from 'chai';
import * as sinon from 'sinon';

describe('MyService', () => {
  let service: MyService;

  beforeEach(() => {
    service = new MyService();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('myMethod', () => {
    it('should do something', () => {
      const result = service.myMethod();
      expect(result).to.equal('expected');
    });
  });
});
```

## Contributing

1. Create a feature branch
2. Write tests for new functionality
3. Ensure all tests pass (`npm test`)
4. Submit a pull request

All pull requests must pass CI tests before merging.

## License

ISC
