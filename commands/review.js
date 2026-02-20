import { SlashCommandBuilder } from 'discord.js';
import { analyzeContent } from '../ai-client.js';
import { checkRateLimit } from '../utils/conversation.js';
import { sendResponse, buildErrorEmbed } from '../utils/discord-helpers.js';
import logger from '../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('review')
  .setDescription('Get a thorough code or text review from Claude & Samantha 🔍')
  .addStringOption((opt) =>
    opt
      .setName('content')
      .setDescription('Paste your code or text here')
      .setRequired(true)
  )
  .addStringOption((opt) =>
    opt
      .setName('context')
      .setDescription('What language/framework/goal? (optional but helpful)')
      .setRequired(false)
  )
  .addStringOption((opt) =>
    opt
      .setName('focus')
      .setDescription('What specifically to focus on?')
      .setRequired(false)
      .addChoices(
        { name: '🐛 Bugs & correctness', value: 'bugs' },
        { name: '✨ Code quality & style', value: 'quality' },
        { name: '🚀 Performance', value: 'performance' },
        { name: '🔒 Security', value: 'security' },
        { name: '📖 Readability', value: 'readability' },
        { name: '🌐 UX & user experience', value: 'ux' },
        { name: '🔭 Everything', value: 'all' }
      )
  );

export async function execute(interaction) {
  const userId = interaction.user.id;
  const content = interaction.options.getString('content');
  const context = interaction.options.getString('context') || '';
  const focus = interaction.options.getString('focus') || 'all';

  if (!checkRateLimit(userId)) {
    await interaction.reply({
      embeds: [buildErrorEmbed('Rate limit reached. *sips tea.* Give it a moment. 🌸')],
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  const focusMap = {
    bugs: 'Focus specifically on bugs, logical errors, and correctness issues.',
    quality: 'Focus on code quality, style, maintainability, and best practices.',
    performance: 'Focus on performance bottlenecks, efficiency, and optimization opportunities.',
    security: 'Focus on security vulnerabilities, injection risks, and unsafe patterns.',
    readability: 'Focus on readability, naming, structure, and documentation.',
    ux: 'Focus on user experience — is this intuitive? What happens at edge cases? What would confuse a new user?',
    all: 'Give a comprehensive review covering bugs, quality, performance, security, readability, and UX.',
  };

  const instruction = [
    `Please review the following${context ? ` (${context})` : ''}.`,
    focusMap[focus],
    'Be specific and actionable. Claude handles technical depth; Samantha catches what Claude misses — especially UX, edge cases, and user-facing impact.',
    'Use the **Claude**: and **Samantha**: dialog format where helpful.',
  ].join(' ');

  try {
    const response = await analyzeContent(content, instruction, 'review');
    logger.info(`[/review] user=${userId} focus=${focus} len=${content.length}`);
    await sendResponse(interaction, response);
  } catch (err) {
    logger.error('/review error:', err);
    await interaction.editReply({
      embeds: [buildErrorEmbed('Review failed. *Claude refills his cup.* Please try again.')],
    });
  }
}
