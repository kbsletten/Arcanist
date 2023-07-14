export class Light {
  constructor(fmt, library) {
    this.fmt = fmt;
    this.library = library;
  }

  arguments = [
    {
      description: "Mark a number of elapsed minutes",
      title: "minutes",
      type: "integer",
      minimum: 1,
    },
    {
      description: "Reset the timer to 1h",
      title: "reset",
      type: "boolean",
    },
    {
      description: "Mark a number of elapsed rounds (1 round = 6 minutes)",
      title: "rounds",
      type: "integer",
      minimum: 1,
    },
  ];

  description = "Manage the light counter.";

  async execute({ minutes, reset, rounds, serverId }) {
    const server = await this.library.getServer(serverId);
    const lines = [];
    if (reset) {
      server.light = 60;
      lines.push(`${this.fmt.filled} Reset light to 1h.`);
    }
    if (rounds) {
      const elapsed = rounds * 6;
      server.light = Math.max(0, server.light - elapsed);
      lines.push(`${this.fmt.elapsed} ${rounds} rounds (${elapsed} minutes)`);
    }
    if (minutes) {
      server.light = Math.max(0, server.light - minutes);
      lines.push(`${this.fmt.elapsed} ${minutes} minutes`);
    }
    const durations = [];
    if (server.light >= 60) {
      durations.push(`${Math.floor(server.light / 60)}h`);
    }
    if (server.light < 60 || server.light % 60 !== 0) {
      durations.push(`${server.light % 60}m`);
    }
    lines.push(`Time remaining: ${durations.join(" ")}`);
    await this.library.updateServer(serverId, server);
    return lines.join("\n");
  }
}
