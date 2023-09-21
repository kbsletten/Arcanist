import { MockRandom } from "../mocks/random.js";
import { RandomCharacter } from "./randomcharacter.js";
import { Library } from "../db/library.js";
import { Character } from "./character.js";
import { Die } from "./die.js";
import { Gear } from "./gear.js";

describe("randomcharacter", () => {
  const library = new Library(":memory:");
  const fmt = { bold: (t) => `*${t}*`, strike: (t) => `~${t}~` };
  const character = new Character(fmt, library);
  const mockRandom = new MockRandom();
  const die = new Die(fmt, mockRandom);
  const gear = new Gear(fmt, library, die);
  const randomCharacter = new RandomCharacter(
    fmt,
    library,
    die,
    character,
    gear
  );
  const userId = Math.random().toString().substring(2);

  beforeAll(async () => {
    await library.init();
    await mockRandom.load();
  });

  afterAll(async () => {
    await mockRandom.save();
    await library.close();
  });

  it("rolls a new 0th-level character", async () => {
    expect(await randomCharacter.executeActions({ level: 0, userId })).toEqual({
      actions: [],
      message: `Level: 0
Ancestry: 1d12 (10) = Halfling
Name: 1d20 (19) = Astrid
Background: 1d20 (10) = Barbarian
Deity: 1d8 (1) = Saint Terragnis
Alignment: L
Strength: 3d6 (3 + 4 + 5) = 12
Dexterity: 3d6 (1 + 2 + 6) = 9
Constitution: 3d6 (1 + 6 + 4) = 11
Intelligence: 3d6 (2 + 5 + 1) = 8
Wisdom: 3d6 (6 + 3 + 6) = 15
Charisma: 3d6 (2 + 1 + 3) = 6
Adding gear:
1d4 (2) = 2 item(s)
1d12 (7) = 7; Crowbar
1d12 (1) = 1; Torch`,
    });
    expect(await character.executeActions({ userId })).toEqual({
      actions: [],
      message: `*Astrid*
*LV* 0 Unknown Classless *XP* 0/0
*Ancestry* Halfling *Background* Barbarian
*Alignment* L (Saint Terragnis)
*HP* 1/1 *AC* 10
*STR* 12/+1 *DEX* 9/-1 *CON* 11/+0
*INT* 8/-1 *WIS* 15/+2 *CHA* 6/-2`,
    });
  });

  it("rolls a new 1st-level character", async () => {
    expect(await randomCharacter.executeActions({ userId })).toEqual({
      actions: [],
      message: `Level: 1
Ancestry: 1d12 (2) = Human
Name: 1d20 (11) = Tamra
Background: 1d20 (2) = Wanted
Class: 1d4 (2) = Priest
Deity: 1d8 (5) = Ord
Alignment: N
Strength: 3d6 (4 + 3 + 5) = 12
Dexterity: 3d6 (1 + 5 + 1) = 7
Constitution: 3d6 (1 + 1 + 1) = 3
Intelligence: 3d6 (6 + 6 + 1) = 13
Wisdom: 3d6 (1 + 4 + 1) = 6
Charisma: 3d6 (2 + 3 + 1) = 6
Hit Points: 1d6 (6) + -4 = 2
Adding crawling kit:
- Flint and steel
- Torch
- Torch
- Rations x3
- Iron spikes x10
- Grappling hook
- Rope, 60'`,
    });
    expect(await character.executeActions({ userId })).toEqual({
      actions: [],
      message: `*Tamra*
*LV* 1 Unknown Priest *XP* 0/10
*Ancestry* Human *Background* Wanted
*Alignment* N (Ord)
*HP* 2/2 *AC* 10
*STR* 12/+1 *DEX* 7/-2 *CON* 3/-4
*INT* 13/+1 *WIS* 6/-2 *CHA* 6/-2`,
    });
  });
});
