import { findByName } from "./util.js";

describe("findByName", () => {
  it("Returns exact matches first", () => {
    expect(findByName("Aa", [{ name: "Aa" }, { name: "aa" }])).toEqual([
      { name: "Aa" },
    ]);
  });
  it("Returns case-insensitive matches second", () => {
    expect(findByName("Aa", [{ name: "aa" }, { name: "aA" }])).toEqual([
      { name: "aa" },
      { name: "aA" },
    ]);
  });
  it("Returns partial matches third", () => {
    expect(findByName("Aa", [{ name: "Aaa" }, { name: "aaa" }])).toEqual([
      { name: "Aaa" },
    ]);
  });
  it("Returns case-insensitive partial matches fourth", () => {
    expect(findByName("Aa", [{ name: "aaa" }, { name: "aaA" }])).toEqual([
      { name: "aaa" },
      { name: "aaA" },
    ]);
  });
});
