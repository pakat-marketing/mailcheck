import { describe, it, expect } from "vitest";
import { encodeEmail } from "./encode-email";

describe("encodeEmail", () => {
  it("escapes script tags", () => {
    const result = encodeEmail('<script>alert("a")</script>@emaildomain.con');
    expect(result).not.toMatch(/<script>/);
  });

  it("allows valid special characters", () => {
    expect(encodeEmail(" g1!#$%&'*+-/=?^_`{|}@gmai.com")).toBe(
      " g1!#$%&'*+-/=?^_`{|}@gmai.com",
    );
  });
});
