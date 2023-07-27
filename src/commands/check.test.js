import { Check } from "./check";
import { Die } from "./die";
import { Character } from "./character";
import { Library } from "../db/library";

describe("check", () => {
  const library = new Library(":memory:");
  const fmt = { bold: (t) => `*${t}*` };
  const check = new Check(fmt, new Die(fmt), library);
  const character = new Character(fmt, library);
  const mathRandom = jest.spyOn(Math, "random");
  const userId = Math.random().toString().substring(2);

  beforeAll(async () => {
    await library.init();
  });

  it("rolls with +0 by default", async () => {
    mathRandom.mockReturnValueOnce(0.64);
    expect(await check.execute({ username: "Test", userId }))
      .toEqual(`Test attempts a check!
1d20 (13) + 0 = 13`);
  });

  it("handles passing and failing a check", async () => {
    mathRandom.mockReturnValueOnce(0.64).mockReturnValueOnce(0.09);
    expect(await check.execute({ username: "Test", dc: 12, multiple: 2, userId }))
      .toEqual(`Test attempts a DC 12 check!
1d20 (13) + 0 = 13; *Success!*
1d20 (2) + 0 = 2; *Failure*
Successes: 1/2`);
  });

  it("uses stats", async () => {
    mathRandom.mockReturnValueOnce(0.49);
    expect(await check.execute({ username: "Test", stat: "Strength", userId }))
      .toEqual(`Test attempts a Strength check!
1d20 (10) + 0 = 10`);
  });

  it("uses your active character", async () => {
    mathRandom.mockReturnValueOnce(0.49);
    await character.fromStats({ id: "14:12:10:8:15:13", userId });
    expect(await check.execute({ stat: "Strength", userId }))
      .toEqual(`Unnamed character attempts a Strength check!
1d20 (10) + 2 = 12`);
  });
});
