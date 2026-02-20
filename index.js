import 'dotenv/config';
import { Client, GatewayIntentBits, Collection, Partials } from 'discord.js';
import { readdirSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import logger from './utils/logger.js';

// ─── Validate environment ───────────────────────────────────────────────────
const REQUIRED_ENV = ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID', 'GROQ_API_KEY'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    logger.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Create client ──────────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel, Partials.Message],
});

// ─── Load slash commands ─────────────────────────────────────────────────────
client.commands = new Collection();
const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter((f) => f.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = pathToFileURL(join(commandsPath, file)).href;
  const command = await import(filePath);
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
    logger.debug(`Loaded command: /${command.data.name}`);
  } else {
    logger.warn(`Skipping ${file} — missing data or execute export`);
  }
}

logger.info(`Loaded ${client.commands.size} slash command(s)`);

// ─── Load context menus ───────────────────────────────────────────────────────
client.contextMenus = new Collection();
const ctxPath = join(__dirname, 'context-menus');
const ctxFiles = readdirSync(ctxPath).filter((f) => f.endsWith('.js'));

for (const file of ctxFiles) {
  const filePath = pathToFileURL(join(ctxPath, file)).href;
  const menu = await import(filePath);
  if (menu.data && menu.execute) {
    client.contextMenus.set(menu.data.name, menu);
    logger.debug(`Loaded context menu: "${menu.data.name}"`);
  } else {
    logger.warn(`Skipping context menu ${file} — missing data or execute`);
  }
}

logger.info(`Loaded ${client.contextMenus.size} context menu(s)`);

// ─── Load events ──────────────────────────────────────────────────────────────
const eventsPath = join(__dirname, 'events');
const eventFiles = readdirSync(eventsPath).filter((f) => f.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = pathToFileURL(join(eventsPath, file)).href;
  const event = await import(filePath);

  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }

  logger.debug(`Registered event: ${event.name} (once=${event.once ?? false})`);
}

logger.info(`Registered ${eventFiles.length} event(s)`);

// ─── Global error handlers ────────────────────────────────────────────────────
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled promise rejection:', err);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception:', err);
  setTimeout(() => process.exit(1), 1000);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received — shutting down gracefully');
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received — shutting down gracefully');
  client.destroy();
  process.exit(0);
});

// ─── Login ────────────────────────────────────────────────────────────────────
logger.info('Connecting to Discord...');
client.login(process.env.DISCORD_TOKEN);
