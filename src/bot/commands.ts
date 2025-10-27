import { SlashCommandBuilder } from 'discord.js';

export const commands = [
  new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configure bot settings for this server')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add-channel')
        .setDescription('Add a channel to the allowed support channels list')
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('The channel to add')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove-channel')
        .setDescription('Remove a channel from the allowed support channels list')
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('The channel to remove')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list-channels')
        .setDescription('List all configured support channels')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('set-owner')
        .setDescription('Set owner contact information')
        .addStringOption(option =>
          option
            .setName('contact')
            .setDescription('Owner contact (email or Discord username)')
            .setRequired(true)
        )
    )
    .toJSON(),
];
