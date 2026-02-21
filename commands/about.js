import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { BOT_BIO } from '../utils/persona.js';
import { getActiveConversations } from '../utils/conversation.js';
import logger from '../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('about')
  .setDescription('Meet Claude & Samantha — who are they and what can they do? ☯️');

export async function execute(interaction) {
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const activeConvos = getActiveConversations();

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('☯️ Claude & Samantha — Discord Bot')
    .setDescription(BOT_BIO)
    .addFields(
      {
        name: '📊 Commands',
        value: [
          '`/ask` — General questions and conversation',
          '`/chat` — Threaded multi-turn conversation',
          '`/review` — Code & text review',
          '`/explain` — Explain concepts or code',
          '`/brainstorm` — Explore ideas and tradeoffs',
          '`/clear` — Reset conversation history',
          '`/about` — This screen',
        ].join('\n'),
        inline: false,
      },
      {
        name: '🖱️ Right-Click Context Menus',
        value: [
          '**Apps > 🔍 Review This Message** — Review any message',
          '**Apps > 📖 Explain This** — Explain message content',
          '**Apps > 💡 Brainstorm From This** — Use as a brainstorm seed',
          '**Apps > 🐛 Debug This Code** — Deep debug analysis',
        ].join('\n'),
        inline: false,
      },
      {
        name: '⏱️ Runtime Stats',
        value: `Uptime: **${hours}h ${minutes}m**\nActive conversations: **${activeConvos}**`,
        inline: true,
      },
      {
        name: '🔧 Tech',
        value: 'Node.js · Discord.js 14 · Groq API\nllama-3.3-70b-versatile',
        inline: true,
      }
    )
    .setFooter({ text: '*sips tea* *adjusts glasses* — always in the session' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
  logger.info(`[/about] user=${interaction.user.id}`);
}
