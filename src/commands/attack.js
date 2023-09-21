import { Command } from "./command.js";
import { plusOrMinus, statModifier, findByName } from "../util.js";

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
      description: "The name of the saved attack to edit",
      title: "edit",
      type: "string",
    },
    {
      description: "The name of the saved attack to remove",
      title: "remove",
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
    {
      description: "List your saved attacks",
      title: "list",
      type: "boolean",
    },
  ];

  description = "Roll an attack and return the result.";

  async add({ id: attack, userId }) {
    const [name, damage, stat] = attack.split(":");
    return await this.executeActions({ add: name, damage, stat, userId });
  }

  listAttacks(character, lines = []) {
    if (character.attacks.length === 0) {
      lines.push("No attacks saved");
    } else {
      for (const attack of character.attacks) {
        lines.push(
          `${attack.name}: ${attack.damage} (${attack.stat ?? "none"})`
        );
      }
    }
    return {
      actions: [],
      message: [this.fmt.bold(`${character.name}'s attacks:`), ...lines].join(
        "\n"
      ),
    };
  }

  async executeActions({
    add,
    ac,
    advantage,
    attackBonus,
    bonus,
    damage,
    disadvantage,
    edit,
    list = false,
    modifier,
    multiple = 1,
    name,
    username,
    remove,
    stat,
    userId,
  }) {
    const user = await this.library.getUser(userId);
    let [characterId, character] = await this.library.getDefaultCharacter(
      userId,
      user
    );
    const lines = [];
    if ((add || name || edit || remove || list) && !character) {
      return {
        actions: [],
        message: `You don't have a character yet. Create one with \`/character\``,
      };
    }
    if (add) {
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
    if (edit) {
      const attacks = findByName(edit, character.attacks);
      if (attacks.length === 0) {
        return {
          actions: [],
          message: `Unable to find attack to edit: ${edit}`,
        };
      } else if (attacks.length > 1) {
        return {
          actions: [],
          message: `Found multiple attacks to edit: ${edit} (found ${attacks
            .map((it) => it.name)
            .join(" and ")})`,
        };
      }
      attacks[0].name = name ?? attacks[0].name;
      attacks[0].attackBonus = attackBonus ?? attacks[0].attackBonus;
      attacks[0].bonus = bonus ?? attacks[0].bonus;
      attacks[0].damage = damage ?? attacks[0].damage;
      attacks[0].modifier = modifier ?? attacks[0].modifier;
      lines.push(`Edited ${attacks[0].name}`);
      await this.library.updateCharacter(characterId, character);
      return this.listAttacks(character, lines);
    }
    if (remove) {
      const attacks = findByName(remove, character.attacks);
      if (attacks.length === 0) {
        return {
          actions: [],
          message: `Unable to find attack to remove: ${remove}`,
        };
      } else if (attacks.length > 1) {
        return {
          actions: [],
          message: `Found multiple attacks to remove: ${remove} (found ${attacks
            .map((it) => it.name)
            .join(" and ")})`,
        };
      }
      character.attacks = character.attacks.filter((it) => it !== attacks[0]);
      lines.push(`Removed ${attacks[0].name}`);
      await this.library.updateCharacter(characterId, character);
      return this.listAttacks(character, lines);
    }
    if (list) {
      return this.listAttacks(character);
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
