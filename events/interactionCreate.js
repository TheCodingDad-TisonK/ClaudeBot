import logger from '../utils/logger.js';
import { buildErrorEmbed } from '../utils/discord-helpers.js';

export const name = 'interactionCreate';
export const once = false;

export async function execute(interaction, client) {
  // Slash commands
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);

    if (!command) {
      logger.warn(`Unknown command: ${interaction.commandName}`);
      await interaction.reply({
        embeds: [buildErrorEmbed(`Unknown command \`/${interaction.commandName}\`. *Claude scratches his head.*`)],
        ephemeral: true,
      });
      return;
    }

    try {
      logger.info(
        `[CMD] /${interaction.commandName} by ${interaction.user.tag} in ${
          interaction.guild?.name || 'DM'
        }`
      );
      await command.execute(interaction, client);
    } catch (err) {
      logger.error(`Command /${interaction.commandName} failed:`, err);

      const errorEmbed = buildErrorEmbed(
        `An error occurred running \`/${interaction.commandName}\`.\n*Claude takes a slow breath.* It's not you — it's us. Please try again.`
      );

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [errorEmbed] }).catch(() => {});
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true }).catch(() => {});
      }
    }
    return;
  }

  // Context menu commands (right-click on messages)
  if (interaction.isMessageContextMenuCommand()) {
    const command = client.contextMenus.get(interaction.commandName);

    if (!command) {
      logger.warn(`Unknown context menu: ${interaction.commandName}`);
      return;
    }

    try {
      logger.info(
        `[CTX] "${interaction.commandName}" by ${interaction.user.tag} on msg ${interaction.targetMessage?.id}`
      );
      await command.execute(interaction, client);
    } catch (err) {
      logger.error(`Context menu "${interaction.commandName}" failed:`, err);

      const errorEmbed = buildErrorEmbed(
        `The action failed. *Samantha frowns at her screen.* Please try again.`
      );

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [errorEmbed] }).catch(() => {});
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true }).catch(() => {});
      }
    }
    return;
  }

  // Autocomplete (future use)
  if (interaction.isAutocomplete()) {
    const command = client.commands.get(interaction.commandName);
    if (command?.autocomplete) {
      await command.autocomplete(interaction).catch((err) => {
        logger.error('Autocomplete error:', err);
      });
    }
  }
}
