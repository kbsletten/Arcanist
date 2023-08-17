import { statModifier } from "../util.js";

export class Character {
  constructor({
    ac = undefined,
    alignment = "N",
    ancestry = "Mysterious",
    background = "Stranger",
    charisma = 10,
    class: className = "Classless",
    constitution = 10,
    deity = "Godless",
    dexterity = 10,
    gear = [],
    hp = undefined,
    intelligence = 10,
    level = 0,
    luck = false,
    name = "Unnamed character",
    maxHp = undefined,
    strength = 10,
    title = "Unknown",
    wisdom = 10,
    xp = 0,
  } = {}) {
    const minHp = Math.max(1, statModifier(constitution));
    this.ac = ac ?? 10 + statModifier(dexterity);
    this.alignment = alignment;
    this.ancestry = ancestry;
    this.background = background;
    this.charisma = charisma;
    this.class = className;
    this.constitution = constitution;
    this.deity = deity;
    this.dexterity = dexterity;
    this.gear = gear.map((item) => {
      const { name = "Unknown Item", slots = 1, quantity = 1 } = item;
      return {
        ...item,
        name,
        slots,
        quantity,
      };
    });
    this.hp = hp ?? maxHp ?? minHp;
    this.intelligence = intelligence;
    this.level = level;
    this.luck = luck;
    this.maxHp = maxHp ?? minHp;
    this.name = name;
    this.strength = strength;
    this.title = title;
    this.wisdom = wisdom;
    this.xp = xp;
  }
}
