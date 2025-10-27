import { ChatInputCommandInteraction, ChannelType, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { configService } from '../services/configService';
import { subscriptionService } from '../services/subscriptionService';

export async function handleConfigCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId) {
    await interaction.reply({ content: '❌ This command can only be used in a server.', ephemeral: true });
    return;
  }

  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    await interaction.reply({ 
      content: '❌ You need the "Manage Server" permission to use this command.', 
      ephemeral: true 
    });
    return;
  }

  const subcommand = interaction.options.getSubcommand();

  try {
    switch (subcommand) {
      case 'add-channel':
        await handleAddChannel(interaction);
        break;
      case 'remove-channel':
        await handleRemoveChannel(interaction);
        break;
      case 'list-channels':
        await handleListChannels(interaction);
        break;
      case 'set-owner':
        await handleSetOwner(interaction);
        break;
      default:
        await interaction.reply({ content: '❌ Unknown subcommand.', ephemeral: true });
    }
  } catch (error) {
    console.error('[CommandHandler] Error handling config command:', error);
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ 
        content: '❌ An error occurred while processing your command. Please try again later.', 
        ephemeral: true 
      });
    } else {
      await interaction.reply({ 
        content: '❌ An error occurred while processing your command. Please try again later.', 
        ephemeral: true 
      });
    }
  }
}

async function handleAddChannel(interaction: ChatInputCommandInteraction): Promise<void> {
  const channel = interaction.options.getChannel('channel', true);
  
  if (channel.type !== ChannelType.GuildText) {
    await interaction.reply({ 
      content: '❌ Only text channels can be added to the support channels list.', 
      ephemeral: true 
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    await configService.addAllowedChannel(interaction.guildId!, channel.id);
    await interaction.editReply({ 
      content: `✅ Successfully added <#${channel.id}> to the allowed support channels.` 
    });
  } catch (error) {
    console.error('[CommandHandler] Error adding channel:', error);
    await interaction.editReply({ 
      content: '❌ Failed to add channel. Please try again.' 
    });
  }
}

async function handleRemoveChannel(interaction: ChatInputCommandInteraction): Promise<void> {
  const channel = interaction.options.getChannel('channel', true);

  await interaction.deferReply({ ephemeral: true });

  try {
    await configService.removeAllowedChannel(interaction.guildId!, channel.id);
    await interaction.editReply({ 
      content: `✅ Successfully removed <#${channel.id}> from the allowed support channels.` 
    });
  } catch (error) {
    console.error('[CommandHandler] Error removing channel:', error);
    await interaction.editReply({ 
      content: '❌ Failed to remove channel. Please try again.' 
    });
  }
}

async function handleListChannels(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  try {
    const channels = await configService.listAllowedChannels(interaction.guildId!);
    
    if (channels.length === 0) {
      await interaction.editReply({ 
        content: '📋 No support channels configured yet. Use `/config add-channel` to add one.' 
      });
      return;
    }

    const channelList = channels.map(id => `• <#${id}>`).join('\n');
    await interaction.editReply({ 
      content: `📋 **Configured Support Channels:**\n${channelList}` 
    });
  } catch (error) {
    console.error('[CommandHandler] Error listing channels:', error);
    await interaction.editReply({ 
      content: '❌ Failed to retrieve channel list. Please try again.' 
    });
  }
}

async function handleSetOwner(interaction: ChatInputCommandInteraction): Promise<void> {
  const contact = interaction.options.getString('contact', true);

  await interaction.deferReply({ ephemeral: true });

  try {
    await configService.setOwnerContact(interaction.guildId!, contact);
    await interaction.editReply({ 
      content: `✅ Successfully set owner contact to: ${contact}` 
    });
  } catch (error) {
    console.error('[CommandHandler] Error setting owner contact:', error);
    await interaction.editReply({ 
      content: '❌ Failed to set owner contact. Please try again.' 
    });
  }
}

export async function handleUpgradeCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId) {
    await interaction.reply({ 
      content: '❌ This command can only be used in a server.', 
      ephemeral: true 
    });
    return;
  }

  const tier = await subscriptionService.checkSub(interaction.guildId);
  
  if (tier === 'pro') {
    await interaction.reply({
      content: '✨ **Your server already has Pro tier!**\n\nYou have unlimited message processing and all premium features enabled.',
      ephemeral: true
    });
    return;
  }

  const whopCheckoutUrl = process.env.WHOP_CHECKOUT_URL || 'https://whop.com/discord-qa-bot-pro/';
  const dashboardUrl = process.env.DASHBOARD_URL || 'https://discord-qa-bot.example.com/dashboard';

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('⭐ Upgrade to Pro')
    .setDescription(
      'Unlock unlimited message processing and premium features!\n\n' +
      '**Pro Features:**\n' +
      '• 🚀 Unlimited message processing\n' +
      '• 📊 Daily insights and analytics\n' +
      '• ⚡ Priority support\n' +
      '• 🎯 Advanced features\n\n' +
      '**Only $10/month**'
    )
    .addFields(
      { name: '🛒 Subscribe', value: `[Get Pro on Whop](${whopCheckoutUrl})`, inline: false },
      { name: '🔗 Link Your Subscription', value: `After subscribing, link your server in the [Dashboard](${dashboardUrl})`, inline: false }
    )
    .setFooter({ text: 'Questions? Contact the server owner or visit our support server.' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
