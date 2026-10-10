import { describe, expect, it } from "vitest";
import { isOpenAt, isWithinTenMinutes, walkMinutes } from "./geo";

describe("10-minute walking rule", () => {
  it("640 m straight-line is a 10 minute walk and counts as nearby", () => {
    expect(walkMinutes(640)).toBe(10);
    expect(isWithinTenMinutes(640)).toBe(true);
  });
  it("700 m straight-line is 11 minutes and is not nearby", () => {
    expect(walkMinutes(700)).toBe(11);
    expect(isWithinTenMinutes(700)).toBe(false);
  });
});

describe("open now", () => {
  it("open 08:00–23:00 is open at 12:00 and closed at 23:30", () => {
    expect(isOpenAt("08:00", "23:00", 12 * 60)).toBe(true);
    expect(isOpenAt("08:00", "23:00", 23 * 60 + 30)).toBe(false);
  });
  it("open past midnight 18:00–02:00 is open at 01:00", () => {
    expect(isOpenAt("18:00", "02:00", 60)).toBe(true);
    expect(isOpenAt("18:00", "02:00", 12 * 60)).toBe(false);
  });
});
