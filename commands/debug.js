import { SlashCommandBuilder } from 'discord.js';
import { analyzeContent } from '../ai-client.js';
import { checkRateLimit } from '../utils/conversation.js';
import { sendResponse, buildErrorEmbed } from '../utils/discord-helpers.js';
import logger from '../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('debug')
  .setDescription('Debug broken code with Claude & Samantha 🐛')
  .addStringOption((opt) =>
    opt.setName('code').setDescription('The broken code').setRequired(true)
  )
  .addStringOption((opt) =>
    opt
      .setName('error')
      .setDescription('The error message or unexpected behavior')
      .setRequired(false)
  )
  .addStringOption((opt) =>
    opt
      .setName('context')
      .setDescription('What were you trying to do? Language/framework?')
      .setRequired(false)
  );

export async function execute(interaction) {
  const userId = interaction.user.id;
  const code = interaction.options.getString('code');
  const error = interaction.options.getString('error') || '';
  const context = interaction.options.getString('context') || '';

  if (!checkRateLimit(userId)) {
    await interaction.reply({
      embeds: [buildErrorEmbed('Rate limit reached. *breathes deeply.* 🌸 One moment.')],
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  const parts = [
    'Debug the following code.',
    error ? `The error/symptom is: "${error}"` : 'No specific error provided — look for issues.',
    context ? `Context: ${context}` : '',
    '\nProvide:',
    '1. Root cause analysis (Claude)',
    '2. Edge cases and things that could go wrong next (Samantha)',
    '3. Fixed code',
    '4. Explanation of the fix',
    '',
    'Use **Claude**: and **Samantha**: headers. Be specific.',
  ].filter(Boolean).join(' ');

  try {
    const response = await analyzeContent(code, parts, 'review');
    logger.info(`[/debug] user=${userId} codeLen=${code.length}`);
    await sendResponse(interaction, response);
  } catch (err) {
    logger.error('/debug error:', err);
    await interaction.editReply({
      embeds: [buildErrorEmbed('Debug failed. *Claude squints at the error.* Try again?')],
    });
  }
}
