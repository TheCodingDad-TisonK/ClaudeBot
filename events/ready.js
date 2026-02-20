import { ActivityType } from 'discord.js';
import { STATUS_ROTATION } from '../utils/persona.js';
import { readNotes, formatNotes } from '../utils/scratchpad.js';
import logger from '../utils/logger.js';

let statusIndex = 0;
const STATUS_INTERVAL_MS = 5 * 60 * 1000;

const typeMap = {
  WATCHING: ActivityType.Watching,
  LISTENING: ActivityType.Listening,
  PLAYING: ActivityType.Playing,
  COMPETING: ActivityType.Competing,
};

function setStatus(client) {
  const status = STATUS_ROTATION[statusIndex % STATUS_ROTATION.length];
  statusIndex++;
  client.user.setPresence({
    status: 'online',
    activities: [{ name: status.text, type: typeMap[status.type] ?? ActivityType.Watching }],
  });
}

export const name = 'ready';
export const once = true;

export function execute(client) {
  logger.info(`✅ Bot ready! Logged in as: ${client.user.tag}`);
  logger.info(`📊 Serving ${client.guilds.cache.size} guild(s)`);

  setStatus(client);
  setInterval(() => setStatus(client), STATUS_INTERVAL_MS);

  // ─── Read the scratchpad — like finding a note left before shutdown ──────
  const notes = readNotes({ limit: 5 });

  console.log(`
  ☯️  ════════════════════════════════════ ☯️
       Claude & Samantha Discord Bot
  
       *sips green tea*
       *adjusts her cat-eye glasses*
       
       Ready to collaborate. 🍵 🌸
  ☯️  ════════════════════════════════════ ☯️
  `);

  if (notes.length > 0) {
    console.log(`  📝 Found ${notes.length} note(s) on the scratchpad from last session:\n`);
    notes.forEach((n) => {
      const who = n.author === 'claude' ? '🍵 Claude' : n.author === 'samantha' ? '🌸 Samantha' : `User`;
      const date = new Date(n.timestamp).toLocaleString();
      console.log(`     [${n.tag.toUpperCase()}] ${who} — ${date}`);
      console.log(`     "${n.content}"\n`);
    });
  } else {
    console.log(`  📝 Scratchpad is empty. Fresh start.\n`);
  }

  client.guilds.cache.forEach((guild) => {
    logger.info(`  → Guild: ${guild.name} (${guild.memberCount} members)`);
  });
}
