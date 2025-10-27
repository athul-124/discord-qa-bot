import { REST } from '@discordjs/rest';
import { Routes } from 'discord.js';
import dotenv from 'dotenv';
import { commands } from '../bot/commands';

dotenv.config();

async function deployCommands(): Promise<void> {
  try {
    const token = process.env.DISCORD_TOKEN;
    const clientId = process.env.DISCORD_CLIENT_ID;

    if (!token) {
      throw new Error('DISCORD_TOKEN is not set in environment variables');
    }

    if (!clientId) {
      throw new Error('DISCORD_CLIENT_ID is not set in environment variables');
    }

    console.log('[Deploy] Starting deployment of application commands...');
    console.log(`[Deploy] Client ID: ${clientId}`);
    console.log(`[Deploy] Commands to deploy: ${commands.length}`);

    const rest = new REST({ version: '10' }).setToken(token);

    const guildId = process.env.DISCORD_GUILD_ID;

    if (guildId) {
      console.log(`[Deploy] Deploying to guild: ${guildId} (faster for testing)`);
      
      const data = await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands }
      ) as any[];

      console.log(`[Deploy] Successfully deployed ${data.length} guild command(s)!`);
      data.forEach((cmd: any) => {
        console.log(`  - /${cmd.name}`);
      });
    } else {
      console.log('[Deploy] Deploying globally (may take up to 1 hour to propagate)');
      
      const data = await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands }
      ) as any[];

      console.log(`[Deploy] Successfully deployed ${data.length} global command(s)!`);
      data.forEach((cmd: any) => {
        console.log(`  - /${cmd.name}`);
      });
    }

    console.log('[Deploy] Deployment complete!');
  } catch (error) {
    console.error('[Deploy] Failed to deploy commands:', error);
    process.exit(1);
  }
}

deployCommands();
