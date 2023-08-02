import { Command } from "./command.js";
import { statModifier } from "../util.js";

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
      description: "Your character's ancestry",
      title: "ancestry",
      type: "string",
    },
    {
      description: "Your character's background",
      title: "background",
      type: "string",
    },
    {
      description: "Your character's class",
      title: "class",
      type: "string",
    },
    {
      description: "Your character's title",
      title: "title",
      type: "string",
    },
    {
      description: "Your character's alignment",
      title: "alignment",
      type: "string",
      enum: ["C", "N", "L"],
    },
    {
      description: "Your character's deity",
      title: "deity",
      type: "string",
    },
    {
      description: "Your character's maximum Hit Points",
      title: "maxhp",
      type: "number",
      minimum: 1,
    },
    {
      description: "Your character's current Hit Points",
      title: "hp",
      type: "number",
      minimum: 0,
    },
    {
      description: "Your character's Armor Class",
      title: "ac",
      type: "number"
    },
    {
      description: "Your character's level",
      title: "level",
      type: "number",
      minimum: 0,
      maximum: 10,
    },
    {
      description: "Your character's xp",
      title: "xp",
      type: "number",
      minimum: 0,
      maximum: 100,
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
    ac,
    alignment,
    ancestry,
    background,
    charisma,
    class: className,
    constitution,
    deity,
    dexterity,
    hp,
    intelligence,
    maxhp: maxHp,
    name,
    level,
    strength,
    title,
    userId,
    wisdom,
    xp,
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
      ac,
      alignment,
      ancestry,
      background,
      charisma,
      className,
      constitution,
      deity,
      dexterity,
      hp,
      intelligence,
      level,
      maxHp,
      name,
      strength,
      title,
      wisdom,
      xp
    })) {
      if (value !== undefined) {
        character[field] = value;
      }
    }
    if (character.hp > character.maxHp) {
      character.hp = character.maxHp;
    }
    await this.library.updateCharacter(characterId, character);
    return {
      actions: [],
      message: `${this.fmt.bold(character.name)}
${this.fmt.bold("LV")} ${character.level} ${character.title} ${
        character.className
      } ${this.fmt.bold("XP")} ${character.xp}/${character.level * 10}
${this.fmt.bold("Ancestry")} ${character.ancestry} ${this.fmt.bold(
        "Background"
      )} ${character.background}
${this.fmt.bold("Alignment")} ${character.alignment} (${character.deity})
${this.fmt.bold("HP")} ${character.hp}/${character.maxHp} ${this.fmt.bold(
        "AC"
      )} ${character.ac}
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
