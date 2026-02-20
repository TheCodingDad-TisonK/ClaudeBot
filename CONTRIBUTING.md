# Contributing to Claude & Samantha Discord Bot

> *Pull up a chair. Claude will pour tea. Samantha will find the edge cases you missed.*

---

## Welcome

Contributions are welcome — bug fixes, new commands, persona improvements, or anything that makes the bot more useful. Read this first so your PR doesn't get stuck.

---

## Getting Started

### Prerequisites
- Node.js 18+
- A Discord bot token ([Discord Developer Portal](https://discord.com/developers/applications))
- A Groq API key ([console.groq.com](https://console.groq.com)) — free tier, no card needed

### Setup
```bash
git clone https://github.com/yourname/ClaudeBot.git
cd ClaudeBot
npm install
cp .env .env.local   # fill in your own tokens for testing
npm run deploy:guild  # register commands to your test server
npm run dev
```

---

## Project Structure

```
├── index.js              # Entry point — loads everything, starts client
├── ai-client.js          # Groq API wrapper — change model/provider here
├── deploy-commands.js    # Registers slash commands with Discord
├── commands/             # One file per slash command
├── context-menus/        # One file per right-click action
├── events/               # Discord.js event handlers
└── utils/
    ├── persona.js        # THE SOUL — personas, system prompts, status rotation
    ├── scratchpad.js     # Persistent note engine
    ├── conversation.js   # History + rate limiting
    ├── discord-helpers.js # Response splitting, embeds
    └── logger.js         # Winston logging
```

---

## How to Add Things

### New slash command
1. Create `commands/your-command.js`
2. Export `data` (SlashCommandBuilder) and `execute(interaction)`
3. Run `npm run deploy:guild` to register it
4. That's it — `index.js` auto-discovers it

```js
import { SlashCommandBuilder } from 'discord.js';
import { sendResponse, buildErrorEmbed } from '../utils/discord-helpers.js';

export const data = new SlashCommandBuilder()
  .setName('your-command')
  .setDescription('What it does');

export async function execute(interaction) {
  await interaction.reply('Hello ☯️');
}
```

### New right-click context menu
1. Create `context-menus/your-menu.js`
2. Export `data` (ContextMenuCommandBuilder, type `Message`) and `execute(interaction)`
3. Run `npm run deploy:guild`

### Changing the persona
Edit `utils/persona.js`:
- `buildSystemPrompt()` — shapes every AI response
- `STATUS_ROTATION` — the bot's rotating presence messages
- `BOT_BIO` — shown in `/about`

### Changing the AI model
Edit `ai-client.js` — swap the `MODEL` constant or replace the Groq client entirely. The rest of the bot doesn't care what's underneath as long as `sendMessage()` and `analyzeContent()` return strings.

---

## Code Style

- ES Modules (`import`/`export`) throughout — no CommonJS
- Async/await, not `.then()` chains
- All user-facing errors go through `buildErrorEmbed()` — keep the persona consistent
- Log with `logger.info/warn/error` — not `console.log` (except startup art in `ready.js`)
- Keep files focused — if a command file is doing more than commanding, extract to `utils/`

---

## Commit Messages

Keep them short and clear:

```
feat: add /translate command
fix: scratchpad crashes when notes.json is malformed
chore: update groq-sdk to 0.10.0
docs: add context menu examples to CONTRIBUTING
```

---

## Pull Request Checklist

Before opening a PR, make sure:

- [ ] `npm install` runs clean
- [ ] `npm run deploy:guild` registers without errors
- [ ] Your feature works end-to-end in a real Discord server
- [ ] No tokens, API keys, or `.env` contents are committed
- [ ] New commands follow the existing file structure pattern
- [ ] Persona voice is consistent — Claude is calm/technical, Samantha catches edge cases

---

## What We're NOT Looking For

- Changing the core Claude & Samantha persona without discussion — open an issue first
- Swapping from Groq to a paid API without a config flag to keep free-tier working
- Adding dependencies for things Node.js already handles natively
- PRs that commit `node_modules/`, `.env`, `logs/`, or `scratchpad/`

---

## Questions

Open an issue. *Claude will read it carefully over tea. Samantha will immediately ask what happens at the edge cases.* 🍵 🌸