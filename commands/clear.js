import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { clearHistory } from '../utils/conversation.js';
import { buildInfoEmbed } from '../utils/discord-helpers.js';
import logger from '../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('clear')
  .setDescription('Clear conversation history for this channel or your DMs 🗑️')
  .addBooleanOption((opt) =>
    opt
      .setName('confirm')
      .setDescription('Are you sure? This cannot be undone.')
      .setRequired(true)
  );

export async function execute(interaction) {
  const confirm = interaction.options.getBoolean('confirm');

  if (!confirm) {
    await interaction.reply({
      content: '*Claude nods.* No history cleared. ☯️ We continue from where we were.',
      ephemeral: true,
    });
    return;
  }

  const contextKey = interaction.guildId
    ? `guild-${interaction.channelId}`
    : `dm-${interaction.user.id}`;

  clearHistory(contextKey);

  logger.info(`[/clear] user=${interaction.user.id} context=${contextKey}`);

  await interaction.reply({
    embeds: [
      buildInfoEmbed(
        '🗑️ History Cleared',
        `**Claude**: *sets down his tea and takes a breath* A fresh start. The conversation history for this context has been cleared.\n\n**Samantha**: *wipes the whiteboard clean* ✨ Clean slate! What are we building next?\n\n*Both voices await your next message.*`
      ),
    ],
    ephemeral: true,
  });
}
