import { Library } from "../db/library";
import { Light } from "./light";

describe("light", () => {
  const library = new Library("arcanist.test.sqlite");
  const light = new Light(
    { filled: "<filled>", elapsed: "<elapsed>" },
    library
  );
  const serverId = Math.random().toString().substring(2);

  beforeAll(async () => {
    await library.init();
  });

  afterAll(async () => {
    library.close();
  });

  it("returns 0 for unknown servers", async () => {
    expect(await light.execute({ serverId })).toEqual("Time remaining: 0m");
  });

  it("resets to 1h", async () => {
    expect(await light.execute({ serverId, reset: true }))
      .toEqual(`<filled> Reset light to 1h.
Time remaining: 1h`);
  });

  it("marks rounds", async () => {
    expect(await light.execute({ serverId, rounds: 2 }))
      .toEqual(`<elapsed> 2 rounds (12 minutes)
Time remaining: 48m`);
  });

  it("marks minutes", async () => {
    expect(await light.execute({ serverId, minutes: 2 }))
      .toEqual(`<elapsed> 2 minutes
Time remaining: 46m`);
  });

  it("handles multiple commands at once", async () => {
    expect(
      await light.execute({ serverId, minutes: 2, rounds: 2, reset: true })
    ).toEqual(`<filled> Reset light to 1h.
<elapsed> 2 rounds (12 minutes)
<elapsed> 2 minutes    
Time remaining: 46m`);
  });
});
