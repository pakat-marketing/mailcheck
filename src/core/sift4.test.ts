import { describe, it, expect } from "vitest";
import { sift4Distance } from "./sift4";

describe("sift4Distance", () => {
  it("returns 0 for identical strings", () => {
    expect(sift4Distance("gmail.com", "gmail.com")).toBe(0);
  });

  it("returns the length of the other string when one is empty", () => {
    expect(sift4Distance("", "abc")).toBe(3);
    expect(sift4Distance("abc", "")).toBe(3);
    expect(sift4Distance("", "")).toBe(0);
  });

  it("scores close strings lower than distant ones", () => {
    expect(sift4Distance("gmial.com", "gmail.com")).toBeLessThan(
      sift4Distance("yahoo.com", "gmail.com"),
    );
  });
});
