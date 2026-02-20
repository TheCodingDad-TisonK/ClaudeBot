import { ContextMenuCommandBuilder, ApplicationCommandType } from 'discord.js';
import { analyzeContent } from '../ai-client.js';
import { checkRateLimit } from '../utils/conversation.js';
import { sendResponse, buildErrorEmbed } from '../utils/discord-helpers.js';
import logger from '../utils/logger.js';

export const data = new ContextMenuCommandBuilder()
  .setName('🐛 Debug This Code')
  .setType(ApplicationCommandType.Message);

export async function execute(interaction) {
  const userId = interaction.user.id;
  const targetMessage = interaction.targetMessage;
  const content = targetMessage.content;

  if (!content?.trim()) {
    await interaction.reply({
      embeds: [buildErrorEmbed('No content found to debug. *Claude squints.* 🔍')],
      ephemeral: true,
    });
    return;
  }

  if (!checkRateLimit(userId)) {
    await interaction.reply({
      embeds: [buildErrorEmbed('Rate limit hit. *sips tea patiently.* One moment. 🌸')],
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  const instruction = `Debug the following code or technical content from a Discord message.
Identify: bugs, logical errors, edge cases that will bite, undefined behavior, missing error handling, and anything that will fail unexpectedly.
Claude handles root cause analysis and technical depth.
Samantha flags the edge cases that seem fine but will explode in production, and considers what a real user would experience.
Provide: identified issues → root causes → fixed version → explanation.
Use **Claude**: and **Samantha**: headers.`;

  try {
    const response = await analyzeContent(content, instruction, 'review');
    logger.info(`[ctx:debug] user=${userId} msgId=${targetMessage.id}`);
    await sendResponse(interaction, `*Debugging code from ${targetMessage.author}...*\n\n${response}`);
  } catch (err) {
    logger.error('context-debug error:', err);
    await interaction.editReply({
      embeds: [buildErrorEmbed('Debug analysis failed. *Claude eyes his tea with suspicion.* Try again?')],
    });
  }
}
