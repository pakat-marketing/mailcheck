export interface Suggestion {
  address: string;
  domain: string;
  full: string;
}

export interface EmailParts {
  topLevelDomain: string;
  secondLevelDomain: string;
  domain: string;
  address: string;
}

export type DistanceFunction = (first: string, second: string) => number;

export interface MailcheckOptions {
  email: string;
  domains?: string[];
  secondLevelDomains?: string[];
  topLevelDomains?: string[];
  distanceFunction?: DistanceFunction;
  domainThreshold?: number;
  secondLevelThreshold?: number;
  topLevelThreshold?: number;
}
