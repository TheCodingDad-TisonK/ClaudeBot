import { EmbedBuilder } from 'discord.js';
import logger from './logger.js';

const DISCORD_MAX_LENGTH = 2000;
const EMBED_MAX_DESC = 4096;

/**
 * Split a long message into Discord-safe chunks.
 * Respects code blocks — won't split inside them.
 */
export function splitMessage(text, maxLength = DISCORD_MAX_LENGTH) {
  if (text.length <= maxLength) return [text];

  const chunks = [];
  let current = '';
  let inCodeBlock = false;
  let codeBlockLang = '';

  const lines = text.split('\n');

  for (const line of lines) {
    const codeMatch = line.match(/^```(\w*)/);
    const codeEnd = line === '```';

    if (codeMatch) {
      inCodeBlock = true;
      codeBlockLang = codeMatch[1] || '';
    } else if (codeEnd && inCodeBlock) {
      inCodeBlock = false;
    }

    const addition = (current ? '\n' : '') + line;

    if (current.length + addition.length > maxLength) {
      // Close code block if open
      if (inCodeBlock) {
        chunks.push(current + '\n```');
        current = '```' + codeBlockLang + '\n' + line;
      } else {
        chunks.push(current);
        current = line;
      }
    } else {
      current += addition;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

/**
 * Send a response, splitting if needed.
 * Works for both interactions and channel messages.
 */
export async function sendResponse(target, text, options = {}) {
  const chunks = splitMessage(text);

  try {
    if (options.ephemeral && target.reply) {
      // First chunk as reply
      await target.reply({ content: chunks[0], ephemeral: true });
      // Followups
      for (let i = 1; i < chunks.length; i++) {
        await target.followUp({ content: chunks[i], ephemeral: true });
      }
    } else if (target.editReply) {
      // Interaction already deferred
      await target.editReply({ content: chunks[0] });
      for (let i = 1; i < chunks.length; i++) {
        await target.followUp({ content: chunks[i] });
      }
    } else if (target.reply) {
      await target.reply({ content: chunks[0] });
      for (let i = 1; i < chunks.length; i++) {
        await target.channel.send(chunks[i]);
      }
    } else if (target.send) {
      // Direct channel/thread send
      for (const chunk of chunks) {
        await target.send(chunk);
      }
    }
  } catch (err) {
    logger.error('Failed to send response:', err);
    throw err;
  }
}

/**
 * Build an error embed in Claude's style.
 */
export function buildErrorEmbed(message) {
  return new EmbedBuilder()
    .setColor(0xff6b6b)
    .setTitle('⚙️ Something went sideways')
    .setDescription(
      `*Claude sets down his tea carefully.*\n\n**Claude**: ${message}\n\n**Samantha**: *taps her mug* We'll sort it. 🌸`
    )
    .setFooter({ text: 'Claude & Samantha Bot' });
}

/**
 * Build an info embed.
 */
export function buildInfoEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(title)
    .setDescription(description.slice(0, EMBED_MAX_DESC))
    .setFooter({ text: '☯️ Claude & Samantha Bot • sipping tea & coffee' });
}

/**
 * Truncate text for embed descriptions.
 */
export function truncate(text, max = EMBED_MAX_DESC) {
  if (text.length <= max) return text;
  return text.slice(0, max - 20) + '\n\n*...response truncated*';
}
