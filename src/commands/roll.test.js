import { Roll } from "./roll";
import { Die } from "./die";
import { MockRandom } from "../mocks/random";

describe("roll", () => {
  const fmt = {
    bold: (t) => `*${t}*`,
    strike: (t) => `~${t}~`,
    headBandage: ":headBandage:",
  };
  const mockRandom = new MockRandom();
  const roll = new Roll(fmt, new Die(fmt, mockRandom));

  beforeAll(async () => {
    await mockRandom.load();
  });

  afterAll(async () => {
    await mockRandom.save();
  });

  it("can roll 3d6", () => {
    expect(roll.execute({ dice: "3d6" })).toEqual(`3d6 (3 + 2 + 1) = 6`);
  });

  it("can roll 2d8 at advantage", () => {
    expect(roll.execute({ dice: "adv(2d8)" })).toEqual(
      `adv(2d8) ((~4~, 5) + (1, ~1~)) = 6`
    );
  });

  it("can roll a negative d10", () => {
    expect(roll.execute({ dice: "-d10" })).toEqual(`-1d10 (8) = -8`);
  });

  it("can roll d20s and add modifiers", () => {
    expect(roll.execute({ dice: "d20 + 5" })).toEqual(`1d20 (20) + 5 = 25`);
  });

  it("can roll d20s with advantage and add modifiers negative", () => {
    expect(roll.execute({ dice: "adv(1d20) + -5" })).toEqual(
      `adv(1d20) (~5~, 7) + -5 = 2`
    );
  });

  it("can roll d20s with disadvantage and subtract modifiers", () => {
    expect(roll.execute({ dice: "DIS(D20) - 1" })).toEqual(
      `dis(1d20) (~16~, 1) - 1 = 0`
    );
  });

  it("ignores garbage", () => {
    expect(roll.execute({ dice: "garbage" })).toEqual(
      `:headBandage: I'm sorry, I didn't understand your request.`
    );
  });
});
