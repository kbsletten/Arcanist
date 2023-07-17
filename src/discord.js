import {
  ApplicationCommandOptionType,
  ButtonStyle,
  ComponentType,
  Client,
  IntentsBitField,
} from "discord.js";
import { DISCORD_TOKEN } from "../secrets.js";
import { Check } from "./commands/check.js";
import { Roll } from "./commands/roll.js";
import { Die } from "./commands/die.js";
import { RollStats } from "./commands/rollstats.js";
import { Light } from "./commands/light.js";
import { Library } from "./db/library.js";

function mapOption(schema) {
  const TYPES = {
    integer: ApplicationCommandOptionType.Integer,
    string: ApplicationCommandOptionType.String,
    boolean: ApplicationCommandOptionType.Boolean,
    number: ApplicationCommandOptionType.Number,
  };

  return {
    choices: schema.enum?.map((it) => ({ name: it, value: it })),
    description: schema.description,
    min_value: schema.minimum,
    max_value: schema.maximum,
    name: schema.title,
    // NOTE: not real JSON Schema, but that's OK
    required: schema.required,
    type: TYPES[schema.type],
  };
}

function mapActions(actions) {
  if (!actions?.length) return;
  return [
    {
      type: ComponentType.ActionRow,
      components: actions.map((action) => ({
        type: ComponentType.Button,
        customId: action.id,
        label: action.title,
        style: ButtonStyle.Primary,
      })),
    },
  ];
}

const client = new Client({ intents: [IntentsBitField.Flags.Guilds] });

const DiscordMarkdown = {
  bold: function (text) {
    return `**${text}**`;
  },
  italics: function (text) {
    return `_${text}_`;
  },
  strike: function (text) {
    return `~~${text}~~`;
  },
  headBandage: `:head_bandage:`,
  light: `:candle:`,
  filled: `:hourglass_flowing_sand:`,
  elapsed: `:hourglass:`,
  darkness: `:wind_blowing_face:`,
};

const DiscordEvents = {
  announce: async ({ conversationId, message, actions }) => {
    const channel = await client.channels.fetch(conversationId);
    if (!channel) return;
    const components = mapActions(actions);
    await channel.send({
      content: message,
      components,
    });
  },
};

const library = new Library();
const die = new Die(DiscordMarkdown);
const check = new Check(DiscordMarkdown, die);
const roll = new Roll(DiscordMarkdown, die);
const rollstats = new RollStats(DiscordMarkdown, die);
const light = new Light(DiscordMarkdown, library, DiscordEvents);

library.init().catch(console.error);

const commands = {
  check,
  roll,
  rollstats,
  light,
};

export async function startup() {
  await client.login(DISCORD_TOKEN);
  console.log(`Logged in as: ${client.user.username}`);

  client.on("interactionCreate", async (interaction) => {
    if (interaction.isChatInputCommand()) return;

    const [commandName, method, id] = interaction.customId.split("-", 3);

    const command = commands[commandName];
    if (!command) {
      return;
    }
    const parameters = {
      id,
      name: interaction.user.username,
      serverId: interaction.guildId,
      conversationId: interaction.channelId,
    };
    const { actions, message } = await command[method]?.(parameters);
    const components = mapActions(actions);
    await interaction.reply({
      content: message,
      components,
    });
  });

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = commands[interaction.commandName];
    if (!command) {
      return;
    }
    const parameters = {
      name: interaction.user.username,
      serverId: interaction.guildId,
      conversationId: interaction.channelId,
    };
    for (const argument of command.arguments) {
      const value = interaction.options.get(
        argument.title,
        argument.required
      )?.value;
      parameters[argument.title] = value;
    }
    const { actions, message } = await command.executeActions(parameters);
    const components = mapActions(actions);
    await interaction.reply({
      content: message,
      components,
    });
  });

  const commandsJson = Object.entries(commands).map(([name, command]) => ({
    name,
    description: command.description,
    options: command.arguments.map(mapOption),
  }));
  console.log(JSON.stringify(commandsJson, undefined, "\t"));
  await client.application.commands.set(commandsJson);
}
