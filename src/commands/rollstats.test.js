import { RollStats } from "./rollstats";
import { Die } from "./die.js";
import { MockRandom } from "../mocks/random.js";

describe("rollStats", () => {
  const fmt = { bold: (t) => `*${t}*` };
  const mockRandom = new MockRandom();
  const rollStats = new RollStats(fmt, new Die(fmt, mockRandom));

  beforeAll(async () => {
    await mockRandom.load();
  });

  afterAll(async () => {
    await mockRandom.save();
  });

  it("rolls some terrible stats", async () => {
    expect(await rollStats.executeActions({})).toEqual({
      actions: [
        {
          id: "character-fromStats-3:3:3:3:3:3",
          title: "Create new character",
        },
      ],
      message: `*Strength*: 1 + 1 + 1 = 3 (-3)
*Dexterity*: 1 + 1 + 1 = 3 (-3)
*Constitution*: 1 + 1 + 1 = 3 (-3)
*Intelligence*: 1 + 1 + 1 = 3 (-3)
*Wisdom*: 1 + 1 + 1 = 3 (-3)
*Charisma*: 1 + 1 + 1 = 3 (-3)`,
    });
  });

  it("rolls some unbelievable stats", async () => {
    expect(await rollStats.executeActions({})).toEqual({
      actions: [
        {
          id: "character-fromStats-18:18:18:18:18:18",
          title: "Create new character",
        },
      ],
      message: `*Strength*: 6 + 6 + 6 = 18 (+4)
*Dexterity*: 6 + 6 + 6 = 18 (+4)
*Constitution*: 6 + 6 + 6 = 18 (+4)
*Intelligence*: 6 + 6 + 6 = 18 (+4)
*Wisdom*: 6 + 6 + 6 = 18 (+4)
*Charisma*: 6 + 6 + 6 = 18 (+4)`,
    });
  });
});
