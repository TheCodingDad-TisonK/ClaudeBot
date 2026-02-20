import Groq from 'groq-sdk';
import { buildSystemPrompt } from './utils/persona.js';
import logger from './utils/logger.js';

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Llama 3.3 70B — best free model on Groq, strong reasoning and instruction following
const MODEL = 'llama-3.3-70b-versatile';
const MAX_TOKENS = 1500;
const TIMEOUT_MS = parseInt(process.env.RESPONSE_TIMEOUT_MS) || 30000;

/**
 * Send a message to Groq API with conversation history.
 * Groq uses the OpenAI-compatible chat completions format.
 * @param {Array} messages - Conversation history [{role, content}]
 * @param {string} mode - 'default' | 'review' | 'explain' | 'brainstorm'
 * @returns {string} The assistant's response text
 */
export async function sendMessage(messages, mode = 'default') {
  const systemPrompt = buildSystemPrompt(mode);

  logger.debug(`Sending ${messages.length} messages to Groq API (mode: ${mode})`);

  const response = await Promise.race([
    client.chat.completions.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('API timeout')), TIMEOUT_MS)
    ),
  ]);

  const text = response.choices[0]?.message?.content ?? '';
  logger.debug(`Received response: ${text.length} chars`);
  return text;
}

/**
 * Single-shot message without history (for context menu / analysis tasks).
 */
export async function analyzeContent(content, instruction, mode = 'review') {
  const systemPrompt = buildSystemPrompt(mode);

  const response = await Promise.race([
    client.chat.completions.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `${instruction}\n\n---\n\n${content}`,
        },
      ],
    }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('API timeout')), TIMEOUT_MS)
    ),
  ]);

  return response.choices[0]?.message?.content ?? '';
}
