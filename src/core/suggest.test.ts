import { describe, it, expect } from "vitest";
import { suggest } from "./suggest";

const domains = ["google.com", "gmail.com", "emaildomain.com", "comcast.net", "facebook.com", "msn.com"];
const secondLevelDomains = ["yahoo", "hotmail", "mail", "live", "outlook", "gmx"];
const topLevelDomains = ["co.uk", "com", "org", "info", "fr"];

describe("suggest", () => {
  it("returns a Suggestion object", () => {
    expect(suggest({ email: "test@gmail.co", domains })).toEqual({
      address: "test",
      domain: "gmail.com",
      full: "test@gmail.com",
    });
  });

  it("returns null when no suggestion is found", () => {
    expect(suggest({ email: "contact@kicksend.com", domains })).toBeNull();
  });

  it("returns null for incomplete emails", () => {
    expect(suggest({ email: "contact", domains })).toBeNull();
    expect(suggest({ email: "", domains })).toBeNull();
    expect(suggest({ email: "test@", domains })).toBeNull();
    expect(suggest({ email: "test", domains })).toBeNull();
  });

  it("handles the documented domain cases", () => {
    expect(suggest({ email: "test@gmailc.om", domains })?.domain).toBe("gmail.com");
    expect(suggest({ email: "test@emaildomain.co", domains })?.domain).toBe("emaildomain.com");
    expect(suggest({ email: "test@gmail.con", domains })?.domain).toBe("gmail.com");
    expect(suggest({ email: "test@gnail.con", domains })?.domain).toBe("gmail.com");
    expect(suggest({ email: "test@GNAIL.con", domains })?.domain).toBe("gmail.com");
    expect(suggest({ email: "test@#gmail.com", domains })?.domain).toBe("gmail.com");
    expect(suggest({ email: "test@comcast.nry", domains })?.domain).toBe("comcast.net");
  });

  it("handles sld/tld cases", () => {
    const opts = { domains, secondLevelDomains, topLevelDomains };
    expect(suggest({ email: "test@homail.con", ...opts })?.domain).toBe("hotmail.com");
    expect(suggest({ email: "test@hotmail.co", ...opts })?.domain).toBe("hotmail.com");
    expect(suggest({ email: "test@yajoo.com", ...opts })?.domain).toBe("yahoo.com");
    expect(suggest({ email: "test@randomsmallcompany.cmo", ...opts })?.domain).toBe("randomsmallcompany.com");
    expect(suggest({ email: "test@con-artists.con", ...opts })?.domain).toBe("con-artists.com");
    expect(suggest({ email: "test@mail.randomsmallcompany.cmo", ...opts })).toBeNull();
  });

  it("does not chain suggestions", () => {
    expect(
      suggest({ email: "test@yahooo.cmo", domains, secondLevelDomains, topLevelDomains })?.domain,
    ).toBe("yahoo.com");
  });

  it("does not suggest for valid sld-tld combos", () => {
    const opts = { domains, secondLevelDomains, topLevelDomains };
    expect(suggest({ email: "test@yahoo.co.uk", ...opts })).toBeNull();
    expect(suggest({ email: "test@gmx.fr", ...opts })).toBeNull();
  });

  it("does not suggest for unrecognised slds without a tld", () => {
    const opts = { domains, secondLevelDomains, topLevelDomains };
    expect(suggest({ email: "test@gm", ...opts })).toBeNull();
    expect(suggest({ email: "test@gma", ...opts })).toBeNull();
    expect(suggest({ email: "test@gmai", ...opts })).toBeNull();
  });

  it("uses default domain lists when none are supplied", () => {
    expect(suggest({ email: "test@gmial.com" })?.domain).toBe("gmail.com");
  });

  it("applies thresholds per-call without leaking state", () => {
    // "gooooogle.com" is sift4 distance 3 from "google.com": beyond the
    // default threshold of 2, but within a threshold of 10.
    const opts = { domains: ["google.com"], secondLevelDomains: ["yahoo"], topLevelDomains: ["com"] };
    const withHigh = suggest({ email: "test@gooooogle.com", ...opts, domainThreshold: 10 });
    expect(withHigh?.domain).toBe("google.com");

    // A subsequent default-threshold call is unaffected by the previous one.
    const withDefault = suggest({ email: "test@gooooogle.com", ...opts });
    expect(withDefault).toBeNull();
  });
});
