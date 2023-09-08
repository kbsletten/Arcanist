import { Command } from "./command.js";

export class Roll extends Command {
  constructor(fmt, die) {
    super();
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
    const { display, total, error } = this.die.expr({ dice });
    if (error) {
      return error;
    }
    return `${display} = ${total}`;
  }
}
