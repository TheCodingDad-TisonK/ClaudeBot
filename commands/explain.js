import { SlashCommandBuilder } from 'discord.js';
import { analyzeContent } from '../ai-client.js';
import { checkRateLimit } from '../utils/conversation.js';
import { sendResponse, buildErrorEmbed } from '../utils/discord-helpers.js';
import logger from '../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('explain')
  .setDescription('Have Claude & Samantha explain a concept or piece of code 📖')
  .addStringOption((opt) =>
    opt
      .setName('topic')
      .setDescription('What should they explain? Paste code or describe a concept.')
      .setRequired(true)
  )
  .addStringOption((opt) =>
    opt
      .setName('level')
      .setDescription('Explanation depth')
      .setRequired(false)
      .addChoices(
        { name: '🌱 Beginner — assume no prior knowledge', value: 'beginner' },
        { name: '🌿 Intermediate — some experience', value: 'intermediate' },
        { name: '🌳 Expert — go deep', value: 'expert' }
      )
  );

export async function execute(interaction) {
  const userId = interaction.user.id;
  const topic = interaction.options.getString('topic');
  const level = interaction.options.getString('level') || 'intermediate';

  if (!checkRateLimit(userId)) {
    await interaction.reply({
      embeds: [buildErrorEmbed('Rate limit reached. *sips chamomile.* A moment please. 🌸')],
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  const levelMap = {
    beginner: 'Explain as if to someone with no programming background. Use analogies and simple language. Avoid jargon without defining it.',
    intermediate: 'Explain clearly for someone with some development experience. You can use technical terms but provide context.',
    expert: 'Go deep. Assume expert-level knowledge. Cover nuances, edge cases, tradeoffs, and underlying mechanisms.',
  };

  const instruction = [
    `Please explain the following. ${levelMap[level]}`,
    'Claude provides the technical depth and patterns; Samantha ensures it\'s accessible and flags anything that might confuse someone encountering this for the first time.',
    'Use examples, analogies, and structure where helpful.',
  ].join(' ');

  try {
    const response = await analyzeContent(topic, instruction, 'explain');
    logger.info(`[/explain] user=${userId} level=${level}`);
    await sendResponse(interaction, response);
  } catch (err) {
    logger.error('/explain error:', err);
    await interaction.editReply({
      embeds: [buildErrorEmbed('Explanation failed. *Claude blinks slowly.* Try again?')],
    });
  }
}
