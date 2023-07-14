import { Roll } from "./roll";
import { Die } from "./die";

describe("roll", () => {
  const fmt = {
    bold: (t) => `*${t}*`,
    strike: (t) => `~${t}~`,
    headBandage: ":headBandage:",
  };
  const roll = new Roll(fmt, new Die(fmt));
  const mathRandom = jest.spyOn(Math, "random");

  it("can roll 3d6", () => {
    mathRandom
      .mockReturnValueOnce(0.4)
      .mockReturnValueOnce(0.2)
      .mockReturnValueOnce(0.0);
    expect(roll.execute({ dice: "3d6" })).toEqual(`3d6 (3 + 2 + 1) = 6`);
  });

  it("can roll 2d8 at advantage", () => {
    mathRandom
      .mockReturnValueOnce(0.4)
      .mockReturnValueOnce(0.6)
      .mockReturnValueOnce(0.0)
      .mockReturnValueOnce(0.0);
    expect(roll.execute({ dice: "adv(2d8)" })).toEqual(
      `adv(2d8) ((~4~, 5) + (1, ~1~)) = 6`
    );
  });

  it("can roll a negative d10", () => {
    mathRandom.mockReturnValueOnce(0.79);
    expect(roll.execute({ dice: "-d10" })).toEqual(`-1d10 (8) = -8`);
  });

  it("can roll d20s and add modifiers", () => {
    mathRandom.mockReturnValueOnce(0.99);
    expect(roll.execute({ dice: "d20 + 5" })).toEqual(`1d20 (20) + 5 = 25`);
  });

  it("can roll d20s with advantage and add modifiers negative", () => {
    mathRandom.mockReturnValueOnce(0.24).mockReturnValueOnce(0.34);
    expect(roll.execute({ dice: "adv(1d20) + -5" })).toEqual(
      `adv(1d20) (~5~, 7) + -5 = 2`
    );
  });

  it("can roll d20s with disadvantage and subtract modifiers", () => {
    mathRandom.mockReturnValueOnce(0.79).mockReturnValueOnce(0.0);
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
