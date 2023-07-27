import { Library } from "../db/library";
import { Character } from "./character";

describe("character", () => {
  const library = new Library(":memory:");
  const character = new Character(
    {
      bold: (t) => `*${t}*`,
    },
    library
  );
  const userId = Math.random().toString().substring(2);

  beforeAll(async () => {
    await library.init();
  });

  it("tells you when you don't have any characters", async () => {
    expect(await character.execute({ userId })).toEqual(
      "No character found. Use /rollstats first!"
    );
  });

  it("lets you create a character from stats", async () => {
    expect(
      await character.fromStats({ id: "8:10:12:13:14:15", userId })
    ).toEqual({
      actions: [],
      message: "Character created! Use /character to view or modify.",
    });
  });

  it("lets you see your character's stats", async () => {
    expect(await character.execute({ userId })).toEqual(`*Unnamed character*
*STR* 8/-1 *DEX* 10/+0 *CON* 12/+1
*INT* 13/+1 *WIS* 14/+2 *CHA* 15/+2`);
  });

  it("lets you change your character's name", async () => {
    expect(await character.execute({ userId, name: "Test Character" }))
      .toEqual(`*Test Character*
*STR* 8/-1 *DEX* 10/+0 *CON* 12/+1
*INT* 13/+1 *WIS* 14/+2 *CHA* 15/+2`);
  });

  it("lets you change your character's stats", async () => {
    expect(
      await character.execute({
        userId,
        strength: 13,
        dexterity: 14,
        constitution: 15,
        intelligence: 8,
        wisdom: 10,
        charisma: 12,
      })
    ).toEqual(`*Test Character*
*STR* 13/+1 *DEX* 14/+2 *CON* 15/+2
*INT* 8/-1 *WIS* 10/+0 *CHA* 12/+1`);
  });
});
