import { Client, GatewayIntentBits, Events, REST, Routes } from 'discord.js';
import { config } from './config';
import { messageHandler } from './handlers/messageHandler';
import { AdminCommands } from './commands/adminCommands';
import DailyReportJob from './jobs/dailyReportJob';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const dailyReportJob = new DailyReportJob(client);
const adminCommands = new AdminCommands(client, dailyReportJob);

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);

  try {
    await registerCommands();
    console.log('Slash commands registered successfully');
  } catch (error) {
    console.error('Error registering commands:', error);
  }

  dailyReportJob.start();
  console.log('Daily report job started');
});

client.on(Events.MessageCreate, async (message) => {
  await messageHandler.handleMessage(message);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  await adminCommands.handleCommand(interaction);
});

client.on(Events.Error, (error) => {
  console.error('Discord client error:', error);
});

async function registerCommands(): Promise<void> {
  const commands = adminCommands.getCommands().map((command) => command.toJSON());

  const rest = new REST({ version: '10' }).setToken(config.discord.token);

  await rest.put(Routes.applicationCommands(config.discord.clientId), {
    body: commands,
  });
}

async function shutdown(): Promise<void> {
  console.log('Shutting down...');
  dailyReportJob.stop();
  await client.destroy();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

client.login(config.discord.token).catch((error) => {
  console.error('Failed to login:', error);
  process.exit(1);
});
