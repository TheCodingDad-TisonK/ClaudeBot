import { SlashCommandBuilder, ThreadAutoArchiveDuration } from 'discord.js';
import { sendMessage } from '../ai-client.js';
import { getHistory, appendHistory, checkRateLimit } from '../utils/conversation.js';
import { sendResponse, buildInfoEmbed, buildErrorEmbed } from '../utils/discord-helpers.js';
import logger from '../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('chat')
  .setDescription('Start or continue a focused conversation thread with Claude & Samantha 🍵')
  .addStringOption((opt) =>
    opt.setName('message').setDescription('Your opening message').setRequired(true)
  )
  .addStringOption((opt) =>
    opt
      .setName('mode')
      .setDescription('Conversation mode')
      .setRequired(false)
      .addChoices(
        { name: '💬 Default', value: 'default' },
        { name: '🔍 Review', value: 'review' },
        { name: '📖 Explain', value: 'explain' },
        { name: '💡 Brainstorm', value: 'brainstorm' }
      )
  )
  .addBooleanOption((opt) =>
    opt
      .setName('new_thread')
      .setDescription('Start a fresh thread (vs continue in channel)')
      .setRequired(false)
  );

export async function execute(interaction) {
  const userId = interaction.user.id;
  const message = interaction.options.getString('message');
  const mode = interaction.options.getString('mode') || 'default';
  const newThread = interaction.options.getBoolean('new_thread') ?? false;

  if (!checkRateLimit(userId)) {
    await interaction.reply({
      embeds: [buildErrorEmbed('Rate limit reached. *sips tea patiently.* Give it a minute. 🌸')],
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  try {
    let contextKey;
    let thread = null;

    if (newThread && interaction.channel?.isTextBased() && interaction.guild) {
      // Create a thread for this conversation
      const threadName = `${interaction.user.username}'s session — ${new Date().toLocaleTimeString()}`;
      thread = await interaction.channel.threads.create({
        name: threadName.slice(0, 100),
        autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
        reason: `Claude & Samantha conversation with ${interaction.user.tag}`,
      });
      contextKey = `thread-${thread.id}`;

      await interaction.editReply(
        `🧵 Started your conversation thread: ${thread}\n*Claude settles in with his tea. Samantha opens her laptop.*`
      );
    } else {
      contextKey = interaction.guildId
        ? `guild-${interaction.channelId}`
        : `dm-${userId}`;
    }

    appendHistory(contextKey, 'user', message);
    const history = getHistory(contextKey);
    const response = await sendMessage(history, mode);
    appendHistory(contextKey, 'assistant', response);

    logger.info(`[/chat] user=${userId} thread=${thread?.id || 'none'} mode=${mode}`);

    if (thread) {
      await sendResponse(thread, response);
    } else {
      await sendResponse(interaction, response);
    }
  } catch (err) {
    logger.error('/chat error:', err);
    await interaction.editReply({
      embeds: [buildErrorEmbed('Something broke. *Claude eyes his tea with suspicion.* Try again?')],
    });
  }
}
