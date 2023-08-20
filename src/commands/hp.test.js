import { Library } from "../db/library";
import { Character } from "./character";
import { Hp } from "./hp.js";

describe("hp", () => {
  const fmt = {
    bold: (t) => `*${t}*`,
  };
  const library = new Library(":memory:");
  const hp = new Hp(library);
  const character = new Character(fmt, library);
  const userId = Math.random().toString().substring(2);

  beforeAll(async () => {
    await library.init();
  });

  afterAll(async () => {
    library.close();
  });

  it("handles no character", async () => {
    expect(await hp.execute({ userId })).toEqual(
      `You have no active character. Create one with /rollstats first.`
    );
  });

  it("can show a character's hp", async () => {
    await character.fromStats({ id: "14:12:18:8:15:13", userId });
    expect(await hp.execute({ userId })).toEqual(`Unnamed character's HP: 4/4`);
  });

  it("can decrease a character's hp", async () => {
    expect(await hp.execute({ amount: -2, userId })).toEqual(
      `Unnamed character's HP: 2/4 (-2)`
    );
  });

  it("can increase a character's hp", async () => {
    expect(await hp.execute({ amount: 1, userId })).toEqual(
      `Unnamed character's HP: 3/4 (+1)`
    );
  });

  it("won't go below 0", async () => {
    expect(await hp.execute({ amount: -10, userId })).toEqual(
      `Unnamed character's HP: 0/4 (-3)`
    );
  });

  it("won't go above maxHP", async () => {
    expect(await hp.execute({ amount: 10, userId })).toEqual(
      `Unnamed character's HP: 4/4 (+4)`
    );
  });
});
