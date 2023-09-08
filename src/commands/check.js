import { Command } from "./command.js";
import { statModifier } from "../util.js";

export class Check extends Command {
  constructor(fmt, die, libarary) {
    super();
    this.fmt = fmt;
    this.die = die;
    this.library = libarary;
  }

  arguments = [
    {
      description: "The modifier to add to the roll",
      title: "modifier",
      type: "integer",
    },
    {
      description: "The difficulty class of the check",
      title: "dc",
      type: "integer",
    },
    {
      description: "The stat associated with the check",
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
      description: "Whether or not the check has advantage",
      title: "advantage",
      type: "boolean",
    },
    {
      description: "Whether or not the check has disadvantage",
      title: "disadvantage",
      type: "boolean",
    },
    {
      description: "The number of times to roll the check",
      minimum: 1,
      title: "multiple",
      type: "integer",
    },
  ];

  description = "Roll a check and return the result.";

  async reroll({ id: parameters, userId, ...rest }) {
    const user = await this.library.getUser(userId);
    let [characterId, character] = await this.library.getDefaultCharacter(
      userId,
      user
    );
    if (character) {
      character.luck = false;
      await this.library.updateCharacter(characterId, character);
    }
    const {
      a: advantage,
      d: dc,
      e: disadvantage,
      m: modifier,
      n: multiple,
      s: stat,
    } = Object.fromEntries(parameters.split(";").map((p) => p.split(":", 2)));
    return await this.executeActions({
      ...rest,
      advantage: !advantage ? undefined : advantage === "true",
      dc: !dc ? undefined : parseInt(dc, 10),
      disadvantage: !disadvantage ? undefined : disadvantage === "true",
      modifier: !modifier ? undefined : parseInt(modifier, 10),
      multiple: !multiple ? undefined : parseInt(multiple, 10),
      stat,
      userId,
    });
  }

  async executeActions({
    advantage,
    dc,
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
    let difficulty = "";
    if (dc !== undefined) {
      difficulty = `DC ${dc} `;
    }
    let check = "check";
    if (stat !== undefined) {
      check = `${stat} check`;
      if (character && !modifier) {
        modifier = statModifier(character[stat.toLowerCase()]);
      }
    }
    let successes = 0;
    for (let i = 0; i < multiple; i++) {
      const { roll, display } = this.die.execute({
        sides: 20,
        advantage,
        disadvantage,
      });
      const total = roll + modifier;
      let result = "";
      if (roll === 20) {
        result = `; ${this.fmt.bold("CRIT!")}`;
        successes++;
      } else if (roll === 1) {
        result = `; ${this.fmt.bold("FUMBLE!")}`;
      } else if (dc !== undefined) {
        if (total >= dc) {
          result = `; ${this.fmt.bold("Success!")}`;
          successes++;
        } else {
          result = `; ${this.fmt.bold("Failure")}`;
        }
      }
      lines.push(`1d20 (${display}) + ${modifier} = ${total}${result}`);
    }
    if (dc !== undefined && multiple > 1) {
      lines.push(`Successes: ${successes}/${multiple}`);
    }
    const actions = [];
    if (character?.luck) {
      const props = {
        a: advantage,
        d: dc,
        e: disadvantage,
        m: modifier,
        n: multiple,
        s: stat,
      };
      const id = Object.entries(props)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${k}:${v}`)
        .join(";");
      actions.push({
        id: `check-reroll-${id}`,
        title: `Reroll`,
      });
    }
    const message = `${
      character?.name ?? username
    } attempts a ${difficulty}${check}!
${lines.join("\n")}`;
    return { actions, message };
  }
}
