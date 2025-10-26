import { Client, GatewayIntentBits } from 'discord.js';
import { Firestore } from '@google-cloud/firestore';
import * as dotenv from 'dotenv';
import { FirestoreKnowledgeSearchService } from './services/firestoreKnowledgeSearch';
import { GeminiService } from './services/geminiService';
import { UsageService } from './services/usageService';
import { ConfigService } from './services/configService';
import { MessageHandler } from './handlers/messageHandler';

dotenv.config();

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const OWNER_USER_ID = process.env.OWNER_USER_ID;

if (!DISCORD_BOT_TOKEN) {
  throw new Error('DISCORD_BOT_TOKEN is required');
}

if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is required');
}

const db = new Firestore({
  projectId: FIREBASE_PROJECT_ID
});

const knowledgeSearch = new FirestoreKnowledgeSearchService(db);
const geminiService = new GeminiService(GEMINI_API_KEY, db, OWNER_USER_ID);
const usageService = new UsageService(db);
const configService = new ConfigService(db);
const messageHandler = new MessageHandler(
  knowledgeSearch,
  geminiService,
  usageService,
  configService,
  OWNER_USER_ID
);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user?.tag}!`);
  console.log('Discord QA Bot is ready to answer questions!');
  
  setInterval(async () => {
    await geminiService.processQueue();
  }, 60000);
});

client.on('messageCreate', async (message) => {
  try {
    await messageHandler.handleMessage(message);
  } catch (error) {
    console.error('Error handling message:', error);
  }
});

client.on('error', (error) => {
  console.error('Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

client.login(DISCORD_BOT_TOKEN);
