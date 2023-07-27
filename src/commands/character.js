import { Command } from "./command.js";
import { statModifier } from "./util.js";

function mod(stat) {
  const modifier = statModifier(stat);
  return `${stat}/${modifier < 0 ? "" : "+"}${modifier}`;
}

export class Character extends Command {
  constructor(fmt, library) {
    super();
    this.fmt = fmt;
    this.library = library;
  }

  arguments = [
    {
      description: "Your character's name",
      title: "name",
      type: "string",
    },
    {
      description: "Your character's Strength score",
      title: "strength",
      type: "number",
      minimum: 3,
      maximum: 18,
    },
    {
      description: "Your character's Dexterity score",
      title: "dexterity",
      type: "number",
      minimum: 3,
      maximum: 18,
    },
    {
      description: "Your character's Constitution score",
      title: "constitution",
      type: "number",
      minimum: 3,
      maximum: 18,
    },
    {
      description: "Your character's Intelligence score",
      title: "intelligence",
      type: "number",
      minimum: 3,
      maximum: 18,
    },
    {
      description: "Your character's Wisdom score",
      title: "wisdom",
      type: "number",
      minimum: 3,
      maximum: 18,
    },
    {
      description: "Your character's Charisma score",
      title: "charisma",
      type: "number",
      minimum: 3,
      maximum: 18,
    },
  ];

  description = "View or modify your character.";

  async fromStats({ id: stats, userId }) {
    const [strength, dexterity, constitution, intelligence, wisdom, charisma] =
      stats.split(":").map((it) => parseInt(it, 10));
    const character = {
      strength,
      dexterity,
      constitution,
      intelligence,
      wisdom,
      charisma,
    };
    const user = await this.library.getUser(userId);
    const characterId = await this.library.createCharacter(userId, character);
    user.activeCharacterId = characterId;
    await this.library.updateUser(userId, user);
    return {
      actions: [],
      message: `Character created! Use /character to view or modify.`,
    };
  }

  async executeActions({
    userId,
    name,
    strength,
    dexterity,
    constitution,
    intelligence,
    wisdom,
    charisma,
  }) {
    const user = await this.library.getUser(userId);
    let [characterId, character] = await this.library.getDefaultCharacter(
      userId,
      user
    );
    if (!character) {
      return {
        actions: [],
        message: `No character found. Use /rollstats first!`,
      };
    }
    for (const [field, value] of Object.entries({
      name,
      strength,
      dexterity,
      constitution,
      intelligence,
      wisdom,
      charisma,
    })) {
      if (value !== undefined) {
        character[field] = value;
      }
    }
    await this.library.updateCharacter(characterId, character);
    return {
      actions: [],
      message: `${this.fmt.bold(character.name)}
${this.fmt.bold("STR")} ${mod(character.strength)} ${this.fmt.bold(
        "DEX"
      )} ${mod(character.dexterity)} ${this.fmt.bold("CON")} ${mod(
        character.constitution
      )}
${this.fmt.bold("INT")} ${mod(character.intelligence)} ${this.fmt.bold(
        "WIS"
      )} ${mod(character.wisdom)} ${this.fmt.bold("CHA")} ${mod(
        character.charisma
      )}`,
    };
  }
}
