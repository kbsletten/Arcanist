import { Command } from "./command.js";

export class Die extends Command {
  constructor(fmt, random) {
    super();
    this.fmt = fmt;
    this.random = random;
  }

  execute({
    advantage = false,
    disadvantage = false,
    multiple = undefined,
    sides,
  }) {
    const rolls = multiple
      ? [...new Array(multiple).keys()].map(() => this.random.randomInt(sides))
      : advantage ^ disadvantage
      ? [this.random.randomInt(sides), this.random.randomInt(sides)]
      : [this.random.randomInt(sides)];
    if (multiple) {
      return {
        roll: rolls.reduce((l, r) => l + r),
        multiple: true,
        display: rolls.join(" + "),
      };
    }
    const roll = advantage ? Math.max(...rolls) : Math.min(...rolls);
    const rollIndex = rolls.indexOf(roll);
    return {
      roll,
      multiple: rolls.length > 1,
      display: rolls
        .map((roll, index) =>
          index == rollIndex ? roll : this.fmt.strike(roll)
        )
        .join(", "),
    };
  }
}
