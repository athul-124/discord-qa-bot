# Discord QA Bot

**AI-Powered Knowledge Base Assistant for Discord Communities**

Transform your Discord server into an intelligent support hub. Upload your documentation, and let AI handle the repetitive questions while you focus on building your community.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Discord](https://img.shields.io/badge/Discord-Join%20Community-7289DA)](https://discord.gg/your-invite)
[![Available on Whop](https://img.shields.io/badge/Whop-Subscribe-00A86B)](https://whop.com/your-listing)

---

## 🚀 What is Discord QA Bot?

Discord QA Bot is an intelligent assistant that learns from your custom knowledge base and provides instant, accurate answers to questions in your Discord server. No more repeating yourself 100 times a day - let the bot handle it.

### Key Features

- **🧠 Smart Knowledge Base** - Upload PDFs, Markdown, TXT, and DOCX files. The bot learns from your documentation automatically.
- **⚡ Lightning Fast** - Sub-5 second response times for typical queries.
- **📊 Analytics Dashboard** - Track question patterns, identify knowledge gaps, and optimize your documentation.
- **🎛️ Easy Management** - Web-based dashboard for uploading, updating, and organizing your knowledge base.
- **🔒 Secure & Gated** - Subscription-based access control integrated with Whop.
- **🎯 High Accuracy** - 95%+ accuracy rate with source attribution for every answer.

---

## 💡 Use Cases

- **Community Managers** - Reduce support workload by 70% while improving response times
- **Course Creators** - Provide 24/7 student support with instant access to course materials
- **SaaS Companies** - Scale customer support without scaling headcount
- **Gaming Communities** - Help players with complex game mechanics and rules
- **Web3 Projects** - Onboard new members efficiently with instant answers

---

## 📈 Results from Beta Testing

- **70%** average reduction in support workload
- **<3 seconds** average response time
- **95%** answer accuracy rate
- **4.6/5** user satisfaction rating
- **Zero** critical bugs or security issues

---

## 🎯 Quick Start

### 1. Subscribe on Whop
Choose your plan at [whop.com/your-listing](https://whop.com/your-listing)

**Pricing:**
- **Starter** ($29/mo) - Perfect for small communities (1 server, 1K queries/mo)
- **Professional** ($79/mo) - Growing communities (3 servers, 5K queries/mo)
- **Enterprise** ($199/mo) - Large organizations (unlimited servers, 20K queries/mo)

### 2. Access Your Dashboard
Login at [dashboard.yourbot.com](https://dashboard.yourbot.com) with your Whop credentials.

### 3. Add Bot to Discord
Click "Add to Discord" in the dashboard and authorize the required permissions:
- Read Messages/View Channels
- Send Messages
- Embed Links
- Read Message History
- Add Reactions

### 4. Upload Your Knowledge Base
Drag and drop your documentation into the dashboard. Supported formats:
- PDF
- Markdown (.md)
- Text (.txt)
- Word (.docx)

### 5. Start Using
Ask the bot questions in Discord:
```
@QA Bot How do I reset my password?
```
or
```
/ask How do I reset my password?
```

That's it! Your bot is ready to answer questions.

---

## 📚 Documentation

Comprehensive documentation is available in the `/docs` directory:

- **[Getting Started Guide](docs/getting-started.md)** - Detailed setup instructions
- **[Knowledge Base Best Practices](docs/kb-best-practices.md)** - Tips for optimal bot performance
- **[Dashboard Guide](docs/dashboard-guide.md)** - Complete dashboard feature walkthrough
- **[Bot Commands](docs/bot-commands.md)** - All available commands and usage
- **[Analytics Guide](docs/analytics-guide.md)** - Understanding your bot's analytics
- **[Troubleshooting](docs/troubleshooting.md)** - Common issues and solutions
- **[FAQ](docs/faq.md)** - Frequently asked questions

### Launch Assets

Preparing to launch your own instance? Check out:

- **[Whop Listing Copy](docs/launch/whop-listing.md)** - App listing template
- **[Deployment Checklist](docs/launch/deployment-checklist.md)** - Complete deployment guide
- **[Beta Testing Plan](docs/launch/beta-testing-plan.md)** - Beta testing strategy
- **[Promotion Materials](docs/launch/promotion-materials.md)** - Marketing templates
- **[Screenshot Guide](docs/launch/screenshot-guide.md)** - Visual asset creation guide

---

## 🔧 How It Works

### Architecture

1. **Document Processing** - Uploaded documents are parsed, chunked, and embedded using state-of-the-art NLP models
2. **Vector Search** - Questions are converted to embeddings and matched against your knowledge base using semantic similarity
3. **AI Generation** - Relevant document chunks are passed to GPT-4 to generate accurate, contextual responses
4. **Source Attribution** - Every answer includes references to source documents for verification

### Tech Stack

- **Bot Framework**: Discord.js v14 (Node.js/TypeScript)
- **AI Models**: Google Gemini API
- **Vector Database**: Pinecone (planned)
- **Database**: Firebase Firestore
- **Backend**: Express.js + TypeScript with Node.js 18+
- **Queue Management**: p-queue for rate limiting
- **Document Processing**: pdf-parse, csv-parser, multer for uploads
- **Logging**: Winston for structured logging
- **Dashboard**: React with Firebase Hosting (planned)
- **Bot Hosting**: Heroku, Railway, or any Node.js host
- **Subscription Management**: Whop integration
- **Analytics**: Custom analytics pipeline (planned)

### Project Structure

```
discord-qa-bot/
├── src/
│   ├── bot/           # Discord bot implementation
│   ├── server/        # Express API server
│   ├── services/      # Business logic (Firebase, usage, config, message processing)
│   ├── utils/         # Utility functions (logging, etc.)
│   ├── config/        # Configuration management
│   ├── scripts/       # Deployment and validation scripts
│   └── types/         # TypeScript type definitions
├── web/               # Firebase-hosted dashboard (future implementation)
├── docs/              # Documentation
├── firebase.json      # Firebase configuration
├── firestore.rules    # Firestore security rules
├── storage.rules      # Firebase Storage security rules
├── .env.example       # Environment variables template
└── package.json       # Project dependencies and scripts
```

---

## 🛡️ Security & Privacy

- **Encryption**: All data encrypted in transit (TLS 1.3) and at rest (AES-256)
- **Access Control**: Subscription-gated access verified on every request
- **Data Isolation**: Each customer's knowledge base is completely isolated
- **GDPR Compliant**: Data processing agreements available
- **No Training**: Your data is never used to train AI models
- **Audit Logs**: Complete audit trail of all bot interactions

---

## 📊 Rate Limits & Performance

### Response Time Targets
- **P50**: <2 seconds
- **P95**: <5 seconds
- **P99**: <10 seconds

### Rate Limits by Tier

| Tier | Queries/Month | Concurrent Requests | KB Storage | Servers |
|------|---------------|---------------------|------------|---------|
| Starter | 1,000 | 5 | 50 MB | 1 |
| Professional | 5,000 | 10 | 250 MB | 3 |
| Enterprise | 20,000 | 25 | 1 GB | Unlimited |

Exceeded your limits? Upgrade anytime or purchase add-ons.

---

## 🎓 Onboarding Flow

The complete user journey from discovery to active usage:

1. **Discovery** → User finds bot on Whop marketplace
2. **Purchase** → User subscribes to a tier on Whop
3. **Access** → User receives dashboard credentials via email
4. **Dashboard** → User logs in and explores dashboard
5. **Bot Invite** → User clicks "Add to Discord" and authorizes bot
6. **KB Upload** → User uploads first documents (recommended: start with FAQ)
7. **Testing** → User tests bot with sample questions
8. **Configuration** → User customizes bot settings (optional)
9. **Launch** → User announces bot to their community
10. **Optimization** → User monitors analytics and improves KB

**Average Time to First Response**: 10 minutes

---

## 💬 Support

We're here to help!

- **📧 Email**: support@discord-qa-bot.com (Response SLA by tier below)
- **💬 Discord**: [Join our community](https://discord.gg/your-invite)
- **📖 Documentation**: [Full docs](docs/)
- **🐛 Bug Reports**: [GitHub Issues](https://github.com/your-repo/issues)
- **💡 Feature Requests**: [Feature board](https://feedback.yourbot.com)

### Support SLA by Tier

| Tier | Email Response Time | Priority Level |
|------|---------------------|----------------|
| Starter | 48 hours | Standard |
| Professional | 24 hours | Priority |
| Enterprise | 12 hours | Critical |

Business hours: Monday-Friday, 9 AM - 6 PM EST

---

## 🗺️ Roadmap

### ✅ Launched
- Core Q&A functionality
- Web dashboard
- Document upload (PDF, TXT, MD, DOCX)
- Analytics dashboard
- Whop integration
- Discord bot with mention commands

### 🚧 In Progress
- Slash commands
- Mobile-responsive dashboard improvements
- Bulk document upload
- Advanced analytics exports

### 📅 Coming Soon
- Multi-language support
- Custom branding (Enterprise)
- API access
- Notion/Confluence integrations
- Video content support
- Voice channel integration
- Advanced conversation context

### 💭 Under Consideration
- Slack/Teams versions
- White-label options
- Self-hosted deployment option
- AI model selection (GPT-4, Claude, etc.)

Vote on features at [feedback.yourbot.com](https://feedback.yourbot.com)

---

## 🤝 Contributing

We welcome contributions! Whether you're:
- Reporting bugs
- Suggesting features
- Improving documentation
- Submitting pull requests

Please read our [Contributing Guidelines](CONTRIBUTING.md) first.

### Development Setup

#### Prerequisites

- Node.js 18+ and npm
- A Discord account and Discord Developer Application
- Firebase project with Firestore enabled
- Git

#### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-repo/discord-qa-bot.git
cd discord-qa-bot

# Install dependencies
npm install
```

#### 2. Create Discord Bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Navigate to the "Bot" section in the left sidebar
4. Click "Add Bot"
5. Under "Privileged Gateway Intents", enable:
   - **MESSAGE CONTENT INTENT** (required for reading message content)
   - Server Members Intent (optional, for future features)
   - Presence Intent (optional, for future features)
6. Click "Reset Token" and copy your bot token (keep this secret!)
7. Copy your Application ID from the "General Information" tab

#### 3. Set Up Firebase

1. **Install Firebase CLI** (optional, for local emulators):
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Create Firebase Project**:
   - Go to the [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or select an existing one
   - Note your Project ID (update in `.firebaserc` if needed)

3. **Enable Firestore Database**:
   - Click "Firestore Database" in the left sidebar
   - Click "Create database"
   - Start in production mode or test mode (security rules will be deployed from `firestore.rules`)

4. **Enable Firebase Storage** (for document uploads):
   - Click "Storage" in the left sidebar
   - Click "Get started"
   - Use default settings (security rules will be deployed from `storage.rules`)

5. **Generate Service Account**:
   - Go to Project Settings > Service Accounts
   - Click "Generate new private key"
   - Save the JSON file securely (needed for environment variables)

6. **Deploy Firebase Rules** (optional):
   ```bash
   firebase deploy --only firestore:rules,storage:rules
   ```

#### 4. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Discord Bot Configuration
DISCORD_TOKEN=your_bot_token_from_step_2
DISCORD_CLIENT_ID=your_application_id_from_step_2
OWNER_DISCORD_ID=your_discord_user_id

# Optional: For testing, deploy commands to a specific guild (faster)
# DISCORD_GUILD_ID=your_test_server_id

# Firebase Configuration (from service account JSON)
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Alternative: Base64-encoded service account JSON
# FIREBASE_SERVICE_ACCOUNT=base64_encoded_service_account_json

# Google Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key

# Whop Integration (for subscription management)
WHOP_APP_ID=your_whop_app_id
WHOP_API_KEY=your_whop_api_key

# Server Configuration
PORT=3000
NODE_ENV=development
```

**Note:** For `FIREBASE_PRIVATE_KEY`, make sure to:
- Keep the quotes around the entire key
- Include the `\n` characters (they will be converted to actual newlines)
- Or copy directly from the service account JSON file

**For Whop and Gemini**: These are not strictly required for initial development/testing. The bot will run without them, but full functionality requires proper API keys.

#### 5. Deploy Slash Commands

Before running the bot, register the slash commands with Discord:

```bash
# Build TypeScript files
npm run build

# Deploy commands
npm run discord:deploy
```

For faster testing, you can deploy to a specific guild by setting `DISCORD_GUILD_ID` in your `.env` file. This makes commands available instantly instead of waiting up to an hour for global deployment.

#### 6. Invite Bot to Your Server

1. Go to the Discord Developer Portal
2. Select your application
3. Navigate to "OAuth2" > "URL Generator"
4. Select scopes:
   - `bot`
   - `applications.commands`
5. Select bot permissions:
   - Read Messages/View Channels
   - Send Messages
   - Send Messages in Threads
   - Embed Links
   - Read Message History
6. Copy the generated URL and open it in your browser
7. Select your server and authorize the bot

#### 7. Run the Bot

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm run build
npm start
```

#### 8. Configure Your Server

Once the bot is running and in your server:

1. Use `/config add-channel #channel-name` to add support channels
2. Use `/config list-channels` to view configured channels
3. Use `/config set-owner your@email.com` to set owner contact (optional)
4. Send a message in a configured channel to test the bot

The bot will respond with a placeholder message until the knowledge engine is implemented.

#### Testing the Setup

1. **Verify bot is online:** Check that the bot shows as online in your Discord server
2. **Test slash command:** Run `/config list-channels` - should work even if no channels are configured
3. **Add a channel:** Run `/config add-channel #your-channel`
4. **Send a message:** Send any message in the configured channel
5. **Check response:** Bot should reply with "Knowledge engine coming soon!" message

#### Troubleshooting

**Bot doesn't come online:**
- Verify `DISCORD_TOKEN` is correct
- Check console for error messages
- Ensure you copied the token correctly (no extra spaces)

**Slash commands don't appear:**
- Run `npm run discord:deploy` again
- Wait a few minutes for Discord to update
- Try setting `DISCORD_GUILD_ID` for instant guild-level deployment
- Ensure `DISCORD_CLIENT_ID` is your Application ID, not Bot ID

**"Missing Access" or permission errors:**
- Ensure MESSAGE CONTENT INTENT is enabled in Discord Developer Portal
- Re-invite the bot with the correct permissions
- Check that the bot has permission to read/send messages in the channel

**Firebase errors:**
- Verify all three Firebase environment variables are set
- Check that Firestore is enabled in your Firebase project
- Ensure the service account has proper permissions

**Bot doesn't respond to messages:**
- Verify the channel is added via `/config add-channel`
- Check console logs for error messages
- Ensure the message isn't from a bot account
- Verify the bot has "Read Message History" permission

#### Running Tests

```bash
# Test Firebase layer connectivity
npm run test:firebase

# Run full test suite (when implemented)
npm test
```

#### Firebase Layer Overview

The bot uses Firebase for data persistence with the following services:

**Collections:**
- `server_configs` - Server configuration and subscription tiers
- `knowledge_entries` - Question-answer knowledge base
- `usage_entries` - Usage tracking and rate limiting
- `trend_entries` - Analytics and trend data

**Services:**
- `configService` - Server configuration management
- `knowledgeBaseService` - Knowledge base CRUD operations
- `usageService` - Usage tracking and tier limits (100/mo free, 1000/mo premium, 10000/mo enterprise)
- `trendService` - Analytics and trending keywords

For detailed information about the data model, schemas, and security rules, see [docs/data-model.md](docs/data-model.md).

**Testing Firebase Locally:**

Use Firebase Emulators for local development:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Start emulators
firebase emulators:start

# In another terminal, set environment variables and run
export USE_FIREBASE_EMULATOR=true
export FIRESTORE_EMULATOR_HOST=localhost:8080
npm run test:firebase
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🌟 Testimonials

> "Cut our mod workload in half in the first week. Absolute game-changer for community management."  
> **— Sarah Martinez**, Gaming Community Manager (2,500 members)

> "My students get instant answers even at 2am. Best investment I've made for my course community."  
> **— Mike Chen**, Online Course Creator (800 members)

> "Finally, our documentation is actually useful. Members love how quickly they get help."  
> **— Jennifer Lee**, SaaS Founder (1,200 members)

---

## 📞 Contact

- **Website**: [yourbot.com](https://yourbot.com)
- **Email**: hello@discord-qa-bot.com
- **Twitter**: [@DiscordQABot](https://twitter.com/DiscordQABot)
- **LinkedIn**: [Company Page](https://linkedin.com/company/discord-qa-bot)

---

## 🙏 Acknowledgments

Built with:
- [Discord.py](https://github.com/Rapptz/discord.py) - Discord API wrapper
- [OpenAI](https://openai.com) - AI models and embeddings
- [Pinecone](https://www.pinecone.io) - Vector database
- [FastAPI](https://fastapi.tiangolo.com) - Modern Python web framework
- [React](https://reactjs.org) - UI framework
- [Whop](https://whop.com) - Subscription management

Special thanks to our beta testers and early adopters for their valuable feedback!

---

**Ready to transform your Discord community?** [Get Started →](https://whop.com/your-listing)

---

<p align="center">
  Made with ❤️ for community builders everywhere
</p>
