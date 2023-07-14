import { RollStats } from "./rollstats";
import { Die } from "./die";

describe("rollStats", () => {
  const fmt = { bold: (t) => `*${t}*` };
  const rollStats = new RollStats(fmt, new Die(fmt));
  const mathRandom = jest.spyOn(Math, "random");

  it("rolls some terrible stats", () => {
    mathRandom.mockReturnValue(0.1);
    expect(rollStats.execute({})).toEqual(`*Strength*: 1 + 1 + 1 = 3 (-3)
*Dexterity*: 1 + 1 + 1 = 3 (-3)
*Constitution*: 1 + 1 + 1 = 3 (-3)
*Intelligence*: 1 + 1 + 1 = 3 (-3)
*Wisdom*: 1 + 1 + 1 = 3 (-3)
*Charisma*: 1 + 1 + 1 = 3 (-3)`);
  });

  it("rolls some unbelievable stats", () => {
    mathRandom.mockReturnValue(0.9);
    expect(rollStats.execute({})).toEqual(`*Strength*: 6 + 6 + 6 = 18 (+4)
*Dexterity*: 6 + 6 + 6 = 18 (+4)
*Constitution*: 6 + 6 + 6 = 18 (+4)
*Intelligence*: 6 + 6 + 6 = 18 (+4)
*Wisdom*: 6 + 6 + 6 = 18 (+4)
*Charisma*: 6 + 6 + 6 = 18 (+4)`);
  });
});
