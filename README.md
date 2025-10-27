# discord-qa-bot

A Discord Q&A bot with automated moderation, spam filtering, and analytics capabilities.

## Features

### 🛡️ Spam Detection & Moderation
- Automatic spam detection using regex patterns (`/https?:\/\/|spam/i`)
- Customizable spam patterns per server
- Automatic message deletion (requires `MANAGE_MESSAGES` permission)
- Real-time DM notifications to server owners about moderation actions
- Comprehensive moderation logging to Firestore

### 📊 Analytics & Trends
- Track message metrics (total, spam, legitimate)
- Log keywords, response times, and satisfaction indicators
- Daily automated analytics reports
- On-demand trend analysis via slash commands
- Track top questions, keywords, and unanswered queries

### 🔄 Scheduled Jobs
- Daily cron job for analytics aggregation
- Automated summary DMs to server owners
- Rate limit handling for Discord API
- Configurable scheduling and timezone

## Prerequisites

- Node.js 18+ and npm
- Discord Bot Token and Client ID
- Firebase/Firestore project with service account credentials
- Discord Bot Permissions:
  - `MANAGE_MESSAGES` (required for spam deletion)
  - `VIEW_CHANNELS`
  - `SEND_MESSAGES`
  - `EMBED_LINKS`
  - `READ_MESSAGE_HISTORY`

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd discord-qa-bot
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_client_id_here
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
SPAM_DETECTION_ENABLED=true
DAILY_REPORT_CRON=0 9 * * *
DAILY_REPORT_TIMEZONE=UTC
```

4. Add Firebase service account key:
   - Download your Firebase service account key from the Firebase Console
   - Save it as `serviceAccountKey.json` in the project root

5. Build the project:
```bash
npm run build
```

6. Start the bot:
```bash
npm start
```

For development:
```bash
npm run dev
```

## Required Discord Bot Permissions

The bot requires the following permissions to function properly:

- **MANAGE_MESSAGES**: Required to delete spam messages
- **VIEW_CHANNELS**: To see and monitor channels
- **SEND_MESSAGES**: To send responses and notifications
- **EMBED_LINKS**: To send rich embedded messages
- **READ_MESSAGE_HISTORY**: To analyze message trends

### Permission Integer: `93248`

When inviting the bot, use this URL format:
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=93248&scope=bot%20applications.commands
```

## Admin Commands

All commands require Administrator permissions:

### `/moderation-history [limit]`
View recent moderation actions
- **limit**: Number of records (1-50, default: 10)

### `/add-spam-pattern <pattern>`
Add a custom spam detection pattern
- **pattern**: Regex pattern (e.g., "badword|anotherbad")

### `/remove-spam-pattern <pattern>`
Remove a custom spam detection pattern
- **pattern**: Pattern to remove

### `/list-spam-patterns`
List all custom spam detection patterns

### `/trends [days]`
View analytics trends for the server
- **days**: Number of days to analyze (1-30, default: 1)

### `/usage-stats`
View usage statistics for the server

### `/force-daily-report`
Force trigger the daily analytics report

### `/toggle-spam-deletion`
Toggle spam message deletion on/off

## Firestore Collections

The bot uses the following Firestore collections:

### `guildConfigs`
Stores per-guild configuration:
- `spamPatternsEnabled`: Boolean
- `customSpamPatterns`: Array of strings
- `moderatorRoleId`: Optional string
- `optOutSpamDeletion`: Boolean
- `notificationChannelId`: Optional string

### `moderationLogs`
Logs all moderation actions:
- `guildId`, `userId`, `username`
- `action`, `reason`, `messageContent`
- `channelId`, `timestamp`, `metadata`

### `trendLogs`
Stores trend data for analytics:
- `guildId`, `userId`, `channelId`
- `keywords`, `question`, `responseTime`
- `satisfactionScore`, `wasAnswered`, `timestamp`

### `usageMetrics`
Aggregated usage statistics:
- `guildId`, `period`
- `totalMessages`, `spamMessages`, `legitimateMessages`
- `questionsAnswered`, `unansweredQueries`, `timestamp`

## Opt-Out of Spam Deletion

Server administrators can disable automatic spam deletion while still logging spam detection:

```
/toggle-spam-deletion
```

When disabled:
- Spam messages will still be detected and logged
- Messages will NOT be automatically deleted
- Moderators will still receive notifications

## Daily Analytics Report

The bot sends automated daily reports to server owners containing:
- Total message count
- Spam detection statistics
- Top questions and keywords
- Unanswered queries
- Average response times

Reports are sent based on the configured cron schedule (default: 9:00 AM UTC).

### Forcing Report Generation (Development)

For testing, administrators can force report generation:
```
/force-daily-report
```

## Development

### Project Structure
```
src/
├── index.ts                    # Main bot entry point
├── config/
│   └── index.ts               # Configuration management
├── types/
│   └── index.ts               # TypeScript type definitions
├── services/
│   ├── firestoreService.ts    # Firestore operations
│   ├── spamDetectionService.ts # Spam detection logic
│   ├── moderationService.ts   # Moderation actions
│   ├── usageService.ts        # Usage metrics tracking
│   └── trendService.ts        # Trend analysis
├── handlers/
│   └── messageHandler.ts      # Message processing
├── commands/
│   └── adminCommands.ts       # Slash command handlers
└── jobs/
    └── dailyReportJob.ts      # Cron job for reports
```

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Formatting
```bash
npm run format
```

## Architecture

1. **Message Flow**:
   - Message received → Spam detection check
   - If spam: Delete → Log → Notify moderators
   - If legitimate: Process → Log trends → Update metrics

2. **Spam Detection**:
   - Base pattern: `/https?:\/\/|spam/i`
   - Default patterns (Discord invites, "free nitro", etc.)
   - Custom per-guild patterns

3. **Analytics Pipeline**:
   - Real-time trend logging per message
   - Keyword extraction and storage
   - Daily aggregation via cron job
   - On-demand summary generation

4. **Data Storage**:
   - Firestore for all persistent data
   - Time-series data for trend analysis
   - Efficient querying with compound indexes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues or questions:
1. Check existing GitHub issues
2. Create a new issue with detailed information
3. Include logs and error messages

## Changelog

### Version 1.0.0
- Initial release
- Spam detection and moderation
- Analytics and trend tracking
- Daily automated reports
- Admin slash commands
