import type { MailcheckOptions, Suggestion } from "./types";
import { splitEmail } from "./split-email";
import { findClosestDomain } from "./find-closest";
import { encodeEmail } from "./encode-email";
import { sift4Distance } from "./sift4";
import {
  defaultDomains,
  defaultSecondLevelDomains,
  defaultTopLevelDomains,
} from "./defaults";

export function suggest(options: MailcheckOptions): Suggestion | null {
  const domains = options.domains ?? defaultDomains;
  const secondLevelDomains = options.secondLevelDomains ?? defaultSecondLevelDomains;
  const topLevelDomains = options.topLevelDomains ?? defaultTopLevelDomains;
  const distanceFunction = options.distanceFunction ?? sift4Distance;
  const domainThreshold = options.domainThreshold ?? 2;
  const secondLevelThreshold = options.secondLevelThreshold ?? 2;
  const topLevelThreshold = options.topLevelThreshold ?? 2;

  const email = encodeEmail(options.email).toLowerCase();
  const emailParts = splitEmail(email);
  if (!emailParts) {
    return null;
  }

  if (secondLevelDomains && topLevelDomains) {
    if (
      secondLevelDomains.indexOf(emailParts.secondLevelDomain) !== -1 &&
      topLevelDomains.indexOf(emailParts.topLevelDomain) !== -1
    ) {
      return null;
    }
  }

  const closestDomain = findClosestDomain(
    emailParts.domain,
    domains,
    distanceFunction,
    domainThreshold,
  );

  if (closestDomain) {
    if (closestDomain === emailParts.domain) {
      return null;
    }
    return {
      address: emailParts.address,
      domain: closestDomain,
      full: `${emailParts.address}@${closestDomain}`,
    };
  }

  const closestSecondLevelDomain = findClosestDomain(
    emailParts.secondLevelDomain,
    secondLevelDomains,
    distanceFunction,
    secondLevelThreshold,
  );
  const closestTopLevelDomain = findClosestDomain(
    emailParts.topLevelDomain,
    topLevelDomains,
    distanceFunction,
    topLevelThreshold,
  );

  if (emailParts.domain) {
    let candidate = emailParts.domain;
    let changed = false;

    if (closestSecondLevelDomain && closestSecondLevelDomain !== emailParts.secondLevelDomain) {
      candidate = candidate.replace(emailParts.secondLevelDomain, closestSecondLevelDomain);
      changed = true;
    }

    if (
      closestTopLevelDomain &&
      closestTopLevelDomain !== emailParts.topLevelDomain &&
      emailParts.secondLevelDomain !== ""
    ) {
      candidate = candidate.replace(
        new RegExp(`${emailParts.topLevelDomain}$`),
        closestTopLevelDomain,
      );
      changed = true;
    }

    if (changed) {
      return {
        address: emailParts.address,
        domain: candidate,
        full: `${emailParts.address}@${candidate}`,
      };
    }
  }

  return null;
}
