import { Die } from "./die";

describe("die", () => {
  const die = new Die({ strike: (t) => `~${t}~` });
  const mathRandom = jest.spyOn(Math, "random");

  it("rolls a single d6", async () => {
    mathRandom.mockReturnValueOnce(0.2);
    expect(die.execute({ sides: 6 })).toEqual({
      display: "2",
      multiple: false,
      roll: 2,
    });
  });

  it("rolls 3d6", async () => {
    mathRandom
      .mockReturnValueOnce(0.6)
      .mockReturnValueOnce(0.6)
      .mockReturnValueOnce(0.9);
    expect(die.execute({ sides: 6, multiple: 3 })).toEqual({
      display: "4 + 4 + 6",
      multiple: true,
      roll: 14,
    });
  });

  it("rolls d20 with advantage", async () => {
    mathRandom.mockReturnValueOnce(0.84).mockReturnValueOnce(0.24);
    expect(die.execute({ sides: 20, advantage: true })).toEqual({
      display: "17, ~5~",
      multiple: true,
      roll: 17,
    });
  });

  it("rolls d20 with disadvantage", async () => {
    mathRandom.mockReturnValueOnce(0.84).mockReturnValueOnce(0.54);
    expect(die.execute({ sides: 20, disadvantage: true })).toEqual({
      display: "~17~, 11",
      multiple: true,
      roll: 11,
    });
  });

  it("rolls d20 with disadvantage", async () => {
    mathRandom.mockReturnValueOnce(0.14);
    expect(
      die.execute({ sides: 20, advantage: true, disadvantage: true })
    ).toEqual({
      display: "3",
      multiple: false,
      roll: 3,
    });
  });
});
