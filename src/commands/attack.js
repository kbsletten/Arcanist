import { Command } from "./command.js";
import { plusOrMinus, statModifier } from "../util.js";

export class Attack extends Command {
  constructor(fmt, die, libarary) {
    super();
    this.fmt = fmt;
    this.die = die;
    this.library = libarary;
  }

  arguments = [
    {
      description: "The name of the attack you want to add",
      title: "add",
      type: "string",
    },
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
    {
      description: "The name of the saved attack to use",
      title: "name",
      type: "string",
    },
  ];

  description = "Roll an attack and return the result.";

  async executeActions({
    add,
    ac,
    advantage,
    attackBonus,
    bonus,
    damage,
    disadvantage,
    modifier,
    multiple = 1,
    name,
    username,
    stat,
    userId,
  }) {
    const user = await this.library.getUser(userId);
    let [characterId, character] = await this.library.getDefaultCharacter(
      userId,
      user
    );
    if ((add || name) && !character) {
      return {
        actions: [],
        message: `You don't have a character yet. Create one with \`/character\``,
      };
    }
    if (add !== undefined) {
      character.attacks.push({
        name: add,
        attackBonus,
        bonus,
        damage,
        modifier,
        stat,
      });
      await this.library.updateCharacter(characterId, character);
      return { actions: [], message: `Added attack ${add}` };
    }
    let attackName = "attacks";
    if (name !== undefined) {
      const attack = character.attacks.find((it) =>
        it.name.toLowerCase().includes(name.toLowerCase())
      );
      if (!attack) {
        return { actions: [], message: `No attack found with name ${name}` };
      }
      if (attackBonus === undefined && attack.attackBonus !== undefined) {
        attackBonus = attack.attackBonus;
      }
      if (bonus === undefined && attack.bonus !== undefined) {
        bonus = attack.bonus;
      }
      if (damage === undefined && attack.damage !== undefined) {
        damage = attack.damage;
      }
      if (modifier === undefined && attack.modifier !== undefined) {
        modifier = attack.modifier;
      }
      if (stat === undefined && attack.stat !== undefined) {
        stat = attack.stat;
      }
      attackName = `attacks with a ${attack.name}`;
    }
    const lines = [];
    if (ac !== undefined) {
      lines.push(`${this.fmt.bold("AC")}: ${ac}`);
    }
    if (stat !== undefined) {
      if (character && modifier === undefined) {
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
      const total = roll + (modifier ?? 0) + (attackBonus ?? 0) + (bonus ?? 0);
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
      const modifiers = [plusOrMinus(modifier ?? 0)];
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
    const message = `${character?.name ?? username} ${attackName}!
${lines.join("\n")}`;
    return { actions: [], message };
  }
}
