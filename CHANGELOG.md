# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2024-10-26

### Added - Whop Subscription Gating Implementation

#### Core Services
- **Whop Service** (`src/services/whopService.ts`)
  - Axios-based API client for Whop integration
  - Token validation with 5-minute caching
  - Subscription verification and tier detection
  - Membership retrieval and expiration checking
  - Support for multiple authentication methods

- **Config Service** (`src/services/configService.ts`)
  - Server configuration management with JSON storage
  - Whop subscription linking and metadata persistence
  - Knowledge base content storage per server
  - Channel and settings configuration
  - Automatic tier expiration handling

- **Usage Service** (`src/services/usageService.ts`)
  - Message usage tracking per server
  - Automatic monthly reset (1st of each month)
  - Free tier limit enforcement (100 messages/month)
  - Usage history tracking (last 1000 entries)
  - Remaining quota calculations

- **Discord Service** (`src/services/discordService.ts`)
  - Discord.js v14 bot integration
  - Message pipeline with tier enforcement
  - Free tier limit notices with upgrade prompts
  - Daily insight reports for Pro tier servers
  - Server ownership verification
  - Channel-specific message handling

#### API Endpoints
- `POST /api/link-server` - Link Discord server to Whop subscription
  - Validates Whop tokens
  - Verifies server ownership
  - Persists subscription metadata (tier, customer ID, expiration)
  - Returns 401 for invalid/expired tokens

- `POST /api/upload-kb` - Upload knowledge base content (secured)
  - Requires authentication
  - Updates server knowledge base
  - Used for Q&A response generation

- `GET /api/usage/:serverId` - Get usage statistics (secured)
  - Returns message count, limit status, remaining quota
  - Tier-aware response (Pro shows null for remaining)

- `GET /api/subscription/:serverId` - Get subscription info (secured)
  - Returns tier, customer ID, expiration date
  - Linked timestamp information

- `GET /api/config/:serverId` - Get server configuration (secured)
  - Returns settings and configuration
  - Channel restrictions and enabled status

- `POST /api/config` - Update server settings (secured)
  - Modify channel restrictions
  - Enable/disable bot functionality

- `GET /api/health` - Health check endpoint
  - Returns service status and bot readiness

#### Authentication & Security
- **Dual Authentication** (`src/middleware/auth.ts`)
  - Firebase ID token validation
  - Whop access token validation
  - Request context enrichment (userId, customerId)
  - 401 responses for invalid authentication

- **Security Features**
  - Server ownership verification for sensitive operations
  - Bearer token authentication
  - CORS headers for dashboard integration
  - Protected endpoints with authentication middleware

#### Freemium Logic
- **Free Tier**
  - 100 messages per month limit
  - Friendly warning when limit reached
  - DM notification to server owner
  - Automatic monthly reset
  - Usage tracking and enforcement

- **Pro Tier**
  - Unlimited message processing
  - Daily trend insights via DM
  - Bypass all usage limits
  - Priority features flag

#### Heroku Deployment
- **Procfile**
  - Web dyno: Express API server
  - Worker dyno: Discord bot process
  - Both runnable on free tier

- **app.json**
  - Complete Heroku app manifest
  - All environment variables defined
  - Formation configuration
  - One-click deploy support

- **Documentation**
  - Comprehensive README with setup instructions
  - Heroku deployment guide (manual + one-click)
  - Environment variable configuration
  - Firebase Hosting integration guide
  - API endpoint documentation
  - Troubleshooting section

#### Project Structure
- TypeScript with strict mode
- Node.js 18+ with Express 4
- Discord.js 14 for bot functionality
- Axios for HTTP requests
- Firebase Admin SDK for authentication
- Node-cache for performance optimization
- JSON-based local storage (upgradeable to database)

#### Development Tooling
- TypeScript compilation
- Source maps for debugging
- Declaration files generation
- NPM scripts for build, dev, and production
- Separate web/worker modes
- Development mode with ts-node

#### Configuration
- Environment variable support via dotenv
- Example configuration file (.env.example)
- Configurable message limits
- Flexible authentication (Firebase optional)
- PORT handling for Heroku

#### Documentation
- **README.md** - Complete project documentation
- **ACCEPTANCE_CRITERIA.md** - Verification of requirements
- **test-integration.md** - Integration testing guide
- **.env.example** - Environment configuration template
- **CHANGELOG.md** - This file

### Technical Details

#### Dependencies
- `axios` ^1.6.2 - HTTP client for Whop API
- `discord.js` ^14.14.1 - Discord bot framework
- `dotenv` ^16.3.1 - Environment configuration
- `express` ^4.18.2 - Web server framework
- `firebase-admin` ^12.0.0 - Firebase authentication
- `node-cache` ^5.1.2 - In-memory caching

#### Data Storage
- `data/configs.json` - Server configurations and subscriptions
- `data/usage.json` - Message usage statistics
- JSON format for easy debugging and portability
- Automatic directory creation
- Atomic writes with error handling

#### Architecture Patterns
- Service-oriented architecture
- Singleton pattern for services
- Middleware-based authentication
- Async/await throughout
- Error handling with try/catch
- Graceful shutdown handling
- SIGTERM/SIGINT support

### Acceptance Criteria Met

✅ Linking endpoint validates Whop tokens and persists subscription metadata; invalid/expired tokens return 401

✅ Free tier guilds cannot exceed 100 processed messages/month; bot sends notice and logs when limit reached. Pro tier bypasses limit.

✅ Dashboard endpoints return accurate usage/subscription info with authentication enforced.

✅ Procfile and deployment instructions enable running bot + API on Heroku Free dyno without manual tweaks.

### Notes

- Firebase authentication is optional (graceful degradation if not configured)
- Whop API key is required for subscription features
- Discord Message Content intent must be enabled in Discord Developer Portal
- Data persists in local JSON files (consider database for production scale)
- Free dyno sleeps after 30 minutes of inactivity on Heroku
- Monthly usage resets automatically on the 1st of each month
- Pro tier servers receive daily insights at the same time each day
- Server ownership is verified via Discord API before linking subscriptions
