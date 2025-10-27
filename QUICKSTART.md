# Quick Start Guide

Get the Discord QA Bot running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Discord account
- Firebase account (free tier)

## Step 1: Install Dependencies (1 min)

```bash
npm install
```

## Step 2: Set Up Discord Bot (2 min)

1. Go to https://discord.com/developers/applications
2. Click "New Application"
3. Go to "Bot" tab → Click "Add Bot"
4. Enable "MESSAGE CONTENT INTENT" under Privileged Gateway Intents
5. Click "Reset Token" → Copy the token
6. Go to "OAuth2" → "General" → Copy Application ID

## Step 3: Set Up Firebase (2 min)

1. Go to https://console.firebase.google.com/
2. Create new project
3. Click "Firestore Database" → "Create database" → Start in test mode
4. Go to Project Settings → Service Accounts
5. Click "Generate new private key" → Download JSON

## Step 4: Configure Environment (1 min)

```bash
cp .env.example .env
```

Edit `.env`:
```env
DISCORD_TOKEN=paste_your_bot_token_here
DISCORD_CLIENT_ID=paste_your_application_id_here
FIREBASE_PROJECT_ID=from_json_file
FIREBASE_CLIENT_EMAIL=from_json_file
FIREBASE_PRIVATE_KEY="paste_from_json_file_including_quotes"
```

**Tip:** For the private key, copy the entire value including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` with the `\n` characters.

## Step 5: Deploy Commands (30 sec)

For instant deployment to test server:
```bash
# Add your test server ID to .env first
DISCORD_GUILD_ID=your_server_id

# Then deploy
npm run build
npm run discord:deploy
```

For global deployment (takes up to 1 hour):
```bash
npm run build
npm run discord:deploy
```

## Step 6: Invite Bot to Server (30 sec)

1. Go to Discord Developer Portal → Your App → OAuth2 → URL Generator
2. Select scopes: `bot`, `applications.commands`
3. Select permissions: Read Messages, Send Messages, Embed Links, Read Message History
4. Copy the generated URL and open in browser
5. Select your server and authorize

## Step 7: Run the Bot! (10 sec)

```bash
npm run dev
```

You should see:
```
[Bot] Starting Discord QA Bot...
[Firebase] Successfully initialized
[Bot] Logging in to Discord...
[Bot] Ready! Logged in as YourBot#1234
```

## Step 8: Test It Out

1. In Discord, run `/config add-channel #your-channel`
2. Send a message in that channel
3. Bot should reply with "Knowledge engine coming soon!"

## Common Issues

**Bot doesn't come online:**
- Check DISCORD_TOKEN is correct
- Verify MESSAGE CONTENT INTENT is enabled

**Commands don't appear:**
- Run `npm run discord:deploy` again
- Wait a few minutes
- Use DISCORD_GUILD_ID for instant deployment

**Firebase errors:**
- Check all three Firebase env vars are set
- Verify Firestore is enabled in Firebase Console

**Bot doesn't respond to messages:**
- Use `/config add-channel #channel-name` first
- Check bot has read/send permissions in channel

## What's Next?

- Configure additional channels: `/config add-channel`
- View configured channels: `/config list-channels`
- Set owner contact: `/config set-owner your@email.com`

## Need Help?

- Read the full [README](README.md)
- Check [ARCHITECTURE.md](ARCHITECTURE.md) for technical details
- See [docs/bot-setup.md](docs/bot-setup.md) for detailed setup

## Development Commands

```bash
# Validate environment
npm run validate

# Build TypeScript
npm run build

# Run in development mode
npm run dev

# Run in production mode
npm run build && npm start

# Deploy slash commands
npm run discord:deploy
```

---

**Total Setup Time**: ~5-7 minutes  
**Difficulty**: Easy  
**Cost**: Free (Firebase & Discord free tiers)
