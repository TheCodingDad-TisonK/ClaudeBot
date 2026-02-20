import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isGuild = process.argv.includes('--guild');

const { DISCORD_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID) {
  console.error('❌ DISCORD_TOKEN and DISCORD_CLIENT_ID are required');
  process.exit(1);
}

if (isGuild && !DISCORD_GUILD_ID) {
  console.error('❌ DISCORD_GUILD_ID is required for guild deployment');
  process.exit(1);
}

const commands = [];

// Load slash commands
const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter((f) => f.endsWith('.js'));
for (const file of commandFiles) {
  const mod = await import(pathToFileURL(join(commandsPath, file)).href);
  if (mod.data) {
    commands.push(mod.data.toJSON());
    console.log(`  + Command: /${mod.data.name}`);
  }
}

// Load context menus
const ctxPath = join(__dirname, 'context-menus');
const ctxFiles = readdirSync(ctxPath).filter((f) => f.endsWith('.js'));
for (const file of ctxFiles) {
  const mod = await import(pathToFileURL(join(ctxPath, file)).href);
  if (mod.data) {
    commands.push(mod.data.toJSON());
    console.log(`  + Context menu: "${mod.data.name}"`);
  }
}

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

const route = isGuild
  ? Routes.applicationGuildCommands(DISCORD_CLIENT_ID, DISCORD_GUILD_ID)
  : Routes.applicationCommands(DISCORD_CLIENT_ID);

console.log(`\n☯️  Deploying ${commands.length} commands (${isGuild ? 'guild' : 'global'})...`);

try {
  const data = await rest.put(route, { body: commands });
  console.log(`\n✅ Successfully deployed ${data.length} command(s)!`);
  if (isGuild) {
    console.log(`   Guild: ${DISCORD_GUILD_ID} (instant)`);
  } else {
    console.log(`   Global deployment — may take up to 1 hour to appear in Discord`);
  }
  console.log(`\n*Claude sips tea.* *Samantha gives a thumbs up.* 🍵 🌸\n`);
} catch (err) {
  console.error('❌ Deployment failed:', err);
  process.exit(1);
}
