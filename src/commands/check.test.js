import { Check } from "./check";
import { Die } from "./die";

describe("check", () => {
  const fmt = { bold: (t) => `*${t}*` };
  const check = new Check(fmt, new Die(fmt));
  const mathRandom = jest.spyOn(Math, "random");

  it("rolls with +0 by default", () => {
    mathRandom.mockReturnValueOnce(0.64);
    expect(check.execute({ name: "Test" })).toEqual(`Test attempts a check!
1d20 (13) + 0 = 13`);
  });

  it("handles passing and failing a check", () => {
    mathRandom.mockReturnValueOnce(0.64).mockReturnValueOnce(0.09);
    expect(check.execute({ name: "Test", dc: 12, multiple: 2 }))
      .toEqual(`Test attempts a DC 12 check!
1d20 (13) + 0 = 13; *Success!*
1d20 (2) + 0 = 2; *Failure*
Successes: 1/2`);
  });

  it("uses stats", () => {
    mathRandom.mockReturnValueOnce(0.49);
    expect(check.execute({ name: "Test", stat: "Strength" }))
      .toEqual(`Test attempts a Strength check!
1d20 (10) + 0 = 10`);
  });
});
