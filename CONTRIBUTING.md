# Contributing to Discord QA Bot

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other contributors

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git
- Discord Developer Account
- Firebase Project (for testing)

### Setup Development Environment

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/discord-qa-bot.git
   cd discord-qa-bot
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

5. Set up your Discord bot (see README for detailed instructions)

6. Deploy commands to your test server:
   ```bash
   npm run build
   npm run discord:deploy
   ```

7. Run the bot in development mode:
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feat/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates
- `refactor/*` - Code refactoring

### Making Changes

1. Create a new branch:
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. Make your changes following our coding standards

3. Build and test:
   ```bash
   npm run build
   npm run dev  # Test manually
   ```

4. Commit your changes:
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. Push to your fork:
   ```bash
   git push origin feat/your-feature-name
   ```

6. Open a Pull Request on GitHub

### Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add knowledge base integration
fix: resolve message queue concurrency issue
docs: update README with deployment instructions
refactor: simplify config service error handling
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Provide proper type annotations
- Avoid `any` type unless absolutely necessary

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Add trailing commas in objects/arrays
- Use async/await instead of callbacks
- Use arrow functions for inline functions

### Naming Conventions

- **Files**: camelCase (e.g., `configService.ts`)
- **Classes**: PascalCase (e.g., `ConfigService`)
- **Functions**: camelCase (e.g., `getGuildConfig`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DEFAULT_LIMIT`)
- **Interfaces**: PascalCase (e.g., `GuildConfig`)

### Error Handling

- Always use try-catch for async operations
- Log errors with appropriate prefixes
- Provide user-friendly error messages
- Never expose internal errors to users

### Logging

- Use consistent prefixes: `[Bot]`, `[Service]`, etc.
- Log important operations (success and failure)
- Use appropriate log levels:
  - Info: Normal operations
  - Warn: Recoverable issues
  - Error: Failures requiring attention

## Testing Guidelines

### Manual Testing Checklist

Before submitting a PR, test:

1. ✅ Bot starts without errors
2. ✅ Slash commands appear in Discord
3. ✅ `/config add-channel` works
4. ✅ `/config list-channels` shows channels
5. ✅ Messages in configured channels get responses
6. ✅ Messages in other channels are ignored
7. ✅ Bot messages are ignored
8. ✅ DMs are ignored
9. ✅ Quota system works (simulate by setting low limit)
10. ✅ Error handling works (disconnect Firebase, etc.)

### Future: Automated Tests

We plan to add:
- Unit tests (Jest)
- Integration tests
- End-to-end tests
- CI/CD pipeline

## Documentation

### Code Documentation

- Add JSDoc comments for public functions
- Explain complex logic with inline comments
- Update README when adding new features
- Keep ARCHITECTURE.md in sync with changes

### Documentation Structure

```
docs/
├── bot-setup.md          - Bot setup and configuration
├── getting-started.md    - User guide (planned)
├── kb-best-practices.md  - Knowledge base tips (planned)
└── ...
```

## Pull Request Process

1. **Update Documentation**
   - Update README if adding user-facing features
   - Update ARCHITECTURE.md if changing structure
   - Add inline code comments for complex logic

2. **Test Thoroughly**
   - Run through manual testing checklist
   - Test edge cases
   - Verify error handling

3. **Keep PRs Focused**
   - One feature/fix per PR
   - Small, reviewable changes
   - Clear description of changes

4. **PR Template**
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Documentation update
   - [ ] Refactoring

   ## Testing
   - [ ] Tested locally
   - [ ] Manual testing checklist completed
   - [ ] No console errors

   ## Screenshots (if applicable)
   Add screenshots for UI changes
   ```

5. **Review Process**
   - Maintainer will review within 3-5 days
   - Address feedback promptly
   - Squash commits before merging

## Common Tasks

### Adding a New Slash Command

1. Define command in `src/bot/commands.ts`:
   ```typescript
   new SlashCommandBuilder()
     .setName('mycommand')
     .setDescription('My new command')
   ```

2. Add handler in `src/bot/commandHandler.ts` or create new handler file

3. Register handler in `src/bot/index.ts`:
   ```typescript
   if (interaction.commandName === 'mycommand') {
     await handleMyCommand(interaction);
   }
   ```

4. Deploy commands:
   ```bash
   npm run discord:deploy
   ```

### Adding a New Service

1. Create file in `src/services/`:
   ```typescript
   // src/services/myService.ts
   export class MyService {
     // implementation
   }
   
   export const myService = new MyService();
   ```

2. Import and use in other files:
   ```typescript
   import { myService } from '../services/myService';
   ```

### Adding Environment Variables

1. Add to `.env.example` with placeholder
2. Document in README
3. Use in code:
   ```typescript
   const myVar = process.env.MY_VAR;
   if (!myVar) {
     throw new Error('MY_VAR not set');
   }
   ```

## Project Structure

```
discord-qa-bot/
├── src/
│   ├── bot/              - Bot initialization and event handlers
│   │   ├── index.ts      - Main entry point
│   │   ├── commands.ts   - Command definitions
│   │   └── commandHandler.ts - Command handlers
│   ├── services/         - Business logic services
│   │   ├── firebase.ts   - Firebase initialization
│   │   ├── configService.ts - Guild configuration
│   │   ├── usageService.ts - Usage tracking
│   │   └── messageProcessor.ts - Message queue
│   ├── types/            - TypeScript type definitions
│   └── scripts/          - Utility scripts
│       └── deployCommands.ts - Deploy slash commands
├── docs/                 - Documentation
├── dist/                 - Compiled JavaScript (gitignored)
├── node_modules/         - Dependencies (gitignored)
├── .env                  - Local environment variables (gitignored)
├── .env.example          - Environment variable template
├── package.json          - Dependencies and scripts
├── tsconfig.json         - TypeScript configuration
├── ARCHITECTURE.md       - Architecture documentation
├── CONTRIBUTING.md       - This file
└── README.md             - User-facing documentation
```

## Questions?

- Open an issue for bugs or feature requests
- Start a discussion for questions or ideas
- Email us at support@discord-qa-bot.com

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
