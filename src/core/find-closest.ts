import type { DistanceFunction } from "./types";
import { sift4Distance } from "./sift4";

export function findClosestDomain(
  domain: string,
  domains: string[],
  distanceFunction: DistanceFunction = sift4Distance,
  threshold = 2,
): string | false {
  if (!domain || !domains) {
    return false;
  }

  let minDist = Infinity;
  let closestDomain: string | null = null;

  for (const candidate of domains) {
    if (domain === candidate) {
      return domain;
    }
    const dist = distanceFunction(domain, candidate);
    if (dist < minDist) {
      minDist = dist;
      closestDomain = candidate;
    }
  }

  if (minDist <= threshold && closestDomain !== null) {
    return closestDomain;
  }
  return false;
}
