import {
  ApplicationCommandOptionType,
  Client,
  IntentsBitField,
} from "discord.js";
import { DISCORD_TOKEN } from "../secrets.js";
import { Check } from "./commands/check.js";
import { Roll } from "./commands/roll.js";
import { Die } from "./commands/die.js";
import { RollStats } from "./commands/rollstats.js";

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
};

const die = new Die(DiscordMarkdown);
const check = new Check(DiscordMarkdown, die);
const roll = new Roll(DiscordMarkdown, die);
const rollstats = new RollStats(DiscordMarkdown, die);

const commands = {
  check,
  roll,
  rollstats,
};

function jsonSchemaToDiscord(schema) {
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

export async function startup() {
  await client.login(DISCORD_TOKEN);
  console.log(`Logged in as: ${client.user.username}`);

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = commands[interaction.commandName];
    if (!command) {
      return;
    }
    const parameters = { name: interaction.user.username };
    for (const argument of command.arguments) {
      const value = interaction.options.get(
        argument.title,
        argument.required
      )?.value;
      parameters[argument.title] = value ?? argument.default;
    }
    interaction.reply(command.execute(parameters));
  });

  const commandsJson = Object.entries(commands).map(([name, command]) => ({
    name,
    description: command.description,
    options: command.arguments.map(jsonSchemaToDiscord),
  }));
  console.log(JSON.stringify(commandsJson, undefined, "\t"));
  client.application.commands.set(commandsJson);
}
