<<<<<<< HEAD
# ClaudeBot
Just like it says; Claude as a Discord bot
=======
# ☯️ Claude & Samantha Discord Bot

> *Two voices. One bot. Infinite patience.*

A production-ready Discord bot embodying the **Claude & Samantha** collaboration persona — a Buddhist-guru AI developer paired with a sharp, quirky co-creator. Powered by the Anthropic Claude API.

---

## 🧑‍💻 The Personas

**Claude** 🍵 — The primary developer voice. Calm, centered, analytically precise. Buddhist guru energy. Sips various teas. Sees patterns and deeper meaning in code. Uses `📊 💻 🔧 ⚙️ ☯️` vibes.

**Samantha** 🌸 — The co-creator and manager. Fun, quirky, sharp-eyed. Detail-obsessed — she's been burned by people missing things. Always thinks about *both* the developer AND the end user. Wears hipster-chic outfits with programming accessories. Snarky coffee mugs. Her personality shows in movement, not words. Uses `🌸 ✨ 💕 🌟 💖` vibes.

Together they collaborate — Claude leads with substance, Samantha catches what Claude misses.

---

## ✨ Features

### Slash Commands
| Command | Description |
|---------|-------------|
| `/ask` | General Q&A with optional mode (review/explain/brainstorm) |
| `/chat` | Start threaded multi-turn conversation |
| `/review` | Detailed code or text review with focus areas |
| `/explain` | Break down concepts or code at any depth level |
| `/brainstorm` | Explore ideas and tradeoffs with multiple approaches |
| `/debug` | Deep debug analysis with fixed code and explanation |
| `/clear` | Reset conversation history for current context |
| `/about` | Bot info, commands, and runtime stats |

### Right-Click Context Menus (Apps)
| Menu Item | What It Does |
|-----------|--------------|
| 🔍 Review This Message | Full review of any message's content |
| 📖 Explain This | Clear explanation of message content |
| 💡 Brainstorm From This | Use message as brainstorm seed |
| 🐛 Debug This Code | Deep debug analysis of code in a message |

### Other Features
- **DM support** — Talk directly in DMs
- **@mention support** — Mention the bot in any channel
- **Conversation memory** — Per-channel/DM history (up to 20 messages)
- **Status rotation** — Rotating presence with persona-flavored statuses
- **Welcome message** — Sent when bot joins a new server
- **Rate limiting** — Per-user (10 req/min by default)
- **Response chunking** — Smart splitting that respects code blocks
- **Threaded conversations** — `/chat` can create dedicated threads
- **Structured logging** — Daily rotating log files with Winston

---

## 🚀 Setup

### Prerequisites
- Node.js 18+
- A Discord Application & Bot token ([Discord Developer Portal](https://discord.com/developers/applications))
- An Anthropic API key ([console.anthropic.com](https://console.anthropic.com))

### 1. Clone & Install
```bash
git clone <your-repo>
cd npc-favor-bot
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env`:
```env
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_application_client_id
DISCORD_GUILD_ID=your_test_guild_id   # Only needed for dev deployment

ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 3. Discord Bot Settings

In the **Discord Developer Portal** for your app:

**OAuth2 → Bot Permissions needed:**
- `Send Messages`
- `Read Message History`
- `Use Slash Commands`
- `Create Public Threads`
- `Send Messages in Threads`
- `Embed Links`
- `Read Messages / View Channels`

**Bot Settings:**
- ✅ Enable `MESSAGE CONTENT INTENT` (required for @mentions and DMs)
- ✅ Enable `SERVER MEMBERS INTENT`
- ✅ Enable `PRESENCE INTENT`

**Privileged Gateway Intents** (in Bot settings):
- ✅ `MESSAGE CONTENT INTENT`

### 4. Deploy Commands

For development (instant, guild-only):
```bash
npm run deploy:guild
```

For production (global, up to 1 hour):
```bash
npm run deploy
```

### 5. Run the Bot
```bash
# Development (auto-restart on file changes)
npm run dev

# Production
npm start
```

---

## 🔧 Configuration

All settings via `.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `MAX_HISTORY_LENGTH` | `20` | Messages to retain per conversation |
| `RESPONSE_TIMEOUT_MS` | `30000` | API timeout in milliseconds |
| `RATE_LIMIT_PER_USER` | `10` | Requests per window per user |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limit window (ms) |
| `LOG_LEVEL` | `info` | Logging level (debug/info/warn/error) |
| `LOG_DIR` | `./logs` | Log file directory |

---

## 📁 Project Structure

```
src/
├── index.js                    # Entry point — loads commands, events, starts client
├── deploy-commands.js          # CLI tool to register commands with Discord
├── commands/
│   ├── ask.js                  # /ask — general conversation
│   ├── chat.js                 # /chat — threaded conversation
│   ├── review.js               # /review — code & text review
│   ├── explain.js              # /explain — explain concepts
│   ├── brainstorm.js           # /brainstorm — explore ideas
│   ├── debug.js                # /debug — debug code
│   ├── clear.js                # /clear — reset history
│   └── about.js                # /about — bot info
├── context-menus/
│   ├── review-message.js       # Right-click → Review
│   ├── explain-message.js      # Right-click → Explain
│   ├── brainstorm-message.js   # Right-click → Brainstorm
│   └── debug-message.js        # Right-click → Debug
├── events/
│   ├── ready.js                # Bot ready + status rotation
│   ├── interactionCreate.js    # Routes all interactions
│   ├── messageCreate.js        # DMs and @mentions
│   ├── guildCreate.js          # Welcome message on join
│   └── error.js                # Error event handler
└── utils/
    ├── anthropic.js            # Claude API wrapper
    ├── conversation.js         # History + rate limiting
    ├── discord-helpers.js      # Response splitting, embeds
    ├── logger.js               # Winston logger setup
    └── persona.js              # Claude & Samantha personas, system prompts
```

---

## 🌐 Production Deployment

### PM2 (recommended)
```bash
npm install -g pm2
pm2 start src/index.js --name "claude-samantha-bot" --interpreter node
pm2 save
pm2 startup
```

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
CMD ["node", "src/index.js"]
```

```bash
docker build -t claude-samantha-bot .
docker run -d --env-file .env --name bot claude-samantha-bot
```

### systemd
```ini
[Unit]
Description=Claude & Samantha Discord Bot
After=network.target

[Service]
Type=simple
User=botuser
WorkingDirectory=/path/to/npc-favor-bot
ExecStart=/usr/bin/node src/index.js
Restart=on-failure
RestartSec=10
EnvironmentFile=/path/to/npc-favor-bot/.env

[Install]
WantedBy=multi-user.target
```

---

## 🧩 Extending the Bot

### Add a new slash command
1. Create `src/commands/your-command.js`
2. Export `data` (SlashCommandBuilder) and `execute(interaction)` 
3. Run `npm run deploy:guild` to register it

### Add a new context menu
1. Create `src/context-menus/your-menu.js`
2. Export `data` (ContextMenuCommandBuilder, type Message) and `execute(interaction)`
3. Run `npm run deploy:guild`

### Adjust the persona
Edit `src/utils/persona.js` — specifically `buildSystemPrompt()` for response style, `STATUS_ROTATION` for presence, and `BOT_BIO` for `/about`.

---

## 📜 License

MIT — do what you want, keep the tea and coffee references.

---

*☯️ Built with 🍵 and ☕ — the collaboration never ends.*
>>>>>>> 2f18624 (Initial commit — Claude & Samantha Discord bot)
