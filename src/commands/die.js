export class Die {
  constructor(fmt) {
    this.fmt = fmt;
  }

  execute({
    advantage = false,
    disadvantage = false,
    multiple = undefined,
    sides,
  }) {
    const rolls = multiple
      ? [...new Array(multiple).keys()].map(
          () => Math.floor(Math.random() * sides) + 1
        )
      : advantage ^ disadvantage
      ? [
          Math.floor(Math.random() * sides) + 1,
          Math.floor(Math.random() * sides) + 1,
        ]
      : [Math.floor(Math.random() * sides) + 1];
    const roll = multiple
      ? rolls.reduce((l, r) => l + r)
      : advantage
      ? Math.max(...rolls)
      : Math.min(...rolls);
    if (multiple) {
      return {
        roll,
        multiple: true,
        display: rolls.join(" + "),
      };
    }
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
