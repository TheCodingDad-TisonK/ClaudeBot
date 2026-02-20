import { ContextMenuCommandBuilder, ApplicationCommandType } from 'discord.js';
import { analyzeContent } from '../ai-client.js';
import { checkRateLimit } from '../utils/conversation.js';
import { sendResponse, buildErrorEmbed } from '../utils/discord-helpers.js';
import logger from '../utils/logger.js';

export const data = new ContextMenuCommandBuilder()
  .setName('🔍 Review This Message')
  .setType(ApplicationCommandType.Message);

export async function execute(interaction) {
  const userId = interaction.user.id;
  const targetMessage = interaction.targetMessage;
  const content = targetMessage.content;

  if (!content || content.trim().length === 0) {
    await interaction.reply({
      embeds: [buildErrorEmbed('That message appears to be empty or contains only embeds. *Claude tilts his head.*')],
      ephemeral: true,
    });
    return;
  }

  if (!checkRateLimit(userId)) {
    await interaction.reply({
      embeds: [buildErrorEmbed('Rate limit reached. *sips tea.* Give it a moment. 🌸')],
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  const instruction = `Review the following message/code from a Discord conversation. 
Identify: technical issues, logical problems, unclear writing, edge cases, UX concerns, or anything worth improving.
Claude leads with technical analysis. Samantha catches what Claude misses — especially things that would confuse a reader or user.
Be constructive and specific. Use **Claude**: and **Samantha**: headers.`;

  try {
    const response = await analyzeContent(content, instruction, 'review');
    logger.info(`[ctx:review] user=${userId} msgId=${targetMessage.id}`);
    await sendResponse(interaction, `*Reviewing message from ${targetMessage.author}...*\n\n${response}`);
  } catch (err) {
    logger.error('context-review error:', err);
    await interaction.editReply({
      embeds: [buildErrorEmbed('Review failed. *Claude furrows his brow.* Please try again.')],
    });
  }
}
