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
import { Character } from "./commands/character.js";
import { Hp } from "./commands/hp.js";

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
  bold: (text) => `**${text}**`,
  darkness: `:wind_blowing_face:`,
  elapsed: `:hourglass:`,
  filled: `:hourglass_flowing_sand:`,
  headBandage: `:head_bandage:`,
  italics: (text) => `_${text}_`,
  light: `:candle:`,
  luck: `:sparkles:`,
  strike: (text) => `~~${text}~~`,
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
const check = new Check(DiscordMarkdown, die, library);
const roll = new Roll(DiscordMarkdown, die);
const rollstats = new RollStats(DiscordMarkdown, die);
const light = new Light(DiscordMarkdown, library, DiscordEvents);
const character = new Character(DiscordMarkdown, library);
const hp = new Hp(library);

library.init().catch(console.error);

const commands = {
  character,
  check,
  light,
  roll,
  rollstats,
  hp,
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
      conversationId: interaction.channelId,
      id,
      serverId: interaction.guildId,
      userId: interaction.user?.id,
      username: interaction.user.username,
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
      conversationId: interaction.channelId,
      serverId: interaction.guildId,
      userId: interaction.user?.id,
      username: interaction.user.username,
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
