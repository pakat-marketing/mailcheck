import { describe, it, expect } from "vitest";
import { findClosestDomain } from "./find-closest";
import { sift4Distance } from "./sift4";

const domains = ["google.com", "gmail.com", "emaildomain.com", "comcast.net", "facebook.com", "msn.com"];
const secondLevelDomains = ["yahoo", "hotmail", "mail", "live", "outlook", "gmx"];
const topLevelDomains = ["co.uk", "com", "org", "info", "fr"];

describe("findClosestDomain", () => {
  it("returns the most similar domain", () => {
    expect(findClosestDomain("google.com", domains, sift4Distance, 2)).toBe("google.com");
    expect(findClosestDomain("emaildoman.com", domains, sift4Distance, 2)).toBe("emaildomain.com");
    expect(findClosestDomain("gmsn.com", domains, sift4Distance, 2)).toBe("msn.com");
    expect(findClosestDomain("gmaik.com", domains, sift4Distance, 2)).toBe("gmail.com");
  });

  it("returns the most similar second-level domain", () => {
    expect(findClosestDomain("hotmial", secondLevelDomains, sift4Distance, 2)).toBe("hotmail");
    expect(findClosestDomain("tahoo", secondLevelDomains, sift4Distance, 2)).toBe("yahoo");
    expect(findClosestDomain("outllok", secondLevelDomains, sift4Distance, 2)).toBe("outlook");
  });

  it("returns the most similar top-level domain", () => {
    expect(findClosestDomain("cmo", topLevelDomains, sift4Distance, 2)).toBe("com");
    expect(findClosestDomain("ogr", topLevelDomains, sift4Distance, 2)).toBe("org");
    expect(findClosestDomain("com.uk", topLevelDomains, sift4Distance, 2)).toBe("co.uk");
  });

  it("returns false when nothing is close enough", () => {
    expect(findClosestDomain("", domains, sift4Distance, 2)).toBe(false);
  });
});
