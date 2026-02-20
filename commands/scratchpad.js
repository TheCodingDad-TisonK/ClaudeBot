import { SlashCommandBuilder } from 'discord.js';
import { writeNote, readNotes, deleteNote, clearNotes, formatNotes } from '../utils/scratchpad.js';
import { buildInfoEmbed, buildErrorEmbed, splitMessage } from '../utils/discord-helpers.js';
import logger from '../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('scratchpad')
  .setDescription('Claude & Samantha\'s persistent notepad — notes that survive restarts 📝')
  .addSubcommand((sub) =>
    sub.setName('write')
      .setDescription('Leave a note for later')
      .addStringOption((opt) => opt.setName('note').setDescription('What to write down').setRequired(true))
      .addStringOption((opt) =>
        opt.setName('tag').setDescription('Note type').setRequired(false)
          .addChoices(
            { name: '📝 Note', value: 'note' },
            { name: '⏰ Reminder', value: 'reminder' },
            { name: '🔍 Observation', value: 'observation' },
            { name: '✅ Todo', value: 'todo' },
            { name: '⚠️ Warning', value: 'warning' },
          )
      )
      .addStringOption((opt) =>
        opt.setName('voice').setDescription('Whose voice is writing?').setRequired(false)
          .addChoices(
            { name: '🍵 Claude', value: 'claude' },
            { name: '🌸 Samantha', value: 'samantha' },
          )
      )
  )
  .addSubcommand((sub) =>
    sub.setName('read')
      .setDescription('Read notes from the scratchpad')
      .addStringOption((opt) =>
        opt.setName('filter').setDescription('Filter by type').setRequired(false)
          .addChoices(
            { name: '📝 Notes only', value: 'note' },
            { name: '⏰ Reminders only', value: 'reminder' },
            { name: '🔍 Observations only', value: 'observation' },
            { name: '✅ Todos only', value: 'todo' },
            { name: '⚠️ Warnings only', value: 'warning' },
          )
      )
      .addIntegerOption((opt) => opt.setName('limit').setDescription('How many recent notes? (default: 10)').setRequired(false))
  )
  .addSubcommand((sub) =>
    sub.setName('delete')
      .setDescription('Delete a note by ID')
      .addIntegerOption((opt) => opt.setName('id').setDescription('Note ID (from /scratchpad read)').setRequired(true))
  )
  .addSubcommand((sub) =>
    sub.setName('clear')
      .setDescription('⚠️ Wipe the entire scratchpad')
      .addBooleanOption((opt) => opt.setName('confirm').setDescription('Are you sure? This cannot be undone.').setRequired(true))
  );

export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  const userId = interaction.user.id;

  if (sub === 'write') {
    const content = interaction.options.getString('note');
    const tag = interaction.options.getString('tag') || 'note';
    const voice = interaction.options.getString('voice') || userId;

    const entry = writeNote(voice, content, tag);

    const voiceLabel = voice === 'claude'
      ? '*Claude uncaps his pen and writes carefully.* 🍵'
      : voice === 'samantha'
        ? '*Samantha grabs a sticky note and scribbles fast.* 🌸'
        : '*A note is left on the scratchpad.*';

    await interaction.reply({
      embeds: [buildInfoEmbed(
        `📝 Note saved [ID: ${entry.id}]`,
        `${voiceLabel}\n\n> ${content}\n\n*Tag: ${tag} · ${new Date(entry.timestamp).toLocaleString()}*`
      )],
      ephemeral: false,
    });

    logger.info(`[scratchpad:write] user=${userId} tag=${tag} voice=${voice}`);
  }

  else if (sub === 'read') {
    const tag = interaction.options.getString('filter') || null;
    const limit = interaction.options.getInteger('limit') || 10;

    const notes = readNotes({ tag, limit });
    const formatted = formatNotes(notes);

    const header = tag
      ? `*Flipping to the ${tag} section...* 🍵`
      : `*Claude spreads the scratchpad open on the table.* ☯️`;

    const chunks = splitMessage(`${header}\n\n${formatted}`);
    await interaction.reply({ content: chunks[0], ephemeral: false });
    for (let i = 1; i < chunks.length; i++) {
      await interaction.followUp({ content: chunks[i] });
    }

    logger.info(`[scratchpad:read] user=${userId} filter=${tag} limit=${limit} found=${notes.length}`);
  }

  else if (sub === 'delete') {
    const id = interaction.options.getInteger('id');
    const deleted = deleteNote(id);

    if (deleted) {
      await interaction.reply({
        embeds: [buildInfoEmbed('🗑️ Note deleted', `*Claude tears the page out quietly.* ☯️\n\nNote ID **${id}** has been removed.`)],
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        embeds: [buildErrorEmbed(`No note found with ID **${id}**. *Samantha double-checks the ID.* 🌸`)],
        ephemeral: true,
      });
    }

    logger.info(`[scratchpad:delete] user=${userId} id=${id} success=${deleted}`);
  }

  else if (sub === 'clear') {
    const confirm = interaction.options.getBoolean('confirm');
    if (!confirm) {
      await interaction.reply({ content: '*Claude closes the notebook.* ☯️ Nothing cleared.', ephemeral: true });
      return;
    }
    clearNotes();
    await interaction.reply({
      embeds: [buildInfoEmbed('🗑️ Scratchpad cleared', '*Samantha flips to a fresh page.* ✨\n\nAll notes have been wiped. The scratchpad is blank.')],
      ephemeral: false,
    });
    logger.info(`[scratchpad:clear] user=${userId}`);
  }
}
