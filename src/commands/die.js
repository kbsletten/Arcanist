import { parse } from "../parsers/dicepool.gen.cjs";
export class Die {
  constructor(fmt, random) {
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

  expr({ dice, double = false }) {
    let pool = [];
    try {
      pool = parse(dice);
    } catch (e) {
      return {
        error: `${this.fmt.headBandage} I'm sorry, I didn't understand your request.`,
      };
    }

    let display = "";
    let total = 0;
    for (const expr of pool) {
      if (!expr.first) {
        display += expr.neg ? " - " : " + ";
      } else if (expr.neg) {
        display += "-";
      }
      if (expr.value) {
        display += expr.value;
        total += (expr.neg ? -1 : 1) * expr.value;
        continue;
      }
      let num = expr.num;
      if (double) {
        num *= 2;
      }
      let desc = `${num}d${expr.sides}`;
      if (expr.dis) {
        desc = `dis(${desc})`;
      }
      if (expr.adv) {
        desc = `adv(${desc})`;
      }
      const results = [];
      for (let i = 0; i < num; i++) {
        const { roll, multiple, display } = this.execute({
          sides: expr.sides,
          advantage: expr.adv,
          disadvantage: expr.dis,
        });
        results.push(multiple && num > 1 ? `(${display})` : display);
        total += (expr.neg ? -1 : 1) * roll;
      }
      display += `${desc} (${results.join(" + ")})`;
    }
    return { display, total };
  }
}
