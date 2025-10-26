import {
  Client,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} from 'discord.js';
import { moderationService } from '../services/moderationService';
import { spamDetectionService } from '../services/spamDetectionService';
import { trendService } from '../services/trendService';
import { usageService } from '../services/usageService';
import { firestoreService } from '../services/firestoreService';
import DailyReportJob from '../jobs/dailyReportJob';

export class AdminCommands {
  private client: Client;
  private dailyReportJob: DailyReportJob;

  constructor(client: Client, dailyReportJob: DailyReportJob) {
    this.client = client;
    this.dailyReportJob = dailyReportJob;
  }

  getCommands() {
    return [
      new SlashCommandBuilder()
        .setName('moderation-history')
        .setDescription('View recent moderation actions')
        .addIntegerOption((option) =>
          option
            .setName('limit')
            .setDescription('Number of records to retrieve (default: 10)')
            .setMinValue(1)
            .setMaxValue(50)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

      new SlashCommandBuilder()
        .setName('add-spam-pattern')
        .setDescription('Add a custom spam detection pattern')
        .addStringOption((option) =>
          option
            .setName('pattern')
            .setDescription('Regex pattern to match spam (e.g., "badword|anotherbad")')
            .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

      new SlashCommandBuilder()
        .setName('remove-spam-pattern')
        .setDescription('Remove a custom spam detection pattern')
        .addStringOption((option) =>
          option
            .setName('pattern')
            .setDescription('Pattern to remove')
            .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

      new SlashCommandBuilder()
        .setName('list-spam-patterns')
        .setDescription('List all custom spam detection patterns')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

      new SlashCommandBuilder()
        .setName('trends')
        .setDescription('View analytics trends for the server')
        .addIntegerOption((option) =>
          option
            .setName('days')
            .setDescription('Number of days to analyze (default: 1)')
            .setMinValue(1)
            .setMaxValue(30)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

      new SlashCommandBuilder()
        .setName('usage-stats')
        .setDescription('View usage statistics for the server')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

      new SlashCommandBuilder()
        .setName('force-daily-report')
        .setDescription('Force trigger the daily analytics report')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

      new SlashCommandBuilder()
        .setName('toggle-spam-deletion')
        .setDescription('Toggle spam message deletion on/off')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    ];
  }

  async handleCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guildId) {
      await interaction.reply({
        content: 'This command can only be used in a server.',
        ephemeral: true,
      });
      return;
    }

    try {
      switch (interaction.commandName) {
        case 'moderation-history':
          await this.handleModerationHistory(interaction);
          break;
        case 'add-spam-pattern':
          await this.handleAddSpamPattern(interaction);
          break;
        case 'remove-spam-pattern':
          await this.handleRemoveSpamPattern(interaction);
          break;
        case 'list-spam-patterns':
          await this.handleListSpamPatterns(interaction);
          break;
        case 'trends':
          await this.handleTrends(interaction);
          break;
        case 'usage-stats':
          await this.handleUsageStats(interaction);
          break;
        case 'force-daily-report':
          await this.handleForceDailyReport(interaction);
          break;
        case 'toggle-spam-deletion':
          await this.handleToggleSpamDeletion(interaction);
          break;
        default:
          await interaction.reply({
            content: 'Unknown command.',
            ephemeral: true,
          });
      }
    } catch (error) {
      console.error('Error handling command:', error);
      await interaction.reply({
        content: 'An error occurred while processing the command.',
        ephemeral: true,
      });
    }
  }

  private async handleModerationHistory(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    const limit = interaction.options.getInteger('limit') || 10;
    const logs = await moderationService.getModerationHistory(
      interaction.guildId!,
      limit
    );

    if (logs.length === 0) {
      await interaction.editReply('No moderation actions found.');
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('📋 Moderation History')
      .setColor(0x0099ff)
      .setDescription(`Last ${logs.length} moderation actions`)
      .setTimestamp();

    logs.slice(0, 10).forEach((log, index) => {
      embed.addFields({
        name: `${index + 1}. ${log.action} - ${log.username}`,
        value: [
          `**Reason:** ${log.reason}`,
          `**Channel:** <#${log.channelId}>`,
          `**Time:** ${log.timestamp.toLocaleString()}`,
        ].join('\n'),
        inline: false,
      });
    });

    await interaction.editReply({ embeds: [embed] });
  }

  private async handleAddSpamPattern(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    const pattern = interaction.options.getString('pattern', true);

    try {
      new RegExp(pattern);
    } catch (error) {
      await interaction.reply({
        content: 'Invalid regex pattern.',
        ephemeral: true,
      });
      return;
    }

    await spamDetectionService.addCustomPattern(interaction.guildId!, pattern);

    await interaction.reply({
      content: `Spam pattern added: \`${pattern}\``,
      ephemeral: true,
    });
  }

  private async handleRemoveSpamPattern(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    const pattern = interaction.options.getString('pattern', true);

    await spamDetectionService.removeCustomPattern(interaction.guildId!, pattern);

    await interaction.reply({
      content: `Spam pattern removed: \`${pattern}\``,
      ephemeral: true,
    });
  }

  private async handleListSpamPatterns(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    const patterns = await spamDetectionService.listCustomPatterns(
      interaction.guildId!
    );

    if (patterns.length === 0) {
      await interaction.reply({
        content: 'No custom spam patterns configured.',
        ephemeral: true,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('🛡️ Custom Spam Patterns')
      .setColor(0x0099ff)
      .setDescription(patterns.map((p, i) => `${i + 1}. \`${p}\``).join('\n'));

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  private async handleTrends(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    const days = interaction.options.getInteger('days') || 1;
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const summary = await trendService.generateTrendSummary(
      interaction.guildId!,
      startDate,
      endDate
    );

    const embed = new EmbedBuilder()
      .setTitle('📊 Analytics Trends')
      .setDescription(`Trends for the last ${days} day(s)`)
      .setColor(0x00ff00)
      .addFields(
        {
          name: '📈 Overview',
          value: [
            `Total Messages: ${summary.totalMessages}`,
            `Spam Detected: ${summary.spamCount}`,
            `Avg Response Time: ${summary.averageResponseTime.toFixed(2)}ms`,
          ].join('\n'),
          inline: false,
        },
        {
          name: '🔥 Top Questions',
          value:
            summary.topQuestions.length > 0
              ? summary.topQuestions
                  .slice(0, 5)
                  .map((q, i) => `${i + 1}. ${q.question} (${q.count}x)`)
                  .join('\n')
              : 'No questions recorded',
          inline: false,
        },
        {
          name: '🔑 Top Keywords',
          value:
            summary.topKeywords.length > 0
              ? summary.topKeywords
                  .slice(0, 5)
                  .map((k, i) => `${i + 1}. ${k.keyword} (${k.count}x)`)
                  .join('\n')
              : 'No keywords recorded',
          inline: false,
        }
      )
      .setTimestamp();

    if (summary.unansweredQueries.length > 0) {
      embed.addFields({
        name: '❓ Recent Unanswered Queries',
        value: summary.unansweredQueries
          .slice(0, 3)
          .map((q) => `• ${q.question}`)
          .join('\n'),
        inline: false,
      });
    }

    await interaction.editReply({ embeds: [embed] });
  }

  private async handleUsageStats(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    const metrics = await usageService.getUsageMetrics(interaction.guildId!);

    if (!metrics) {
      await interaction.editReply('No usage statistics available for today.');
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('📊 Usage Statistics')
      .setDescription(`Statistics for ${metrics.period}`)
      .setColor(0x0099ff)
      .addFields(
        {
          name: 'Total Messages',
          value: metrics.totalMessages.toString(),
          inline: true,
        },
        {
          name: 'Spam Messages',
          value: metrics.spamMessages.toString(),
          inline: true,
        },
        {
          name: 'Legitimate Messages',
          value: metrics.legitimateMessages.toString(),
          inline: true,
        },
        {
          name: 'Questions Answered',
          value: metrics.questionsAnswered.toString(),
          inline: true,
        },
        {
          name: 'Unanswered Queries',
          value: metrics.unansweredQueries.toString(),
          inline: true,
        }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }

  private async handleForceDailyReport(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    await this.dailyReportJob.forceTrigger();

    await interaction.editReply('Daily report generation triggered successfully.');
  }

  private async handleToggleSpamDeletion(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    const guildConfig = await firestoreService.getGuildConfig(interaction.guildId!);
    const newValue = !guildConfig.optOutSpamDeletion;

    await firestoreService.updateGuildConfig(interaction.guildId!, {
      optOutSpamDeletion: newValue,
    });

    await interaction.reply({
      content: `Spam deletion is now ${newValue ? 'disabled' : 'enabled'}.`,
      ephemeral: true,
    });
  }
}
