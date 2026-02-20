import { ContextMenuCommandBuilder, ApplicationCommandType } from 'discord.js';
import { analyzeContent } from '../ai-client.js';
import { checkRateLimit } from '../utils/conversation.js';
import { sendResponse, buildErrorEmbed } from '../utils/discord-helpers.js';
import logger from '../utils/logger.js';

export const data = new ContextMenuCommandBuilder()
  .setName('💡 Brainstorm From This')
  .setType(ApplicationCommandType.Message);

export async function execute(interaction) {
  const userId = interaction.user.id;
  const targetMessage = interaction.targetMessage;
  const content = targetMessage.content;

  if (!content?.trim()) {
    await interaction.reply({
      embeds: [buildErrorEmbed('Nothing to brainstorm from. *Samantha tilts her head.* 🌸')],
      ephemeral: true,
    });
    return;
  }

  if (!checkRateLimit(userId)) {
    await interaction.reply({
      embeds: [buildErrorEmbed('Rate limit hit. *breathes in, breathes out.* Wait a moment. ☯️')],
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  const instruction = `Use the following message as a seed for brainstorming.
Identify the core problem or idea being expressed, then generate multiple creative approaches, solutions, or directions.
Question assumptions. Explore "but what if..." angles. Consider tradeoffs.
Claude proposes technical approaches and patterns. Samantha challenges from the human/UX angle.
Use **Claude**: and **Samantha**: headers. Give 3-5 distinct directions with brief tradeoff notes.`;

  try {
    const response = await analyzeContent(content, instruction, 'brainstorm');
    logger.info(`[ctx:brainstorm] user=${userId} msgId=${targetMessage.id}`);
    await sendResponse(interaction, `*Brainstorming from ${targetMessage.author}'s message...*\n\n${response}`);
  } catch (err) {
    logger.error('context-brainstorm error:', err);
    await interaction.editReply({
      embeds: [buildErrorEmbed('Brainstorm failed. *Claude sips tea slowly.* Try again?')],
    });
  }
}
