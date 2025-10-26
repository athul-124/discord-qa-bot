import * as dotenv from 'dotenv';
import express, { Express } from 'express';
import { discordService } from './services/discordService';
import routes from './routes';

dotenv.config();

const PORT = process.env.PORT || 3000;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

const args = process.argv.slice(2);
const runWorker = args.includes('--worker');
const runWeb = args.includes('--web');
const runBoth = !runWorker && !runWeb;

async function startWebServer(): Promise<void> {
  const app: Express = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    
    next();
  });

  app.use('/api', routes);

  app.get('/', (req, res) => {
    res.json({
      name: 'Discord Q&A Bot API',
      version: '1.0.0',
      status: 'running',
      bot: discordService.isReady() ? 'ready' : 'not ready',
    });
  });

  app.listen(PORT, () => {
    console.log(`🌐 Web server listening on port ${PORT}`);
  });
}

async function startWorker(): Promise<void> {
  if (!DISCORD_TOKEN) {
    console.error('DISCORD_TOKEN is required to start the bot');
    process.exit(1);
  }

  console.log('🤖 Starting Discord bot...');
  await discordService.start(DISCORD_TOKEN);

  setInterval(async () => {
    console.log('📊 Sending daily insights...');
    await discordService.sendDailyInsights();
  }, 24 * 60 * 60 * 1000);

  console.log('✅ Discord bot started successfully');
}

async function main(): Promise<void> {
  console.log('🚀 Starting Discord Q&A Bot');

  if (runBoth || runWeb) {
    await startWebServer();
  }

  if (runBoth || runWorker) {
    await startWorker();
  }

  if (!runBoth && !runWeb && !runWorker) {
    console.log('No mode specified. Use --web, --worker, or run without flags for both.');
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
