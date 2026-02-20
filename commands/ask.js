import { SlashCommandBuilder } from 'discord.js';
import { sendMessage } from '../ai-client.js';
import { getHistory, appendHistory, checkRateLimit, getRemainingRequests } from '../utils/conversation.js';
import { sendResponse, buildErrorEmbed } from '../utils/discord-helpers.js';
import logger from '../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('ask')
  .setDescription('Ask Claude & Samantha anything — code, concepts, decisions, life ☯️')
  .addStringOption((opt) =>
    opt.setName('question').setDescription('What\'s on your mind?').setRequired(true)
  )
  .addStringOption((opt) =>
    opt
      .setName('mode')
      .setDescription('How should they approach it?')
      .setRequired(false)
      .addChoices(
        { name: '💬 Default — let them decide', value: 'default' },
        { name: '🔍 Review — critique and improve', value: 'review' },
        { name: '📖 Explain — break it down', value: 'explain' },
        { name: '💡 Brainstorm — explore ideas', value: 'brainstorm' }
      )
  );

export async function execute(interaction) {
  const userId = interaction.user.id;
  const question = interaction.options.getString('question');
  const mode = interaction.options.getString('mode') || 'default';

  // Rate limit check
  if (!checkRateLimit(userId)) {
    const remaining = getRemainingRequests(userId);
    await interaction.reply({
      embeds: [
        buildErrorEmbed(
          `You've hit the rate limit. *sips tea patiently.* Please wait a moment before asking again.\n\n**Samantha**: *glances over her glasses* No rush — we'll be here. 🌸\n\nRemaining requests: **${remaining}**`
        ),
      ],
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  // Context key: DM uses user ID, guild uses channel ID
  const contextKey = interaction.guildId
    ? `guild-${interaction.channelId}`
    : `dm-${userId}`;

  try {
    const history = getHistory(contextKey);
    appendHistory(contextKey, 'user', question);

    const updatedHistory = getHistory(contextKey);
    const response = await sendMessage(updatedHistory, mode);
    appendHistory(contextKey, 'assistant', response);

    logger.info(`[/ask] user=${userId} mode=${mode} chars=${response.length}`);

    await sendResponse(interaction, response);
  } catch (err) {
    logger.error('/ask error:', err);
    await interaction.editReply({
      embeds: [
        buildErrorEmbed(
          `The API took longer than expected. *Claude refills his tea.* Please try again in a moment.`
        ),
      ],
    });
  }
}
