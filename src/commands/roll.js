import { parse } from "../parsers/dicepool.gen.cjs";

export class Roll {
  constructor(fmt, die) {
    this.fmt = fmt;
    this.die = die;
  }

  arguments = [
    {
      description: "The dice to roll",
      required: true,
      title: "dice",
      type: "string",
    },
  ];

  description = "Roll dice and return the result.";

  execute({ dice }) {
    let pool = [];
    try {
      pool = parse(dice);
    } catch (e) {
      return `${this.fmt.headBandage} I'm sorry, I didn't understand your request.`;
    }

    let result = "";
    let total = 0;
    for (const expr of pool) {
      if (!expr.first) {
        result += expr.neg ? " - " : " + ";
      } else if (expr.neg) {
        result += "-";
      }
      if (expr.value) {
        result += expr.value;
        total += (expr.neg ? -1 : 1) * expr.value;
        continue;
      }
      let desc = `${expr.num}d${expr.sides}`;
      if (expr.dis) {
        desc = `dis(${desc})`;
      }
      if (expr.adv) {
        desc = `adv(${desc})`;
      }
      result += `${desc} (`;
      const results = [];
      for (let i = 0; i < expr.num; i++) {
        const { roll, multiple, display } = this.die.execute({
          sides: expr.sides,
          advantage: expr.adv,
          disadvantage: expr.dis,
        });
        results.push(multiple && expr.num > 1 ? `(${display})` : display);
        total += (expr.neg ? -1 : 1) * roll;
      }
      result += results.join(" + ");
      result += `)`;
    }
    return `${result} = ${total}`;
  }
}
