import { EmbedBuilder } from 'discord.js';
import logger from '../utils/logger.js';

export const name = 'guildCreate';
export const once = false;

export async function execute(guild) {
  logger.info(`Joined new guild: ${guild.name} (${guild.id}) — ${guild.memberCount} members`);

  // Find the first text channel we can send to
  const channel = guild.channels.cache.find(
    (ch) => ch.isTextBased() && ch.permissionsFor(guild.members.me)?.has('SendMessages')
  );

  if (!channel) {
    logger.warn(`No sendable channel found in ${guild.name}`);
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('☯️ Hello! Claude & Samantha have arrived.')
    .setDescription(
      `*A calm presence settles in. Someone sets down a tea mug. Someone else kicks back with a snarky coffee cup.*\n\n` +
      `**Claude** 🍵 and **Samantha** 🌸 are here — a dual-voice AI collaboration bot powered by Claude (Anthropic).\n\n` +
      `We're here to help you **think through problems**, **review code and writing**, **explain concepts**, and **brainstorm ideas** — together.\n\n` +
      `**Getting started:**\n` +
      `• \`/ask\` — Ask us anything\n` +
      `• \`/review\` — Get code or text reviewed\n` +
      `• \`/explain\` — Have something explained\n` +
      `• \`/brainstorm\` — Explore ideas together\n` +
      `• \`/about\` — Full command list & info\n` +
      `• **Right-click any message → Apps** for quick actions\n\n` +
      `You can also **mention me** or **DM me** directly. *sips tea* We're always in the session.`
    )
    .setFooter({ text: '☯️ Claude & Samantha Bot — two voices, one flow' })
    .setTimestamp();

  try {
    await channel.send({ embeds: [embed] });
  } catch (err) {
    logger.error(`Failed to send welcome to ${guild.name}:`, err);
  }
}
