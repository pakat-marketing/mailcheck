import { describe, it, expect } from "vitest";
import { splitEmail } from "./split-email";

describe("splitEmail", () => {
  it("returns address, domain, sld, tld", () => {
    expect(splitEmail("test@example.com")).toEqual({
      address: "test",
      domain: "example.com",
      topLevelDomain: "com",
      secondLevelDomain: "example",
    });
    expect(splitEmail("test@example.co.uk")).toEqual({
      address: "test",
      domain: "example.co.uk",
      topLevelDomain: "co.uk",
      secondLevelDomain: "example",
    });
    expect(splitEmail("test@mail.randomsmallcompany.co.uk")).toEqual({
      address: "test",
      domain: "mail.randomsmallcompany.co.uk",
      topLevelDomain: "randomsmallcompany.co.uk",
      secondLevelDomain: "mail",
    });
  });

  it("splits RFC compliant emails", () => {
    expect(splitEmail('"foo@bar"@example.com')).toEqual({
      address: '"foo@bar"',
      domain: "example.com",
      topLevelDomain: "com",
      secondLevelDomain: "example",
    });
    expect(splitEmail("contains+symbol@example.com")?.address).toBe("contains+symbol");
    expect(splitEmail("contains.symbol@domain.contains.symbol")).toEqual({
      address: "contains.symbol",
      domain: "domain.contains.symbol",
      topLevelDomain: "contains.symbol",
      secondLevelDomain: "domain",
    });
    expect(splitEmail("postbox@com")).toEqual({
      address: "postbox",
      domain: "com",
      topLevelDomain: "com",
      secondLevelDomain: "",
    });
  });

  it("returns null for non-RFC-compliant addresses", () => {
    expect(splitEmail("example.com")).toBeNull();
    expect(splitEmail("abc.example.com")).toBeNull();
    expect(splitEmail("@example.com")).toBeNull();
    expect(splitEmail("test@")).toBeNull();
  });

  it("trims surrounding spaces", () => {
    expect(splitEmail(" postbox@com")?.address).toBe("postbox");
    expect(splitEmail("postbox@com ")?.domain).toBe("com");
  });
});
