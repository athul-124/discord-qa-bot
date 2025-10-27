import { Client, GatewayIntentBits, Events, Message, Partials } from 'discord.js';
import dotenv from 'dotenv';
import { initializeFirebase } from '../services/firebase';
import { configService } from '../services/configService';
import { usageServiceLegacy } from '../services/usageService';
import { messageProcessor } from '../services/messageProcessor';
import { handleConfigCommand } from './commandHandler';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`[Bot] Ready! Logged in as ${readyClient.user.tag}`);
  console.log(`[Bot] Serving ${readyClient.guilds.cache.size} guild(s)`);
  console.log('[Bot] Listening for messages and commands...');
});

client.on(Events.Error, (error) => {
  console.error('[Bot] Client error:', error);
});

client.on(Events.ShardReconnecting, () => {
  console.log('[Bot] Reconnecting to Discord...');
});

client.on(Events.ShardDisconnect, (event) => {
  console.warn('[Bot] Disconnected from Discord:', event.code, event.reason);
});

client.on(Events.ShardResume, () => {
  console.log('[Bot] Resumed connection to Discord');
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  console.log(`[Bot] Received command: /${interaction.commandName} from ${interaction.user.tag}`);

  try {
    if (interaction.commandName === 'config') {
      await handleConfigCommand(interaction);
    }
  } catch (error) {
    console.error('[Bot] Error handling interaction:', error);
    
    const errorMessage = { 
      content: '❌ An error occurred while processing your command.', 
      ephemeral: true 
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
});

client.on(Events.MessageCreate, async (message: Message) => {
  try {
    if (shouldIgnoreMessage(message)) {
      return;
    }

    console.log(`[Bot] Processing message ${message.id} from ${message.author.tag} in guild ${message.guildId}`);

    if (!message.guildId) {
      console.log(`[Bot] Skipped: Message is a DM`);
      return;
    }

    const guildConfig = await configService.getGuildConfig(message.guildId);
    
    if (!guildConfig || guildConfig.allowedChannels.length === 0) {
      console.log(`[Bot] Skipped: No channels configured for guild ${message.guildId}`);
      return;
    }

    if (!guildConfig.allowedChannels.includes(message.channelId)) {
      console.log(`[Bot] Skipped: Channel ${message.channelId} not in allowed list for guild ${message.guildId}`);
      return;
    }

    const quota = await usageServiceLegacy.checkQuota(message.guildId);
    
    if (!quota.allowed) {
      console.log(`[Bot] Quota exceeded for guild ${message.guildId}: ${quota.current}/${quota.limit}`);
      
      try {
        await message.reply(
          `⚠️ **Monthly Query Limit Reached**\n\n` +
          `Your server has used ${quota.current} of ${quota.limit} queries this month.\n` +
          `Please upgrade your plan or wait until next month to continue using the bot.\n\n` +
          `Need help? Contact your server administrator.`
        );
      } catch (error) {
        console.error('[Bot] Failed to send quota exceeded message:', error);
      }
      return;
    }

    console.log(`[Bot] Quota check passed for guild ${message.guildId}: ${quota.current}/${quota.limit}`);

    await messageProcessor.enqueueMessage(message);
    
  } catch (error) {
    console.error('[Bot] Error in messageCreate handler:', error);
  }
});

function shouldIgnoreMessage(message: Message): boolean {
  if (message.author.bot) {
    console.log(`[Bot] Skipped: Message from bot ${message.author.tag}`);
    return true;
  }

  if (!message.guild) {
    console.log(`[Bot] Skipped: DM from ${message.author.tag}`);
    return true;
  }

  const botMention = `<@${client.user?.id}>`;
  const botMentionWithNick = `<@!${client.user?.id}>`;
  const content = message.content.trim();
  
  if (content === botMention || content === botMentionWithNick) {
    console.log(`[Bot] Skipped: Message only mentions bot`);
    return true;
  }

  return false;
}

async function startBot(): Promise<void> {
  try {
    console.log('[Bot] Starting Discord QA Bot...');

    const token = process.env.DISCORD_TOKEN;
    if (!token) {
      throw new Error('DISCORD_TOKEN is not set in environment variables');
    }

    console.log('[Bot] Initializing Firebase...');
    initializeFirebase();

    console.log('[Bot] Logging in to Discord...');
    await client.login(token);

  } catch (error) {
    console.error('[Bot] Failed to start:', error);
    process.exit(1);
  }
}

process.on('unhandledRejection', (error) => {
  console.error('[Bot] Unhandled promise rejection:', error);
});

process.on('SIGINT', async () => {
  console.log('[Bot] Received SIGINT, shutting down gracefully...');
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('[Bot] Received SIGTERM, shutting down gracefully...');
  client.destroy();
  process.exit(0);
});

startBot();
