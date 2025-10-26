import cron from 'node-cron';
import { Client, EmbedBuilder } from 'discord.js';
import { config } from '../config';
import { firestoreService } from '../services/firestoreService';
import { trendService } from '../services/trendService';

class DailyReportJob {
  private client: Client;
  private cronJob?: cron.ScheduledTask;
  private isRunning = false;

  constructor(client: Client) {
    this.client = client;
  }

  start(): void {
    this.cronJob = cron.schedule(
      config.bot.dailyReportCron,
      async () => {
        await this.runReport();
      },
      {
        scheduled: true,
        timezone: config.bot.dailyReportTimezone,
      }
    );

    console.log(
      `Daily report job scheduled: ${config.bot.dailyReportCron} (${config.bot.dailyReportTimezone})`
    );
  }

  async runReport(): Promise<void> {
    if (this.isRunning) {
      console.log('Daily report already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('Starting daily report generation...');

    try {
      const guildIds = await firestoreService.getAllGuildIds();
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);

      for (const guildId of guildIds) {
        try {
          await this.generateAndSendReport(guildId, startDate, endDate);
          await this.sleep(1000);
        } catch (error) {
          console.error(`Error generating report for guild ${guildId}:`, error);
        }
      }

      console.log('Daily report generation completed');
    } catch (error) {
      console.error('Error running daily report:', error);
    } finally {
      this.isRunning = false;
    }
  }

  private async generateAndSendReport(
    guildId: string,
    startDate: Date,
    endDate: Date
  ): Promise<void> {
    const guild = await this.client.guilds.fetch(guildId);
    if (!guild) {
      console.log(`Guild ${guildId} not found, skipping report`);
      return;
    }

    const summary = await trendService.generateTrendSummary(
      guildId,
      startDate,
      endDate
    );

    const embed = new EmbedBuilder()
      .setTitle('📊 Daily Analytics Report')
      .setDescription(
        `Report for ${guild.name}\nPeriod: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
      )
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
                  .map((k, i) => `${i + 1}. ${k.keyword} (${k.count}x)`)
                  .join('\n')
              : 'No keywords recorded',
          inline: false,
        }
      )
      .setTimestamp()
      .setFooter({ text: 'Discord Q&A Bot Analytics' });

    if (summary.unansweredQueries.length > 0) {
      embed.addFields({
        name: '❓ Unanswered Queries',
        value: summary.unansweredQueries
          .slice(0, 5)
          .map((q) => `• ${q.question}`)
          .join('\n'),
        inline: false,
      });
    }

    try {
      const owner = await guild.fetchOwner();
      await owner.send({ embeds: [embed] });
      console.log(`Daily report sent to owner of guild ${guildId}`);
    } catch (error) {
      console.error(`Failed to send report to owner of guild ${guildId}:`, error);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('Daily report job stopped');
    }
  }

  async forceTrigger(): Promise<void> {
    console.log('Forcing daily report trigger...');
    await this.runReport();
  }
}

export default DailyReportJob;
