# Test Commands Quick Reference

## Basic Test Commands

### Run All Tests
```bash
npm test
```
Runs the complete test suite (114 tests) with Mocha.

### Run Tests in Watch Mode
```bash
npm run test:watch
```
Automatically re-runs tests when source or test files change. Perfect for development.

### Run Tests with Coverage
```bash
npm run test:coverage
```
Generates coverage report showing which lines/branches are tested.

### View Coverage Report
```bash
# After running test:coverage
open coverage/index.html          # macOS
xdg-open coverage/index.html      # Linux
start coverage/index.html         # Windows
```

## Development Commands

### Build TypeScript
```bash
npm run build
```
Compiles TypeScript to JavaScript in the `dist/` directory.

### Run Linter
```bash
npm run lint
```
Checks code for style issues and potential bugs.

### Format Code
```bash
npm run format
```
Auto-formats code with Prettier.

## Firebase Emulator (Optional)

### Install Firebase Tools
```bash
npm install -g firebase-tools
```

### Start Firestore Emulator
```bash
firebase emulators:start --only firestore
```
Runs local Firestore emulator on `localhost:8080`.

### Run Tests with Emulator
```bash
# Copy test environment
cp .env.test .env

# Start emulator in one terminal
firebase emulators:start --only firestore

# Run tests in another terminal
npm test
```

## Continuous Integration

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

CI runs:
1. `npm ci` - Clean install dependencies
2. `npm test` - Run all tests
3. `npm run test:coverage` - Generate coverage (Node 20.x only)

## Test File Patterns

Tests are organized as:
```
test/
├── services/           # Unit tests for services
│   ├── knowledgeBase.test.ts
│   ├── knowledgeSearch.test.ts
│   ├── usageService.test.ts
│   └── subscriptionService.test.ts
├── utils/             # Unit tests for utilities
│   └── spamDetection.test.ts
└── integration/       # Integration tests
    └── messageFlow.test.ts
```

## Running Specific Tests

### Run Tests for Specific File
```bash
npx mocha test/services/knowledgeSearch.test.ts
```

### Run Tests Matching Pattern
```bash
npx mocha --grep "spam detection"
```

### Run Single Test Suite
```bash
npx mocha --grep "KnowledgeSearchService"
```

## Debugging Tests

### Run Tests with Inspection
```bash
node --inspect-brk node_modules/.bin/mocha
```
Then attach debugger (Chrome DevTools, VS Code, etc.)

### Increase Timeout for Debugging
```bash
npx mocha --timeout 999999
```

### Run Tests with Verbose Output
```bash
npx mocha --reporter spec
```

## Coverage Thresholds

Configured in `.nycrc.json`:
- Lines: 70%
- Functions: 70%
- Branches: 70%
- Statements: 70%

Current coverage (exceeds all targets):
- Lines: 89.83%
- Functions: 95.23%
- Branches: 87.5%
- Statements: 89.65%

## Environment Variables

### Test Environment
Tests use `.env.test`:
```bash
NODE_ENV=test
FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_PROJECT_ID=test-project
```

### Production Environment
Create `.env` from `.env.example`:
```bash
cp .env.example .env
# Edit .env with real credentials
```

## Troubleshooting

### Clear Test Cache
```bash
rm -rf .nyc_output coverage node_modules
npm install
npm test
```

### Fix TypeScript Compilation Issues
```bash
npx tsc --noEmit
```

### Verify Mocha Configuration
```bash
cat .mocharc.json
```

### Check Coverage Configuration
```bash
cat .nycrc.json
```

## Quick Test Verification

Verify test setup is working:
```bash
# Should show 114 passing tests
npm test

# Should generate coverage/ directory
npm run test:coverage
ls -la coverage/

# Should show TypeScript compilation success
npm run build
ls -la dist/
```

## Performance

Test execution time: ~80ms for full suite
- Unit tests: ~60ms
- Integration tests: ~20ms

Fast feedback for TDD workflow! 🚀
