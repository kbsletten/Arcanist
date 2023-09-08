import { Library } from "../db/library.js";
import { Light } from "./light.js";

describe("light", () => {
  const library = new Library(":memory:");
  const announce = jest.fn();
  const light = new Light(
    {
      darkness: "<darkness>",
      elapsed: "<elapsed>",
      filled: "<filled>",
      light: "<light>",
    },
    library,
    {
      announce,
    }
  );
  const serverId = Math.random().toString().substring(2);
  const conversationId = Math.random().toString().substring(2);

  beforeAll(async () => {
    await library.init();
    jest.useFakeTimers();
  });

  afterAll(async () => {
    library.close();
  });

  it("returns 0 for unknown servers", async () => {
    expect(await light.execute({ serverId })).toEqual("Time remaining: 0m");
  });

  it("resets to 1h", async () => {
    expect(await light.execute({ serverId, reset: true }))
      .toEqual(`<filled> Reset light to 1h.
Time remaining: 1h`);
  });

  it("marks rounds", async () => {
    expect(await light.execute({ serverId, rounds: 2 }))
      .toEqual(`<elapsed> 2 rounds (12 minutes)
Time remaining: 48m`);
  });

  it("marks minutes", async () => {
    expect(await light.execute({ serverId, minutes: 2 }))
      .toEqual(`<elapsed> 2 minutes
Time remaining: 46m`);
  });

  it("handles multiple commands at once", async () => {
    expect(
      await light.execute({ serverId, minutes: 2, rounds: 2, reset: true })
    ).toEqual(`<filled> Reset light to 1h.
<elapsed> 2 rounds (12 minutes)
<elapsed> 2 minutes
Time remaining: 46m`);
  });

  it("has actions", async () => {
    expect(await light.executeActions({ serverId })).toEqual({
      actions: [{ id: "light-start", title: "Start timer" }],
      message: `Time remaining: 46m`,
    });
  });

  it("can start the timer", async () => {
    expect(await light.start({ conversationId, serverId })).toEqual({
      actions: [{ id: "light-stop", title: "Stop timer" }],
      message: `<light> Light it up!
The light is bright.
31 minutes until the light goes dim.
41 minutes until the light begins to flicker.
46 minutes until the light goes out.`,
    });
    await jest.advanceTimersByTimeAsync(31 * 60_000);
    expect(announce).toHaveBeenLastCalledWith({
      actions: [],
      conversationId,
      message: "<elapsed> The light dims. (15 minutes remain).",
    });
    await jest.advanceTimersByTimeAsync(10 * 60_000);
    expect(announce).toHaveBeenLastCalledWith({
      actions: [],
      conversationId,
      message: "<elapsed> The light begins to flicker. (5 minutes remain).",
    });
    await jest.advanceTimersByTimeAsync(5 * 60_000);
    expect(announce).toHaveBeenLastCalledWith({
      actions: [],
      conversationId,
      message: "<elapsed> The light goes out. (0 minutes remain).",
    });
  });

  it("can start right before going dim", async () => {
    await light.execute({ minutes: 44, serverId, reset: true });
    expect(await light.start({ conversationId, serverId })).toEqual({
      actions: [{ id: "light-stop", title: "Stop timer" }],
      message: `<light> Light it up!
The light is bright.
1 minute until the light goes dim.
11 minutes until the light begins to flicker.
16 minutes until the light goes out.`,
    });
    await jest.advanceTimersByTimeAsync(1 * 60_000);
    expect(announce).toHaveBeenLastCalledWith({
      actions: [],
      conversationId,
      message: "<elapsed> The light dims. (15 minutes remain).",
    });
    await jest.advanceTimersByTimeAsync(10 * 60_000);
    expect(announce).toHaveBeenLastCalledWith({
      actions: [],
      conversationId,
      message: "<elapsed> The light begins to flicker. (5 minutes remain).",
    });
    await jest.advanceTimersByTimeAsync(5 * 60_000);
    expect(announce).toHaveBeenLastCalledWith({
      actions: [],
      conversationId,
      message: "<elapsed> The light goes out. (0 minutes remain).",
    });
  });

  it("can start when dim", async () => {
    await light.execute({ minutes: 45, reset: true, serverId });
    expect(await light.start({ conversationId, serverId })).toEqual({
      actions: [{ id: "light-stop", title: "Stop timer" }],
      message: `<light> Light it up!
The light is dim.
10 minutes until the light begins to flicker.
15 minutes until the light goes out.`,
    });
    await jest.advanceTimersByTimeAsync(10 * 60_000);
    expect(announce).toHaveBeenLastCalledWith({
      actions: [],
      conversationId,
      message: "<elapsed> The light begins to flicker. (5 minutes remain).",
    });
    await jest.advanceTimersByTimeAsync(5 * 60_000);
    expect(announce).toHaveBeenLastCalledWith({
      actions: [],
      conversationId,
      message: "<elapsed> The light goes out. (0 minutes remain).",
    });
  });

  it("can start right before flickering", async () => {
    await light.execute({ minutes: 54, reset: true, serverId });
    expect(await light.start({ conversationId, serverId })).toEqual({
      actions: [{ id: "light-stop", title: "Stop timer" }],
      message: `<light> Light it up!
The light is dim.
1 minute until the light begins to flicker.
6 minutes until the light goes out.`,
    });
    await jest.advanceTimersByTimeAsync(1 * 60_000);
    expect(announce).toHaveBeenLastCalledWith({
      actions: [],
      conversationId,
      message: "<elapsed> The light begins to flicker. (5 minutes remain).",
    });
    await jest.advanceTimersByTimeAsync(5 * 60_000);
    expect(announce).toHaveBeenLastCalledWith({
      actions: [],
      conversationId,
      message: "<elapsed> The light goes out. (0 minutes remain).",
    });
  });

  it("can start when flickering", async () => {
    await light.execute({ minutes: 55, reset: true, serverId });
    expect(await light.start({ conversationId, serverId })).toEqual({
      actions: [{ id: "light-stop", title: "Stop timer" }],
      message: `<light> Light it up!
The light is flickering.
5 minutes until the light goes out.`,
    });
    await jest.advanceTimersByTimeAsync(5 * 60_000);
    expect(announce).toHaveBeenLastCalledWith({
      actions: [],
      conversationId,
      message: "<elapsed> The light goes out. (0 minutes remain).",
    });
  });

  it("can start right before going out", async () => {
    await light.execute({ minutes: 59, reset: true, serverId });
    expect(await light.start({ conversationId, serverId })).toEqual({
      actions: [{ id: "light-stop", title: "Stop timer" }],
      message: `<light> Light it up!
The light is flickering.
1 minute until the light goes out.`,
    });
    await jest.advanceTimersByTimeAsync(1 * 60_000);
    expect(announce).toHaveBeenLastCalledWith({
      actions: [],
      conversationId,
      message: "<elapsed> The light goes out. (0 minutes remain).",
    });
  });

  it("can start when burned out", async () => {
    await light.execute({ minutes: 60, reset: true, serverId });
    expect(await light.start({ conversationId, serverId })).toEqual({
      actions: [{ id: "light-stop", title: "Stop timer" }],
      message: `<light> Light it up!
The light has gone out.`,
    });
  });

  it("will restart servers after minor modifications", async () => {
    await light.execute({ reset: true, serverId });
    expect(await light.start({ conversationId, serverId })).toEqual({
      actions: [{ id: "light-stop", title: "Stop timer" }],
      message: `<light> Light it up!
The light is bright.
45 minutes until the light goes dim.
55 minutes until the light begins to flicker.
60 minutes until the light goes out.`,
    });
    await light.execute({ conversationId, minutes: 30, serverId });
    await jest.advanceTimersByTimeAsync(15 * 60_000);
    expect(announce).toHaveBeenLastCalledWith({
      conversationId,
      actions: [],
      message: "<elapsed> The light dims. (15 minutes remain).",
    });
    expect(await light.execute({ conversationId, minutes: 30, serverId }))
      .toEqual(`<elapsed> 30 minutes
Time remaining: 0m
<light> Light it up!
The light has gone out.`);
  });

  it("can stop the timer", async () => {
    await light.execute({ reset: true, serverId });
    expect(await light.start({ conversationId, serverId })).toEqual({
      actions: [{ id: "light-stop", title: "Stop timer" }],
      message: `<light> Light it up!
The light is bright.
45 minutes until the light goes dim.
55 minutes until the light begins to flicker.
60 minutes until the light goes out.`,
    });
    await jest.advanceTimersByTimeAsync(15 * 60_000);
    expect(await light.stop({ serverId })).toEqual({
      actions: [{ id: "light-start", title: "Start timer" }],
      message: `<darkness> Snuffed out the light.
Time remaining: 45m`,
    });
    await jest.advanceTimersByTimeAsync(45 * 60_000);
    expect(announce).not.toHaveBeenCalled();
  });
});
