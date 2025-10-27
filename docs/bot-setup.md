# Bot Setup Guide

This guide walks you through setting up the Discord QA Bot for development or self-hosting.

## Quick Reference

### Available Commands

#### `/config add-channel`
Add a channel to the list of allowed support channels where the bot will respond to messages.

**Usage:**
```
/config add-channel #general
```

**Required Permission:** Manage Server

#### `/config remove-channel`
Remove a channel from the allowed support channels list.

**Usage:**
```
/config remove-channel #general
```

**Required Permission:** Manage Server

#### `/config list-channels`
List all currently configured support channels.

**Usage:**
```
/config list-channels
```

**Required Permission:** Manage Server

#### `/config set-owner`
Set owner contact information for the server (email or Discord username).

**Usage:**
```
/config set-owner support@example.com
```

**Required Permission:** Manage Server

## How the Bot Works

### Message Processing Pipeline

1. **Message Received** - Bot receives a message from Discord
2. **Initial Filtering**
   - Ignores messages from bots
   - Ignores direct messages (DMs)
   - Ignores messages that only mention the bot
3. **Configuration Check**
   - Checks if the guild has any configured channels
   - Verifies the message is from an allowed channel
   - Skips if no configuration or wrong channel
4. **Quota Check**
   - Verifies guild hasn't exceeded monthly query limit
   - Sends quota exceeded message if limit reached
5. **Queue Processing**
   - Adds message to processing queue (max 5 concurrent)
   - Prevents rate limit issues with Discord and future AI APIs
6. **Message Processing**
   - Currently sends placeholder response
   - Future: Will query knowledge base and generate AI response
7. **Response Sent**
   - Replies to the original message
   - Increments usage counter

### Data Storage

The bot uses Firebase Firestore with two collections:

#### `guild_configs`
Stores guild configuration settings.

**Document ID:** `{guildId}`

**Fields:**
- `allowedChannels` (array): List of channel IDs where bot responds
- `ownerContact` (string, optional): Owner contact information
- `createdAt` (timestamp): When configuration was created
- `updatedAt` (timestamp): Last modification time

#### `usage_records`
Tracks monthly usage per guild.

**Document ID:** `{guildId}_{YYYY-MM}`

**Fields:**
- `guildId` (string): Discord guild ID
- `month` (string): Format "YYYY-MM"
- `count` (number): Number of queries processed this month
- `limit` (number): Maximum allowed queries (default: 1000)
- `createdAt` (timestamp): When record was created
- `updatedAt` (timestamp): Last modification time

### Logging

The bot includes comprehensive logging with prefixes to identify the source:

- `[Bot]` - Main bot events (startup, shutdown, message handling)
- `[ConfigService]` - Configuration operations
- `[UsageService]` - Quota and usage tracking
- `[MessageProcessor]` - Message queue and processing
- `[CommandHandler]` - Slash command handling
- `[Firebase]` - Firebase initialization and errors
- `[Deploy]` - Command deployment script

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_TOKEN` | Yes | Bot token from Discord Developer Portal |
| `DISCORD_CLIENT_ID` | Yes | Application ID from Discord Developer Portal |
| `DISCORD_GUILD_ID` | No | Guild ID for faster command deployment (testing) |
| `FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Yes | Service account email |
| `FIREBASE_PRIVATE_KEY` | Yes | Service account private key (with \n chars) |
| `NODE_ENV` | No | Environment (development/production) |

## Common Tasks

### Deploy Commands to a Test Server

1. Get your server (guild) ID:
   - Enable Developer Mode in Discord (User Settings > Advanced > Developer Mode)
   - Right-click your server icon
   - Click "Copy Server ID"

2. Add to `.env`:
   ```env
   DISCORD_GUILD_ID=your_server_id_here
   ```

3. Deploy:
   ```bash
   npm run discord:deploy
   ```

Commands appear instantly (vs up to 1 hour for global deployment).

### Deploy Commands Globally

1. Remove or comment out `DISCORD_GUILD_ID` from `.env`

2. Deploy:
   ```bash
   npm run discord:deploy
   ```

Commands will be available in all servers but may take up to 1 hour to propagate.

### Check Logs

The bot outputs detailed logs to the console. Monitor for:

- Startup confirmation: `[Bot] Ready! Logged in as...`
- Message processing: `[Bot] Processing message...`
- Quota warnings: `[UsageService] Quota exceeded...`
- Configuration changes: `[ConfigService] Added channel...`

### Reset Guild Configuration

To completely reset a guild's configuration, delete the document from Firestore:

1. Open Firebase Console
2. Navigate to Firestore Database
3. Open `guild_configs` collection
4. Find and delete document with ID matching your guild ID

### Check Usage Stats

Currently, usage stats can be viewed in Firestore:

1. Open Firebase Console
2. Navigate to Firestore Database
3. Open `usage_records` collection
4. Find document: `{guildId}_{YYYY-MM}`

Future versions will include a command to view stats directly in Discord.

## Security Best Practices

1. **Never commit `.env` file** - Already in `.gitignore`
2. **Keep bot token secret** - Regenerate if exposed
3. **Use service account with minimal permissions** - Only Firestore access needed
4. **Enable Firestore security rules** - Restrict access to authenticated requests only
5. **Regular security updates** - Run `npm audit` and update dependencies

## Deployment

### Heroku

1. Create new Heroku app
2. Add buildpack: `heroku/nodejs`
3. Set environment variables in Heroku dashboard
4. Deploy:
   ```bash
   git push heroku main
   ```

### Railway

1. Create new project
2. Connect GitHub repository
3. Add environment variables
4. Deploy automatically on push

### Docker (Coming Soon)

A Dockerfile will be provided for containerized deployment.

## Troubleshooting

See main README for detailed troubleshooting steps.

### Quick Checks

1. Bot online? Check Discord server
2. Commands registered? Run `/config list-channels`
3. Channel configured? Use `/config add-channel`
4. Check logs for errors
5. Verify environment variables are set correctly

## Next Steps

- Implement knowledge base integration (Gemini/OpenAI)
- Add vector database for document embeddings
- Build web dashboard for document management
- Implement analytics and reporting
- Add more slash commands (/ask, /stats, etc.)
