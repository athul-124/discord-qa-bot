import { Message, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { ModerationLog } from '../types';
import { firestoreService } from './firestoreService';
import { spamDetectionService } from './spamDetectionService';

class ModerationService {
  async handleSpamMessage(message: Message): Promise<boolean> {
    if (!message.guild) return false;

    const guildConfig = await firestoreService.getGuildConfig(message.guild.id);

    if (guildConfig.optOutSpamDeletion) {
      console.log(`Spam deletion opted out for guild ${message.guild.id}`);
      return false;
    }

    const spamResult = await spamDetectionService.detectSpam(
      message.content,
      message.guild.id
    );

    if (!spamResult.isSpam) {
      return false;
    }

    try {
      const botMember = message.guild.members.me;
      if (!botMember?.permissions.has(PermissionFlagsBits.ManageMessages)) {
        console.error(
          `Bot lacks ManageMessages permission in guild ${message.guild.id}`
        );
        await this.notifyOwnerAboutPermissions(message);
        return false;
      }

      await message.delete();

      const moderationLog: ModerationLog = {
        guildId: message.guild.id,
        userId: message.author.id,
        username: message.author.tag,
        action: 'spam_deletion',
        reason: spamResult.reason || 'Spam detected',
        messageContent: message.content,
        channelId: message.channel.id,
        timestamp: new Date(),
        metadata: {
          matchedPattern: spamResult.matchedPattern || 'Unknown',
        },
      };

      await firestoreService.logModerationAction(moderationLog);

      await this.notifyModerators(message, moderationLog);

      console.log(
        `Deleted spam message from ${message.author.tag} in guild ${message.guild.id}`
      );

      return true;
    } catch (error) {
      console.error('Error handling spam message:', error);
      return false;
    }
  }

  private async notifyModerators(
    message: Message,
    log: ModerationLog
  ): Promise<void> {
    if (!message.guild) return;

    try {
      const guildConfig = await firestoreService.getGuildConfig(message.guild.id);
      const owner = await message.guild.fetchOwner();

      const matchedPattern = log.metadata?.matchedPattern;
      const patternValue = typeof matchedPattern === 'string' ? matchedPattern : 'Unknown';

      const embed = new EmbedBuilder()
        .setTitle('🚨 Spam Message Deleted')
        .setColor(0xff0000)
        .addFields(
          { name: 'User', value: `${log.username} (${log.userId})`, inline: true },
          { name: 'Channel', value: `<#${log.channelId}>`, inline: true },
          { name: 'Reason', value: log.reason, inline: false },
          { name: 'Message Content', value: log.messageContent.substring(0, 1000), inline: false },
          { name: 'Pattern Matched', value: patternValue, inline: false }
        )
        .setTimestamp()
        .setFooter({ text: 'Moderation Analytics' });

      await owner.send({ embeds: [embed] });

      if (guildConfig.notificationChannelId) {
        const notificationChannel = await message.guild.channels.fetch(
          guildConfig.notificationChannelId
        );
        if (notificationChannel?.isTextBased()) {
          await notificationChannel.send({ embeds: [embed] });
        }
      }
    } catch (error) {
      console.error('Error notifying moderators:', error);
    }
  }

  private async notifyOwnerAboutPermissions(message: Message): Promise<void> {
    if (!message.guild) return;

    try {
      const owner = await message.guild.fetchOwner();
      const embed = new EmbedBuilder()
        .setTitle('⚠️ Missing Permissions')
        .setColor(0xffa500)
        .setDescription(
          'The bot requires the `MANAGE_MESSAGES` permission to delete spam messages.'
        )
        .addFields({
          name: 'Guild',
          value: `${message.guild.name} (${message.guild.id})`,
        })
        .setTimestamp();

      await owner.send({ embeds: [embed] });
    } catch (error) {
      console.error('Error notifying owner about permissions:', error);
    }
  }

  async getModerationHistory(
    guildId: string,
    limit: number = 50
  ): Promise<ModerationLog[]> {
    return await firestoreService.getModerationLogs(guildId, limit);
  }
}

export const moderationService = new ModerationService();
