# Contributing to Discord Q&A Bot

Thank you for your interest in contributing to the Discord Q&A Bot! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Follow the project's code style and conventions

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/discord-qa-bot.git
   cd discord-qa-bot
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Setup

1. Copy `.env.example` to `.env` and configure your environment
2. Obtain Discord bot token and Firebase credentials
3. Run in development mode:
   ```bash
   npm run dev
   ```

## Code Style

We use ESLint and Prettier for code formatting:

```bash
# Run linter
npm run lint

# Format code
npm run format
```

### TypeScript Guidelines

- Use strict TypeScript types (avoid `any` when possible)
- Define interfaces for all data structures
- Use async/await over promises
- Document complex functions with JSDoc comments

### Naming Conventions

- **Files**: camelCase (e.g., `spamDetectionService.ts`)
- **Classes**: PascalCase (e.g., `AdminCommands`)
- **Functions**: camelCase (e.g., `detectSpam`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `SPAM_BASE_PATTERN`)
- **Interfaces**: PascalCase (e.g., `GuildConfig`)

## Project Structure

```
src/
├── index.ts              # Main entry point
├── config/               # Configuration files
├── types/                # TypeScript type definitions
├── services/             # Business logic services
├── handlers/             # Event handlers
├── commands/             # Discord slash commands
└── jobs/                 # Scheduled jobs
```

## Making Changes

### Adding a New Feature

1. Create a new branch from `main`
2. Implement your feature following the code style
3. Add appropriate error handling
4. Update documentation in README.md if needed
5. Test your changes thoroughly
6. Submit a pull request

### Fixing a Bug

1. Create an issue describing the bug (if one doesn't exist)
2. Create a branch referencing the issue number
3. Fix the bug with minimal changes
4. Add tests to prevent regression
5. Submit a pull request referencing the issue

### Adding a Service

When adding a new service:

1. Create file in `src/services/`
2. Follow the singleton pattern used by existing services
3. Export a single instance
4. Add TypeScript interfaces to `src/types/`
5. Document public methods

Example:
```typescript
class MyService {
  async doSomething(): Promise<void> {
    // Implementation
  }
}

export const myService = new MyService();
```

### Adding a Command

When adding a new slash command:

1. Add command builder in `AdminCommands.getCommands()`
2. Add handler in `AdminCommands.handleCommand()`
3. Follow existing command patterns
4. Add permission checks
5. Provide user-friendly error messages

## Testing

Currently, the project uses manual testing. When adding features:

1. Test with a real Discord bot in a test server
2. Verify Firestore data is correctly stored
3. Test error scenarios
4. Verify rate limiting and API constraints

Future: We plan to add automated tests.

## Documentation

When making changes:

1. Update README.md for user-facing changes
2. Update DEPLOYMENT.md for deployment-related changes
3. Add JSDoc comments for complex functions
4. Update type definitions

## Pull Request Process

1. **Before submitting**:
   - Run `npm run lint` and fix any issues
   - Run `npm run build` to ensure it compiles
   - Test your changes thoroughly
   - Update documentation

2. **PR Title**: Use conventional commits format:
   - `feat: Add new feature`
   - `fix: Fix bug in spam detection`
   - `docs: Update README`
   - `refactor: Improve code structure`
   - `chore: Update dependencies`

3. **PR Description**: Include:
   - What changes were made
   - Why the changes were needed
   - How to test the changes
   - Screenshots (if UI-related)
   - Related issue numbers

4. **Review Process**:
   - Maintainers will review your PR
   - Address any feedback
   - Once approved, your PR will be merged

## Common Tasks

### Adding a Firestore Collection

1. Define interface in `src/types/index.ts`
2. Add methods in `src/services/firestoreService.ts`
3. Document the collection in README.md

### Adding Environment Variables

1. Add to `.env.example` with placeholder
2. Document in README.md and DEPLOYMENT.md
3. Update `src/config/index.ts`

### Modifying Spam Detection

Edit `src/services/spamDetectionService.ts`:
- Add new patterns to `DEFAULT_SPAM_PATTERNS`
- Modify detection logic in `detectSpam()`
- Test with various message types

## Release Process

Maintainers follow this process for releases:

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create a git tag
4. Build and test
5. Deploy to production
6. Create GitHub release

## Questions?

- Open an issue for bugs or feature requests
- Start a discussion for general questions
- Check existing issues before creating new ones

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
