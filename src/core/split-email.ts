import type { EmailParts } from "./types";

export function splitEmail(email: string): EmailParts | null {
  const trimmed = email.trim();
  const parts = trimmed.split("@");

  if (parts.length < 2) {
    return null;
  }

  for (const part of parts) {
    if (part === "") {
      return null;
    }
  }

  const domain = parts.pop()!;
  const domainParts = domain.split(".");
  let sld = "";
  let tld = "";

  if (domainParts.length === 0) {
    return null;
  } else if (domainParts.length === 1) {
    tld = domainParts[0]!;
  } else {
    sld = domainParts[0]!;
    for (let i = 1; i < domainParts.length; i++) {
      tld += domainParts[i]! + ".";
    }
    tld = tld.substring(0, tld.length - 1);
  }

  return {
    topLevelDomain: tld,
    secondLevelDomain: sld,
    domain,
    address: parts.join("@"),
  };
}
