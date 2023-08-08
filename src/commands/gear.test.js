import { Die } from "./die";
import { Character } from "./character";
import { Gear } from "./gear";
import { Library } from "../db/library";

describe("gear", () => {
  const library = new Library(":memory:");
  const fmt = { bold: (t) => `*${t}*`, strike: (t) => `~${t}~` };
  const character = new Character(fmt, library);
  const mathRandom = jest.spyOn(Math, "random");
  const die = new Die(fmt);
  const gear = new Gear(fmt, library, die);
  const userId = Math.random().toString().substring(2);
  const secondUserId = Math.random().toString().substring(2);

  beforeAll(async () => {
    await library.init();
  });

  it(`returns an error message when there's no active character`, async () => {
    expect(await gear.executeActions({ userId })).toEqual({
      actions: [],
      message: "No character found. Use /rollstats first!",
    });
  });

  it(`suggests adding starting gear for level 0 characters`, async () => {
    await character.fromStats({ id: "8:10:12:13:14:15", userId });
    expect(await gear.executeActions({ userId })).toEqual({
      actions: [{ id: "gear-starting", title: "Roll starting gear" }],
      message: `*Unnamed character's gear*
Slots: 0/10`,
    });
  });

  it(`rolls for starting gear`, async () => {
    mathRandom
      .mockReturnValueOnce(0.9)
      .mockReturnValueOnce(0.0)
      .mockReturnValueOnce(0.3)
      .mockReturnValueOnce(0.4)
      .mockReturnValueOnce(0.65);
    expect(await gear.starting({ userId })).toEqual({
      actions: [],
      message: `*Rolling starting gear for Unnamed character*
4 item(s)
1; Torch
4; Shortbow and Arrows
5; Rope, 60'
8; Iron spikes`,
    });
  });

  it(`allows adding gear by name`, async () => {
    expect(await gear.executeActions({ add: "Pole", userId })).toEqual({
      actions: [],
      message: `*Unnamed character's gear*
 - Torch
 - Shortbow
 - Arrows x5
 - Rope, 60'
 - Iron spikes x10
 - Pole
Slots: 6/10`,
    });
  });

  it(`allows adding gear that take up multiple slots`, async () => {
    expect(
      await gear.executeActions({ add: "Longer Pole", slots: 2, userId })
    ).toEqual({
      actions: [],
      message: `*Unnamed character's gear*
 - Torch
 - Shortbow
 - Arrows x5
 - Rope, 60'
 - Iron spikes x10
 - Pole
 - Longer Pole (2)
Slots: 8/10`,
    });
  });

  it(`warns you when you try to edit a nonexistent item`, async () => {
    expect(await gear.execute({ edit: "Vorpal", slots: 2, userId })).toEqual(
      `Unable to find gear to edit: Vorpal`
    );
  });

  it(`warns you when you try to an ambiguous item`, async () => {
    expect(await gear.execute({ edit: "Pole", slots: 2, userId })).toEqual(
      `Found multiple items to edit: Pole (found Pole and Longer Pole)`
    );
  });

  it(`allows you to edit the quantity of an item`, async () => {
    expect(
      await gear.execute({ edit: "Arrows", quantity: 10, userId })
    ).toEqual(
      `*Unnamed character's gear*
 - Torch
 - Shortbow
 - Arrows x10
 - Rope, 60'
 - Iron spikes x10
 - Pole
 - Longer Pole (2)
Slots: 8/10`
    );
  });

  it(`allows you to edit the slots of an item`, async () => {
    expect(
      await gear.execute({ edit: "Longer Pole", slots: 1, userId })
    ).toEqual(
      `*Unnamed character's gear*
 - Torch
 - Shortbow
 - Arrows x10
 - Rope, 60'
 - Iron spikes x10
 - Pole
 - Longer Pole
Slots: 7/10`
    );
  });

  it(`allows you to edit the name of an item`, async () => {
    expect(
      await gear.execute({ edit: "Longer Pole", name: "Fishing pole", userId })
    ).toEqual(
      `*Unnamed character's gear*
 - Torch
 - Shortbow
 - Arrows x10
 - Rope, 60'
 - Iron spikes x10
 - Pole
 - Fishing pole
Slots: 7/10`
    );
  });

  it(`suggests adding a crawling kit for level 1 characters`, async () => {
    await character.fromStats({ id: "8:10:12:13:14:15", userId: secondUserId });
    await character.execute({ level: 1, userId: secondUserId });
    expect(await gear.executeActions({ userId: secondUserId })).toEqual({
      actions: [{ id: "gear-crawling", title: "Add crawling kit" }],
      message: `*Unnamed character's gear*
Slots: 0/10`,
    });
  });

  it(`adds crawling kit`, async () => {
    expect(await gear.crawling({ userId: secondUserId })).toEqual({
      actions: [],
      message: `*Adding crawling kit*
 - Flint and steel
 - Torch
 - Torch
 - Rations x3
 - Iron spikes x10
 - Grappling hook
 - Rope, 60'`,
    });
  });
});
