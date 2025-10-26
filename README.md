# Discord Q&A Bot

A Discord bot with Whop subscription gating that provides Q&A functionality based on custom knowledge bases. Features freemium pricing with free and pro tiers.

## Features

- 🤖 **Discord Bot Integration** - Responds to messages in configured channels
- 💰 **Whop Subscription Gating** - Free and Pro tier support
- 📚 **Knowledge Base** - Custom knowledge base per server
- 📊 **Usage Tracking** - Monitor message usage and limits
- 🔒 **Secure API** - Firebase Auth and Whop token authentication
- ☁️ **Heroku Ready** - Easy deployment with Procfile and app.json

## Pricing Tiers

### Free Tier
- 100 messages per month
- Basic Q&A functionality
- Knowledge base support

### Pro Tier
- Unlimited messages
- Daily trend insights via DM
- Priority support

## Setup

### Prerequisites

- Node.js 18+ and npm 9+
- Discord Bot Token ([Discord Developer Portal](https://discord.com/developers/applications))
- Whop API Key ([Whop Dashboard](https://whop.com/dashboard))
- (Optional) Firebase project for authentication

### Local Development

1. Clone the repository:
```bash
git clone <repository-url>
cd discord-qa-bot
```

2. Install dependencies:
```bash
npm install
```

3. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

4. Edit `.env` with your credentials:
```env
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id
WHOP_API_KEY=your_whop_api_key
WHOP_PRODUCT_ID=your_whop_product_id
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY=your_firebase_private_key
PORT=3000
FREE_TIER_MESSAGE_LIMIT=100
```

5. Build the project:
```bash
npm run build
```

6. Start the application:
```bash
# Run both web server and bot
npm start

# Or run separately:
npm run web    # API server only
npm run worker # Discord bot only
```

## Heroku Deployment

### Quick Deploy

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

### Manual Deployment

1. Create a new Heroku app:
```bash
heroku create your-app-name
```

2. Set environment variables:
```bash
heroku config:set DISCORD_TOKEN=your_token
heroku config:set DISCORD_CLIENT_ID=your_client_id
heroku config:set WHOP_API_KEY=your_api_key
heroku config:set WHOP_PRODUCT_ID=your_product_id
# Add other variables as needed
```

3. Deploy:
```bash
git push heroku main
```

4. Scale dynos:
```bash
heroku ps:scale web=1 worker=1
```

5. View logs:
```bash
heroku logs --tail
```

### Heroku Configuration

The app uses two dyno types:
- **web**: Express API server (PORT is automatically set by Heroku)
- **worker**: Discord bot process

Both can run on Heroku Free tier, but note that free dynos sleep after 30 minutes of inactivity.

## API Endpoints

### Health Check
```
GET /api/health
```
Returns bot status and health information.

### Link Server to Whop Subscription
```
POST /api/link-server
Authorization: Bearer <whop_token_or_firebase_token>
Content-Type: application/json

{
  "whopToken": "user_whop_token",
  "serverId": "discord_server_id"
}
```
Links a Discord server to a Whop subscription. Validates the token and updates server tier.

### Upload Knowledge Base
```
POST /api/upload-kb
Authorization: Bearer <whop_token_or_firebase_token>
Content-Type: application/json

{
  "serverId": "discord_server_id",
  "knowledgeBase": "Your knowledge base content..."
}
```
Updates the knowledge base for a server. Requires authentication.

### Get Usage Statistics
```
GET /api/usage/:serverId
Authorization: Bearer <whop_token_or_firebase_token>
```
Returns message usage statistics for a server.

Response:
```json
{
  "serverId": "123456789",
  "tier": "free",
  "usage": {
    "messageCount": 45,
    "limitReached": false,
    "lastReset": 1234567890000,
    "remaining": 55
  }
}
```

### Get Subscription Status
```
GET /api/subscription/:serverId
Authorization: Bearer <whop_token_or_firebase_token>
```
Returns subscription information for a server.

### Get Server Configuration
```
GET /api/config/:serverId
Authorization: Bearer <whop_token_or_firebase_token>
```
Returns server configuration and settings.

### Update Server Configuration
```
POST /api/config
Authorization: Bearer <whop_token_or_firebase_token>
Content-Type: application/json

{
  "serverId": "discord_server_id",
  "settings": {
    "enabled": true,
    "channelIds": ["channel_id_1", "channel_id_2"]
  }
}
```
Updates server settings like enabled channels.

## Authentication

The API supports two authentication methods:

1. **Firebase Auth**: Use Firebase ID tokens
2. **Whop Tokens**: Use Whop user access tokens

Include tokens in the Authorization header:
```
Authorization: Bearer <your_token>
```

## Bot Usage

1. **Add the bot to your Discord server** using the OAuth2 URL from Discord Developer Portal
2. **Link your subscription** via the dashboard or API
3. **Configure channels** where the bot should respond
4. **Upload a knowledge base** for better Q&A responses
5. **Ask questions** in configured channels

### Free Tier Limits

When a free tier server reaches 100 messages/month:
- Bot stops processing new messages
- Owner receives a DM notification
- Upgrade prompt is displayed

### Pro Tier Benefits

Pro tier servers receive:
- Unlimited message processing
- Daily insight reports via DM to server owner
- No usage restrictions

## Firebase Hosting Integration

For dashboard hosting:

1. Build your dashboard frontend
2. Configure Firebase Hosting:
```bash
firebase init hosting
```

3. Deploy:
```bash
firebase deploy --only hosting
```

4. Set API endpoint in your dashboard to your Heroku app URL

## Data Storage

The bot stores data locally in JSON files:
- `data/configs.json` - Server configurations
- `data/usage.json` - Usage statistics

For production, consider migrating to a database like PostgreSQL or MongoDB.

## Development

### Project Structure
```
src/
├── index.ts              # Main entry point
├── services/
│   ├── whopService.ts    # Whop API client
│   ├── configService.ts  # Server config management
│   ├── usageService.ts   # Usage tracking
│   └── discordService.ts # Discord bot logic
├── middleware/
│   └── auth.ts           # Authentication middleware
└── routes/
    └── index.ts          # API routes
```

### Scripts

- `npm run dev` - Development mode with ts-node
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Run production build
- `npm run web` - Run web server only
- `npm run worker` - Run Discord bot only

## Troubleshooting

### Bot not responding
- Check Discord token is valid
- Verify bot has Message Content Intent enabled in Discord Developer Portal
- Check bot has permissions in the server
- Verify channels are configured in settings

### Authentication errors
- Ensure Firebase credentials are properly formatted
- Check Whop API key is valid
- Verify tokens are not expired

### Heroku deployment issues
- Ensure all required environment variables are set
- Check build logs: `heroku logs --tail`
- Verify Node.js version in engines field matches Heroku

## License

ISC

## Support

For issues or questions, please open an issue on GitHub or contact support.
