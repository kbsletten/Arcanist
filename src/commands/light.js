import { Command } from "./command.js";

function adjustMinutes(date, minutes) {
  const newDate = new Date(date.getTime());
  newDate.setMinutes(newDate.getMinutes() + minutes);
  return newDate;
}

export class Light extends Command {
  constructor(fmt, library, events) {
    super();
    this.fmt = fmt;
    this.library = library;
    this.events = events;
    this.timers = {};
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

  burnDown({ server }) {
    if (!server.lightStart) return;
    const now = new Date();
    const started = new Date(server.lightStart);
    const elapsedMinutes = Math.floor(
      (now.getTime() - started.getTime()) / 60_000
    );
    if (elapsedMinutes === 0) return;
    server.light = Math.max(0, server.light - elapsedMinutes);
    server.lightStart = now.toISOString();
    if (server.light === 0) {
      delete server.lightStart;
    }
  }

  cancelTimers({ serverId }) {
    if (this.timers[serverId]) {
      clearTimeout(this.timers[serverId].dim);
      clearTimeout(this.timers[serverId].flicker);
      clearTimeout(this.timers[serverId].goOut);
    }
  }

  startTimers({ conversationId, serverId, server }) {
    if (!server.lightStart) return;
    this.cancelTimers({ serverId });
    const start = new Date();
    const goOut = adjustMinutes(start, server.light);
    const hasGoneOut = goOut <= start;
    const flicker = adjustMinutes(goOut, -5);
    const isFlickering = flicker <= start;
    const dim = adjustMinutes(goOut, -15);
    const isDim = dim <= start;

    this.timers[serverId] = {
      dim: isDim
        ? undefined
        : setTimeout(async () => {
            this.events.announce({
              conversationId,
              message: `${this.fmt.elapsed} The light dims. (15 minutes remain).`,
              actions: [],
            });
          }, dim.getTime() - start.getTime()),
      flicker: isFlickering
        ? undefined
        : setTimeout(async () => {
            this.events.announce({
              conversationId,
              message: `${this.fmt.elapsed} The light begins to flicker. (5 minutes remain).`,
              actions: [],
            });
          }, flicker.getTime() - start.getTime()),
      goOut: hasGoneOut
        ? undefined
        : setTimeout(async () => {
            this.events.announce({
              conversationId,
              message: `${this.fmt.elapsed} The light goes out. (0 minutes remain).`,
              actions: [],
            });
          }, goOut.getTime() - start.getTime()),
    };

    const lines = [`${this.fmt.light} Light it up!`];
    if (!isDim) {
      lines.push(`The light is bright.`);
    }
    if (isDim) {
      if (!isFlickering) {
        lines.push(`The light is dim.`);
      }
    } else {
      lines.push(
        `${server.light - 15} minute${
          server.light != 16 ? "s" : ""
        } until the light goes dim.`
      );
    }
    if (isFlickering) {
      if (!hasGoneOut) {
        lines.push(`The light is flickering.`);
      }
    } else {
      lines.push(
        `${server.light - 5} minute${
          server.light != 6 ? "s" : ""
        } until the light begins to flicker.`
      );
    }
    if (hasGoneOut) {
      lines.push(`The light has gone out.`);
    } else {
      lines.push(
        `${server.light} minute${
          server.light != 1 ? "s" : ""
        } until the light goes out.`
      );
    }

    return {
      actions: [
        {
          id: "light-stop",
          title: "Stop timer",
        },
      ],
      message: lines.join("\n"),
    };
  }

  async start({ conversationId, serverId }) {
    const server = await this.library.getServer(serverId);
    this.burnDown({ server });
    server.lightStart = new Date().toISOString();
    const msg = this.startTimers({ conversationId, serverId, server });
    await this.library.updateServer(serverId, server);
    return msg;
  }

  async stop({ serverId }) {
    const server = await this.library.getServer(serverId);
    this.burnDown({ server });
    delete server.lightStart;
    server.lightStart = new Date().toISOString();
    this.cancelTimers({ serverId });
    await this.library.updateServer(serverId, server);
    return {
      actions: [{ id: "light-start", title: "Start timer" }],
      message: `${this.fmt.darkness} Snuffed out the light.
${this.timeRemaining({ server })}`,
    };
  }

  timeRemaining({ server }) {
    const durations = [];
    if (server.light >= 60) {
      durations.push(`${Math.floor(server.light / 60)}h`);
    }
    if (server.light < 60 || server.light % 60 !== 0) {
      durations.push(`${server.light % 60}m`);
    }
    return `Time remaining: ${durations.join(" ")}`;
  }

  async executeActions({ conversationId, minutes, reset, rounds, serverId }) {
    const server = await this.library.getServer(serverId);
    this.burnDown({ server });
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
    lines.push(this.timeRemaining({ server }));
    const msg = this.startTimers({ conversationId, serverId, server });
    const actions = [];
    if (msg) {
      lines.push(msg.message);
      actions.push(...msg.actions);
    }
    await this.library.updateServer(serverId, server);
    if (!server.lightStart) {
      actions.push({
        id: "light-start",
        title: "Start timer",
      });
    }
    return {
      actions,
      message: lines.join("\n"),
    };
  }
}
