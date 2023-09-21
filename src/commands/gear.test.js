import { Die } from "./die.js";
import { Character } from "./character.js";
import { Gear } from "./gear.js";
import { Attack } from "./attack.js";
import { Library } from "../db/library.js";
import { MockRandom } from "../mocks/random.js";

describe("gear", () => {
  const library = new Library(":memory:");
  const fmt = { bold: (t) => `*${t}*`, strike: (t) => `~${t}~` };
  const character = new Character(fmt, library);
  const mockRandom = new MockRandom();
  const die = new Die(fmt, mockRandom);
  const gear = new Gear(fmt, library, die);
  const attack = new Attack(fmt, die, library);
  let userId = Math.random().toString().substring(2);

  beforeAll(async () => {
    await library.init();
    await mockRandom.load();
  });

  afterAll(async () => {
    await mockRandom.save();
    await library.close();
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
    expect(await gear.starting({ userId })).toEqual({
      actions: [],
      message: `*Rolling starting gear for Unnamed character*
1d4 (4) = 4 item(s)
1d12 (1) = 1; Torch
1d12 (4) = 4; Shortbow and Arrows
1d12 (5) = 5; Rope, 60'
1d12 (8) = 8; Iron spikes`,
    });
  });

  it(`allows adding gear by name`, async () => {
    expect(await gear.executeActions({ add: "Pole", userId })).toEqual({
      actions: [
        {
          id: "attack-add-Shortbow:1d4:Dexterity",
          title: "Equip Shortbow",
        },
      ],
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
      actions: [
        {
          id: "attack-add-Shortbow:1d4:Dexterity",
          title: "Equip Shortbow",
        },
      ],
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

  it(`warns you when you try to remove a nonexistent item`, async () => {
    expect(await gear.execute({ remove: "Vorpal", userId })).toEqual(
      `Unable to find gear to remove: Vorpal`
    );
  });

  it(`warns you when you try to edit an ambiguous item`, async () => {
    expect(await gear.execute({ edit: "Pol", slots: 2, userId })).toEqual(
      `Found multiple items to edit: Pol (found Pole and Longer Pole)`
    );
  });

  it(`warns you when you try to remove an ambiguous item`, async () => {
    expect(await gear.execute({ remove: "Pol", userId })).toEqual(
      `Found multiple items to remove: Pol (found Pole and Longer Pole)`
    );
  });

  it(`allows you to edit the quantity of an item`, async () => {
    expect(
      await gear.execute({ edit: "Arrows", quantity: 10, userId })
    ).toEqual(
      `*Unnamed character's gear*
Edited Arrows
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
Edited Longer Pole
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
Edited Fishing pole
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

  it(`allows you to remove an item`, async () => {
    expect(await gear.execute({ remove: "Torch", userId })).toEqual(
      `*Unnamed character's gear*
Removed Torch
- Shortbow
- Arrows x10
- Rope, 60'
- Iron spikes x10
- Pole
- Fishing pole
Slots: 6/10`
    );
  });

  it(`suggests adding a crawling kit for level 1 characters`, async () => {
    userId = Math.random().toString().substring(2);
    await character.fromStats({ id: "8:10:12:13:14:15", userId });
    await character.execute({ level: 1, userId });
    expect(await gear.executeActions({ userId })).toEqual({
      actions: [{ id: "gear-crawling", title: "Add crawling kit" }],
      message: `*Unnamed character's gear*
Slots: 0/10`,
    });
  });

  it(`adds crawling kit`, async () => {
    expect(await gear.crawling({ userId })).toEqual({
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

  it(`prompts equipping armor and shield`, async () => {
    userId = Math.random().toString().substring(2);
    await character.fromStats({ id: "8:10:12:13:14:15", userId });
    await gear.execute({ add: "Leather armor", userId });
    await gear.execute({ add: "Chainmail", userId });
    await gear.execute({ add: "Plate mail", userId });
    expect(await gear.executeActions({ add: "Shield", userId })).toEqual({
      actions: [
        {
          id: "character-update-ac:11",
          title: "Equip Leather armor",
        },
        {
          id: "character-update-ac:13",
          title: "Equip Leather armor + Shield",
        },
        {
          id: "character-update-ac:13",
          title: "Equip Chainmail",
        },
        {
          id: "character-update-ac:15",
          title: "Equip Chainmail + Shield",
        },
        {
          id: "character-update-ac:15",
          title: "Equip Plate mail",
        },
        {
          id: "character-update-ac:17",
          title: "Equip Plate mail + Shield",
        },
      ],
      message: `*Unnamed character's gear*
- Leather armor
- Chainmail
- Plate mail
- Shield
Slots: 4/10`,
    });
  });

  it(`allows equipping armor and shield`, async () => {
    expect(await character.update({ id: "ac:15", userId })).toEqual({
      actions: [],
      message: `Updated Unnamed character's AC: 15`,
    });
    expect(await gear.executeActions({ userId })).toEqual({
      actions: [
        {
          id: "character-update-ac:11",
          title: "Equip Leather armor",
        },
        {
          id: "character-update-ac:13",
          title: "Equip Leather armor + Shield",
        },
        {
          id: "character-update-ac:13",
          title: "Equip Chainmail",
        },
        {
          id: "character-update-ac:17",
          title: "Equip Plate mail + Shield",
        },
      ],
      message: `*Unnamed character's gear*
- Leather armor
- Chainmail
- Plate mail
- Shield
Slots: 4/10`,
    });
  });

  it(`prompts equipping weapons`, async () => {
    await character.fromStats({ id: "8:10:12:13:14:15", userId });
    await gear.execute({ add: "Shortsword", userId });
    await gear.execute({ add: "Bastard sword", userId });
    await gear.execute({ add: "Dagger", userId });
    expect(await gear.executeActions({ userId })).toEqual({
      actions: [
        {
          id: "attack-add-Shortsword:1d6:Strength",
          title: "Equip Shortsword",
        },
        {
          id: "attack-add-Bastard sword (1H):1d8:Strength",
          title: "Equip Bastard sword (1H)",
        },
        {
          id: "attack-add-Bastard sword (2H):1d10:Strength",
          title: "Equip Bastard sword (2H)",
        },
        {
          id: "attack-add-Dagger (Strength):1d4:Strength",
          title: "Equip Dagger (Strength)",
        },
        {
          id: "attack-add-Dagger (Dexterity):1d4:Dexterity",
          title: "Equip Dagger (Dexterity)",
        },
      ],
      message: `*Unnamed character's gear*
- Shortsword
- Bastard sword
- Dagger
Slots: 3/10`,
    });
    expect(
      await attack.add({ id: "Bastard sword (2H):1d10:Strength", userId })
    ).toEqual({
      actions: [],
      message: `Added attack Bastard sword (2H)`,
    });
    expect(await gear.executeActions({ userId })).toEqual({
      actions: [
        {
          id: "attack-add-Shortsword:1d6:Strength",
          title: "Equip Shortsword",
        },
        {
          id: "attack-add-Bastard sword (1H):1d8:Strength",
          title: "Equip Bastard sword (1H)",
        },
        {
          id: "attack-add-Dagger (Strength):1d4:Strength",
          title: "Equip Dagger (Strength)",
        },
        {
          id: "attack-add-Dagger (Dexterity):1d4:Dexterity",
          title: "Equip Dagger (Dexterity)",
        },
      ],
      message: `*Unnamed character's gear*
- Shortsword
- Bastard sword
- Dagger
Slots: 3/10`,
    });
  });
});
