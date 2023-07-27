import { Command } from "./command.js";

export class RollStats extends Command {
  constructor(fmt, die) {
    super();
    this.fmt = fmt;
    this.die = die;
  }

  arguments = [];

  description = "Roll stats in order and return the result.";

  async executeActions({}) {
    const stats = [
      "Strength",
      "Dexterity",
      "Constitution",
      "Intelligence",
      "Wisdom",
      "Charisma",
    ].map((stat) => {
      const { roll, display } = this.die.execute({ multiple: 3, sides: 6 });
      const modifier = Math.min(4, Math.max(-4, (roll / 2 - 5) | 0));
      return {
        display: `${this.fmt.bold(stat)}: ${display} = ${roll} (${
          modifier < 0 ? "" : "+"
        }${modifier})`,
        modifier,
        roll,
        stat,
      };
    });
    return {
      actions: [
        {
          id: `character-fromStats-${stats.map((it) => it.roll).join(":")}`,
          title: "Create new character",
        },
      ],
      message: stats.map(({ display }) => display).join("\n"),
    };
  }
}
