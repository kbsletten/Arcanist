import { Check } from "./check";
import { Die } from "./die";
import { Character } from "./character";
import { Library } from "../db/library";
import { MockRandom } from "../mocks/random";

describe("check", () => {
  const library = new Library(":memory:");
  const fmt = { bold: (t) => `*${t}*`, strike: (t) => `~${t}~` };
  const mockRandom = new MockRandom();
  const check = new Check(fmt, new Die(fmt, mockRandom), library);
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
    expect(await check.execute({ username: "Test", userId }))
      .toEqual(`Test attempts a check!
1d20 (13) + 0 = 13`);
  });

  it("handles passing and failing a check", async () => {
    expect(
      await check.execute({ username: "Test", dc: 12, multiple: 2, userId })
    ).toEqual(`Test attempts a DC 12 check!
1d20 (13) + 0 = 13; *Success!*
1d20 (2) + 0 = 2; *Failure*
Successes: 1/2`);
  });

  it("uses stats", async () => {
    expect(await check.execute({ username: "Test", stat: "Strength", userId }))
      .toEqual(`Test attempts a Strength check!
1d20 (10) + 0 = 10`);
  });

  it("uses your active character", async () => {
    await character.fromStats({ id: "14:12:10:8:15:13", userId });
    expect(await check.execute({ stat: "Strength", userId }))
      .toEqual(`Unnamed character attempts a Strength check!
1d20 (10) + 2 = 12`);
  });

  it("allows a reroll of a check", async () => {
    await character.execute({ userId, luck: true });
    expect(
      await check.executeActions({
        advantage: true,
        dc: 12,
        modifier: 3,
        stat: "Strength",
        userId,
      })
    ).toEqual({
      actions: [
        {
          id: "check-reroll-a:true;d:12;m:3;n:1;s:Strength",
          title: "Reroll",
        },
      ],
      message: `Unnamed character attempts a DC 12 Strength check!
1d20 (~1~, 5) + 3 = 8; *Failure*`,
    });
  });

  it("can reroll a check", async () => {
    expect(
      await check.reroll({
        userId,
        id: "a:true;d:12;m:3;s:Strength",
      })
    ).toEqual({
      actions: [],
      message: `Unnamed character attempts a DC 12 Strength check!
1d20 (~1~, 19) + 3 = 22; *Success!*`,
    });
  });

  it("rerolls don't fail without a character", async () => {
    expect(
      await check.reroll({
        id: "e:true;n:2",
        username: "username",
      })
    ).toEqual({
      actions: [],
      message: `username attempts a check!
1d20 (1, ~19~) + 0 = 1
1d20 (3, ~7~) + 0 = 3`,
    });
  });
});
