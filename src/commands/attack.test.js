import { Attack } from "./attack.js";
import { Die } from "./die.js";
import { Character } from "./character.js";
import { Library } from "../db/library.js";
import { MockRandom } from "../mocks/random.js";

describe("attack", () => {
  const library = new Library(":memory:");
  const fmt = { bold: (t) => `*${t}*`, strike: (t) => `~${t}~` };
  const mockRandom = new MockRandom();
  const attack = new Attack(fmt, new Die(fmt, mockRandom), library);
  const character = new Character(fmt, library);
  const userId = Math.random().toString().substring(2);

  beforeAll(async () => {
    await library.init();
    await mockRandom.load();
  });

  afterAll(async () => {
    await mockRandom.save();
    await library.close();
  });

  it("rolls with +0 by default", async () => {
    expect(await attack.execute({ username: "Test", userId }))
      .toEqual(`Test attacks!
To Hit: 1d20 (11) + 0 = 11`);
  });

  it("rolls damage when it hits, but not when it misses", async () => {
    expect(
      await attack.execute({
        ac: 12,
        damage: "1d8",
        multiple: 2,
        username: "Test",
        userId,
      })
    ).toEqual(`Test attacks!
*AC*: 12
To Hit: 1d20 (11) + 0 = 11; *Miss*
To Hit: 1d20 (12) + 0 = 12; *Hit!*
Damage: 1d8 (6) = 6`);
  });

  it("rolls double damage when it crits", async () => {
    expect(
      await attack.execute({
        advantage: true,
        damage: "1d8",
        username: "Test",
        userId,
      })
    ).toEqual(`Test attacks!
To Hit: 1d20 (20, ~8~) + 0 = 20; *CRIT!*
Damage: 2d8 (7 + 1) = 8`);
  });

  it("fumbles on a natural 1", async () => {
    expect(
      await attack.execute({
        disadvantage: true,
        username: "Test",
        userId,
      })
    ).toEqual(`Test attacks!
To Hit: 1d20 (1, ~8~) + 0 = 1; *FUMBLE!*`);
  });

  it("uses your active character", async () => {
    await character.fromStats({ id: "14:12:10:8:15:13", userId });
    expect(await attack.execute({ stat: "Strength", userId }))
      .toEqual(`Unnamed character attacks!
To Hit: 1d20 (7) + 2 = 9`);
  });

  it("allows overriding the modifier", async () => {
    expect(await attack.execute({ stat: "Strength", modifier: 3, userId }))
      .toEqual(`Unnamed character attacks!
To Hit: 1d20 (11) + 3 = 14`);
  });

  it("allows adding a bonus to attack and damage", async () => {
    expect(
      await attack.execute({ bonus: 1, damage: "1d4", modifier: 3, userId })
    ).toEqual(`Unnamed character attacks!
To Hit: 1d20 (3) + 3 + 1 = 7
Damage: 1d4 (1) + 1 = 2`);
  });

  it("allows adding an attack bonus", async () => {
    expect(
      await attack.execute({
        attackBonus: -2,
        modifier: 3,
        userId,
      })
    ).toEqual(`Unnamed character attacks!
To Hit: 1d20 (14) + 3 - 2 = 15`);
  });

  it("checks for missing character", async () => {
    expect(await attack.execute({ add: "Test Attack" })).toEqual(
      "You don't have a character yet. Create one with `/character`"
    );
  });

  it("checks for a missing attack", async () => {
    expect(await attack.execute({ name: "Test Attack", userId })).toEqual(
      "No attack found with name Test Attack"
    );
  });

  it("allows saving and reusing attacks", async () => {
    expect(
      await attack.execute({
        add: "Test Attack",
        attackBonus: 2,
        bonus: 1,
        damage: "1d4",
        modifier: 3,
        stat: "Strength",
        userId,
      })
    ).toEqual(`Added attack Test Attack`);
    expect(
      await attack.execute({
        name: "Test Attack",
        userId,
      })
    ).toEqual(`Unnamed character attacks with a Test Attack!
To Hit: 1d20 (18) + 3 + 2 + 1 = 24
Damage: 1d4 (3) + 1 = 4`);
    expect(
      await attack.execute({
        name: "Test Attack",
        attackBonus: 3,
        bonus: 0,
        damage: "1d8",
        modifier: -1,
        stat: "Dexterity",
        userId,
      })
    ).toEqual(`Unnamed character attacks with a Test Attack!
To Hit: 1d20 (18) - 1 + 3 + 0 = 20
Damage: 1d8 (4) + 0 = 4`);
  });
});
