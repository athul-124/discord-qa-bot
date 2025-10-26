# Testing Guide

This document provides detailed information about the testing infrastructure for the discord-qa-bot project.

## Test Framework

- **Mocha**: Test runner
- **Chai**: Assertion library
- **Sinon**: Mocking and stubbing library
- **NYC**: Code coverage tool

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Environment Variables

Tests use the `.env.test` file for test-specific configuration. Key variables:

```env
NODE_ENV=test
FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_PROJECT_ID=test-project
```

## Test Organization

### Unit Tests

Located in `test/services/` and `test/utils/`, these tests verify individual components in isolation:

#### Knowledge Base Parser (`test/services/knowledgeBase.test.ts`)

Tests for CSV and PDF parsing functionality:
- Valid CSV parsing with all fields
- Invalid row rejection (missing question/answer)
- Keyword extraction from text
- Quoted field handling
- PDF Q&A format extraction

**Key scenarios:**
```typescript
// CSV with invalid rows
it('should reject rows with missing question', async () => {
  // Test implementation
});

// Keyword extraction
it('should extract keywords when not provided', async () => {
  // Test implementation
});
```

#### Knowledge Search (`test/services/knowledgeSearch.test.ts`)

Tests for the search and scoring algorithm:
- Result ordering by relevance score
- Exact match detection (score = 1.0)
- Threshold filtering
- Keyword matching
- Case-insensitivity

**Key scenarios:**
```typescript
// Exact match
it('should return exact question match with highest score', () => {
  const results = searchService.search('What is Discord?');
  expect(results[0].score).to.equal(1.0);
});

// Threshold behavior
it('should return only results above threshold', () => {
  searchService.setThreshold(0.5);
  const results = searchService.search('query');
  results.forEach(r => expect(r.score).to.be.at.least(0.5));
});
```

#### Usage Service (`test/services/usageService.test.ts`)

Tests for usage tracking and limits:
- Usage data retrieval
- User initialization (free/pro tiers)
- Message limit enforcement
- Automatic monthly reset
- Remaining message calculation

**Key scenarios:**
```typescript
// Limit enforcement
it('should return false when user has reached limit', async () => {
  // Mock user at limit
  const canSend = await usageService.canSendMessage('user123');
  expect(canSend).to.be.false;
});

// Monthly reset
it('should reset usage if reset date has passed', async () => {
  // Test automatic reset logic
});
```

#### Spam Detection (`test/utils/spamDetection.test.ts`)

Tests for spam and malicious content detection:
- URL detection (http, https, www)
- Suspicious patterns (Discord invites, bit.ly, etc.)
- Excessive repetition
- Excessive capitalization
- Message length limits
- Clean message validation

**Key scenarios:**
```typescript
// URL detection
it('should detect HTTP URLs', () => {
  const result = detector.check('Check out http://example.com');
  expect(result.isSpam).to.be.true;
});

// Clean messages
it('should allow clean simple messages', () => {
  const result = detector.check('Hello, how are you?');
  expect(result.isSpam).to.be.false;
});
```

#### Subscription Service (`test/services/subscriptionService.test.ts`)

Tests for subscription and tier management:
- Free vs Pro tier differentiation
- Feature gating logic
- Message limit by tier
- Subscription expiration
- Whop API integration (mocked)

**Key scenarios:**
```typescript
// Tier features
it('should return free tier features', () => {
  const features = service.getFeatures('free');
  expect(features.monthlyMessageLimit).to.equal(10);
  expect(features.prioritySupport).to.be.false;
});

// Pro tier
it('should return pro tier features', () => {
  const features = service.getFeatures('pro');
  expect(features.monthlyMessageLimit).to.equal(1000);
  expect(features.prioritySupport).to.be.true;
});
```

### Integration Tests

Located in `test/integration/`, these tests verify interactions between multiple services:

#### Message Flow (`test/integration/messageFlow.test.ts`)

End-to-end testing of the complete message processing pipeline:

1. **Valid message flow**
   - Spam check passes
   - Usage limit check passes
   - Knowledge search succeeds
   - Usage incremented

2. **Spam rejection flow**
   - Spam detected early
   - Processing stops

3. **Usage limit enforcement**
   - Free tier limits respected
   - Pro tier allows more messages
   - Monthly reset works correctly

4. **Error handling**
   - Firestore errors handled gracefully
   - Empty results handled properly

**Example flow test:**
```typescript
it('should process a valid user message end-to-end', async () => {
  const userId = 'user123';
  const message = 'How do I join a server?';

  // 1. Check spam
  const spamCheck = spamDetector.check(message);
  expect(spamCheck.isSpam).to.be.false;

  // 2. Check usage
  const canSend = await usageService.canSendMessage(userId);
  expect(canSend).to.be.true;

  // 3. Search knowledge base
  const result = searchService.getBestMatch(message);
  expect(result).to.not.be.null;

  // 4. Increment usage
  await usageService.incrementUsage(userId);
});
```

## Mocking Strategy

### Firestore Mocking

All Firestore operations are mocked using Sinon:

```typescript
const mockDocRef = {
  get: sinon.stub(),
  set: sinon.stub().resolves(),
  update: sinon.stub().resolves()
};

const mockCollection = {
  doc: sinon.stub().returns(mockDocRef)
};

const mockDb = {
  collection: sinon.stub().returns(mockCollection)
};
```

### External API Mocking

External services (Discord, Gemini, Whop) are mocked to avoid network calls:

```typescript
// Example: Mocking Whop API
const service = new SubscriptionService('test_whop_key');
// API calls return test data without actual HTTP requests
```

### File System Mocking

File operations are stubbed in tests:

```typescript
const readFileSyncStub = sinon.stub(fs, 'readFileSync');
readFileSyncStub.returns('mock file content');
```

## Coverage Requirements

Target coverage: **70%** for all metrics
- Lines: 70%
- Functions: 70%
- Branches: 70%
- Statements: 70%

View coverage report:
```bash
npm run test:coverage
open coverage/index.html
```

## Testing with Firebase Emulator

For more realistic integration testing:

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Initialize Firebase (if not done):
   ```bash
   firebase init emulators
   ```

3. Start emulator:
   ```bash
   firebase emulators:start --only firestore
   ```

4. Run tests with emulator:
   ```bash
   cp .env.test .env
   npm test
   ```

## Writing New Tests

### Test Template

```typescript
import { expect } from 'chai';
import * as sinon from 'sinon';

describe('ComponentName', () => {
  let component: ComponentType;
  let mockDependency: any;

  beforeEach(() => {
    // Setup
    mockDependency = { /* mock setup */ };
    component = new ComponentType(mockDependency);
  });

  afterEach(() => {
    // Cleanup
    sinon.restore();
  });

  describe('methodName', () => {
    it('should do expected behavior', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = component.methodName(input);

      // Assert
      expect(result).to.equal('expected');
    });

    it('should handle edge case', () => {
      // Test edge cases
    });

    it('should handle errors', () => {
      // Test error handling
    });
  });
});
```

### Best Practices

1. **Isolation**: Each test should be independent
2. **Clear naming**: Describe what the test verifies
3. **AAA pattern**: Arrange, Act, Assert
4. **Mock external dependencies**: No network calls in tests
5. **Test edge cases**: Empty inputs, null values, limits
6. **Test error paths**: Not just happy paths
7. **Use beforeEach/afterEach**: Setup and cleanup

### Common Patterns

#### Testing async functions:
```typescript
it('should handle async operations', async () => {
  const result = await service.asyncMethod();
  expect(result).to.exist;
});
```

#### Testing errors:
```typescript
it('should throw error for invalid input', () => {
  expect(() => service.method('invalid')).to.throw();
});

it('should handle rejected promises', async () => {
  try {
    await service.failingMethod();
    expect.fail('Should have thrown');
  } catch (error) {
    expect(error.message).to.include('expected error');
  }
});
```

#### Testing with stubs:
```typescript
it('should call dependency with correct params', () => {
  const spy = sinon.spy(mockDependency, 'method');
  service.doSomething();
  expect(spy.calledOnce).to.be.true;
  expect(spy.firstCall.args[0]).to.equal('expected');
});
```

## Continuous Integration

Tests run automatically via GitHub Actions on:
- Every push to `main` or `develop`
- Every pull request

CI configuration: `.github/workflows/test.yml`

The workflow:
1. Checks out code
2. Installs dependencies with `npm ci`
3. Runs tests with `npm test`
4. Generates coverage report
5. Uploads coverage as artifact

## Troubleshooting

### Tests failing locally

1. Ensure dependencies are installed: `npm install`
2. Check Node.js version: `node --version` (should be 18.x or higher)
3. Clear any cached builds: `rm -rf node_modules dist && npm install`
4. Check environment variables in `.env.test`

### Stub/Mock not working

```typescript
// Make sure to restore after each test
afterEach(() => {
  sinon.restore();
});

// Verify stub is called
expect(stubFunction.called).to.be.true;
```

### Coverage not meeting threshold

Run coverage to see which lines are missing:
```bash
npm run test:coverage
```

Then add tests for uncovered code paths.

## Additional Resources

- [Mocha Documentation](https://mochajs.org/)
- [Chai Assertion Styles](https://www.chaijs.com/guide/styles/)
- [Sinon Stubs and Spies](https://sinonjs.org/releases/latest/stubs/)
- [NYC Coverage Configuration](https://github.com/istanbuljs/nyc)
