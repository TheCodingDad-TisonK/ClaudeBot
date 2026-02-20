import { ContextMenuCommandBuilder, ApplicationCommandType } from 'discord.js';
import { analyzeContent } from '../ai-client.js';
import { checkRateLimit } from '../utils/conversation.js';
import { sendResponse, buildErrorEmbed } from '../utils/discord-helpers.js';
import logger from '../utils/logger.js';

export const data = new ContextMenuCommandBuilder()
  .setName('📖 Explain This')
  .setType(ApplicationCommandType.Message);

export async function execute(interaction) {
  const userId = interaction.user.id;
  const targetMessage = interaction.targetMessage;
  const content = targetMessage.content;

  if (!content?.trim()) {
    await interaction.reply({
      embeds: [buildErrorEmbed('Nothing to explain in that message. *Claude glances quizzically.*')],
      ephemeral: true,
    });
    return;
  }

  if (!checkRateLimit(userId)) {
    await interaction.reply({
      embeds: [buildErrorEmbed('Rate limit hit. *sips chamomile.* One moment. 🌸')],
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  const instruction = `Explain the following message/code from a Discord conversation clearly and helpfully.
If it's code: explain what it does, how it works, and any important nuances.
If it's a concept or text: break it down in accessible terms with examples where helpful.
Claude handles the technical depth; Samantha ensures the explanation is approachable and flags anything that might confuse someone new to the topic.
Use **Claude**: and **Samantha**: headers where the dual-voice adds value.`;

  try {
    const response = await analyzeContent(content, instruction, 'explain');
    logger.info(`[ctx:explain] user=${userId} msgId=${targetMessage.id}`);
    await sendResponse(interaction, `*Explaining message from ${targetMessage.author}...*\n\n${response}`);
  } catch (err) {
    logger.error('context-explain error:', err);
    await interaction.editReply({
      embeds: [buildErrorEmbed('Explanation failed. *Claude breathes deeply.* Try again?')],
    });
  }
}
