import { sendMessage } from '../ai-client.js';
import { getHistory, appendHistory, checkRateLimit } from '../utils/conversation.js';
import { splitMessage } from '../utils/discord-helpers.js';
import logger from '../utils/logger.js';

export const name = 'messageCreate';
export const once = false;

export async function execute(message, client) {
  // Ignore bots
  if (message.author.bot) return;

  const isDM = !message.guild;
  const isMention = message.mentions.has(client.user);

  // Only respond in DMs or when directly mentioned
  if (!isDM && !isMention) return;

  const userId = message.author.id;
  const contextKey = isDM ? `dm-${userId}` : `guild-${message.channelId}`;

  // Rate limit
  if (!checkRateLimit(userId)) {
    await message.reply(
      `*Claude sets down his tea.* ☯️ You've sent a lot of messages recently. Give it a moment before the next one.\n**Samantha**: *glances over her glasses* We'll be here. 🌸`
    );
    return;
  }

  // Strip the mention from the message text
  let userText = message.content
    .replace(/<@!?\d+>/g, '')
    .trim();

  if (!userText) {
    await message.reply(
      `*Claude looks up from his tea.* Yes? You mentioned me but didn't say anything. What's on your mind? 🍵`
    );
    return;
  }

  // Show typing indicator
  try {
    await message.channel.sendTyping();
  } catch (_) {}

  try {
    appendHistory(contextKey, 'user', userText);
    const history = getHistory(contextKey);
    const response = await sendMessage(history, 'default');
    appendHistory(contextKey, 'assistant', response);

    logger.info(`[MSG] user=${message.author.tag} dm=${isDM} len=${response.length}`);

    const chunks = splitMessage(response);
    // Reply to first chunk, then send subsequent ones
    await message.reply(chunks[0]);
    for (let i = 1; i < chunks.length; i++) {
      await message.channel.send(chunks[i]);
    }
  } catch (err) {
    logger.error('messageCreate handler error:', err);
    await message.reply(
      `*Claude pauses, sets down his tea.* ⚙️ Something went wrong on my end. **Samantha**: *squints at the logs* We'll figure it out. Try again? 🌸`
    );
  }
}
