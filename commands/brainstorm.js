import { SlashCommandBuilder } from 'discord.js';
import { analyzeContent } from '../ai-client.js';
import { appendHistory, getHistory, checkRateLimit } from '../utils/conversation.js';
import { sendResponse, buildErrorEmbed } from '../utils/discord-helpers.js';
import logger from '../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('brainstorm')
  .setDescription('Explore ideas and tradeoffs with Claude & Samantha 💡')
  .addStringOption((opt) =>
    opt
      .setName('topic')
      .setDescription('What are you trying to solve or explore?')
      .setRequired(true)
  )
  .addStringOption((opt) =>
    opt
      .setName('constraints')
      .setDescription('Any constraints or context to keep in mind?')
      .setRequired(false)
  );

export async function execute(interaction) {
  const userId = interaction.user.id;
  const topic = interaction.options.getString('topic');
  const constraints = interaction.options.getString('constraints') || '';

  if (!checkRateLimit(userId)) {
    await interaction.reply({
      embeds: [buildErrorEmbed('Rate limit reached. *sips tea patiently.* 🌸')],
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  const instruction = [
    `Let's brainstorm the following${constraints ? ` (constraints: ${constraints})` : ''}.`,
    'Generate ideas freely. Question assumptions with "but what if...". Explore tradeoffs. Think out loud.',
    'Claude proposes architecture and patterns. Samantha challenges from the human/UX angle and catches what Claude might not.',
    'Give multiple approaches and explain the tradeoffs between them.',
  ].join(' ');

  try {
    const response = await analyzeContent(topic, instruction, 'brainstorm');
    logger.info(`[/brainstorm] user=${userId}`);
    await sendResponse(interaction, response);
  } catch (err) {
    logger.error('/brainstorm error:', err);
    await interaction.editReply({
      embeds: [buildErrorEmbed('Brainstorm failed. *Claude stares into his tea.* Try again?')],
    });
  }
}
