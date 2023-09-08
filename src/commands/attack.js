import { Command } from "./command";
import { plusOrMinus, statModifier } from "../util";

export class Attack extends Command {
  constructor(fmt, die, libarary) {
    super();
    this.fmt = fmt;
    this.die = die;
    this.library = libarary;
  }

  arguments = [
    {
      description: "The modifier to add to the attack roll",
      title: "modifier",
      type: "integer",
    },
    {
      description: "The bonus to the attack rolls",
      title: "attackBonus",
      type: "integer",
    },
    {
      description: "The bonus to the attack and damage rolls",
      title: "bonus",
      type: "integer",
    },
    {
      description: "The damage dice to roll",
      title: "damage",
      type: "string",
    },
    {
      description: "The armor class of to hit",
      title: "ac",
      type: "integer",
    },
    {
      description: "The stat associated with the attack",
      enum: [
        "Strength",
        "Dexterity",
        "Constitution",
        "Intelligence",
        "Wisdom",
        "Charisma",
      ],
      title: "stat",
      type: "string",
    },
    {
      description: "Whether or not the attack has advantage",
      title: "advantage",
      type: "boolean",
    },
    {
      description: "Whether or not the attack has disadvantage",
      title: "disadvantage",
      type: "boolean",
    },
    {
      description: "The number of times to roll the attack",
      minimum: 1,
      title: "multiple",
      type: "integer",
    },
  ];

  description = "Roll an attack and return the result.";

  async executeActions({
    ac,
    advantage,
    attackBonus,
    bonus,
    damage,
    disadvantage,
    modifier = 0,
    multiple = 1,
    username,
    stat,
    userId,
  }) {
    const user = await this.library.getUser(userId);
    let [, character] = await this.library.getDefaultCharacter(userId, user);
    const lines = [];
    if (ac !== undefined) {
      lines.push(`${this.fmt.bold("AC")}: ${ac}`);
    }
    if (stat !== undefined) {
      if (character && !modifier) {
        modifier = statModifier(character[stat.toLowerCase()]);
      }
    }
    let successes = 0;
    let totalDamage = 0;
    for (let i = 0; i < multiple; i++) {
      const { roll, display } = this.die.execute({
        sides: 20,
        advantage,
        disadvantage,
      });
      const total = roll + modifier + (attackBonus ?? 0) + (bonus ?? 0);
      let result = "";
      let hit = false;
      let crit = false;
      if (roll === 20) {
        result = `; ${this.fmt.bold("CRIT!")}`;
        hit = true;
        crit = true;
      } else if (roll === 1) {
        result = `; ${this.fmt.bold("FUMBLE!")}`;
      } else if (ac !== undefined) {
        if (total >= ac) {
          result = `; ${this.fmt.bold("Hit!")}`;
          hit = true;
        } else {
          result = `; ${this.fmt.bold("Miss")}`;
        }
      } else {
        hit = true;
      }
      const modifiers = [plusOrMinus(modifier)];
      if (attackBonus !== undefined) {
        modifiers.push(plusOrMinus(attackBonus));
      }
      if (bonus !== undefined) {
        modifiers.push(plusOrMinus(bonus));
      }
      lines.push(
        `To Hit: 1d20 (${display})${modifiers
          .map((m) => ` ${m}`)
          .join("")} = ${total}${result}`
      );
      if (hit) {
        successes++;
        const damageResult = this.die.expr({ dice: damage, double: crit });
        if (damageResult.error) {
          continue;
        }
        let { display: damageDisplay, total: damageRoll } = damageResult;
        if (bonus !== undefined) {
          damageDisplay = `${damageDisplay} ${plusOrMinus(bonus)}`;
          damageRoll = damageRoll + bonus;
        }
        lines.push(`Damage: ${damageDisplay} = ${damageRoll}`);
        totalDamage += damageRoll;
      }
    }
    const message = `${character?.name ?? username} attacks!
${lines.join("\n")}`;
    return { actions: [], message };
  }
}
