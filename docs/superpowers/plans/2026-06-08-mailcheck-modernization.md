# Mailcheck Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the legacy Kicksend Mailcheck library as a modern, framework-agnostic TypeScript package with a React layer, full test coverage, and hardened CI/CD.

**Architecture:** Pure TypeScript core (`mailcheck`, zero deps) exposing `suggest()` and building-block functions, plus a `mailcheck/react` subpath with a `useMailcheck` hook and a headless `<MailcheckSuggestion>` component. Built with tsup (dual ESM/CJS + types), tested with Vitest.

**Tech Stack:** TypeScript, pnpm, tsup, Vitest, @testing-library/react, jsdom, ESLint, changesets, size-limit, GitHub Actions (OIDC publish).

---

## Task 0: Scaffolding & toolchain

**Files:**
- Delete: `Gruntfile.coffee`, `.travis.yml`, `bower.json`, `mailcheck.jquery.json`, `jshint.json`, `src/mailcheck.js`, `src/mailcheck.min.js`, `spec/mailcheckSpec.js`, `spec/spec_runner.html`, `spec/lib/`, `script/`, `doc/`, `examples/`
- Create: `package.json` (replace), `tsconfig.json`, `tsup.config.ts`, `vitest.config.ts`, `.eslintrc.cjs`, `.gitignore` (update), `.npmrc`

- [ ] **Step 1: Remove legacy files**

```bash
git rm -r Gruntfile.coffee .travis.yml bower.json mailcheck.jquery.json jshint.json \
  src/mailcheck.js src/mailcheck.min.js spec script doc examples
```

- [ ] **Step 2: Write `package.json`**

```json
{
  "name": "mailcheck",
  "version": "2.0.0",
  "description": "Suggest a corrected domain when users misspell their email address. Framework-agnostic core + React hook/component.",
  "keywords": ["email", "spell check", "form", "validation", "react", "typescript"],
  "license": "MIT",
  "type": "module",
  "packageManager": "pnpm@9.12.0",
  "engines": { "node": ">=18" },
  "sideEffects": false,
  "files": ["dist"],
  "exports": {
    ".": {
      "types": "./dist/core/index.d.ts",
      "import": "./dist/core/index.js",
      "require": "./dist/core/index.cjs"
    },
    "./react": {
      "types": "./dist/react/index.d.ts",
      "import": "./dist/react/index.js",
      "require": "./dist/react/index.cjs"
    }
  },
  "main": "./dist/core/index.cjs",
  "module": "./dist/core/index.js",
  "types": "./dist/core/index.d.ts",
  "scripts": {
    "build": "tsup",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "test": "vitest run",
    "test:watch": "vitest",
    "size": "size-limit",
    "prepublishOnly": "pnpm build"
  },
  "peerDependencies": {
    "react": ">=18"
  },
  "peerDependenciesMeta": {
    "react": { "optional": true }
  },
  "devDependencies": {
    "@size-limit/preset-small-lib": "^11.1.6",
    "@testing-library/react": "^16.0.1",
    "@types/react": "^18.3.12",
    "@typescript-eslint/eslint-plugin": "^8.13.0",
    "@typescript-eslint/parser": "^8.13.0",
    "eslint": "^8.57.1",
    "jsdom": "^25.0.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "size-limit": "^11.1.6",
    "tsup": "^8.3.5",
    "typescript": "^5.6.3",
    "vitest": "^2.1.4"
  },
  "size-limit": [
    { "path": "dist/core/index.js", "limit": "3 kB" }
  ],
  "repository": { "type": "git", "url": "git+https://github.com/mailcheck/mailcheck.git" },
  "homepage": "https://github.com/mailcheck/mailcheck"
}
```

- [ ] **Step 3: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2020", "DOM"],
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "declaration": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "verbatimModuleSyntax": true,
    "noEmit": true
  },
  "include": ["src", "*.config.ts"]
}
```

- [ ] **Step 4: Write `tsup.config.ts`**

```ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/core/index.ts", "src/react/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  treeshake: true,
  splitting: false,
  sourcemap: true,
  external: ["react"],
});
```

- [ ] **Step 5: Write `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
```

- [ ] **Step 6: Write `.eslintrc.cjs`**

```js
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  env: { browser: true, node: true, es2021: true },
  ignorePatterns: ["dist", "node_modules", "*.config.ts"],
};
```

- [ ] **Step 7: Update `.gitignore`**

Ensure it contains:
```
node_modules
dist
**/.DS_Store
```

- [ ] **Step 8: Write `.npmrc`**

```
ignore-scripts=true
```

- [ ] **Step 9: Install and commit**

```bash
pnpm install
git add -A
git commit -m "chore: scaffold modern TypeScript toolchain, remove legacy build"
```
Expected: install succeeds; lockfile created.

---

## Task 1: Core types

**Files:**
- Create: `src/core/types.ts`

- [ ] **Step 1: Write the types**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add src/core/types.ts
git commit -m "feat(core): add core type definitions"
```

---

## Task 2: `sift4Distance`

**Files:**
- Create: `src/core/sift4.ts`, `src/core/sift4.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/core/sift4.test.ts`
Expected: FAIL — cannot find module `./sift4`.

- [ ] **Step 3: Write the implementation**

Port the legacy sift4 algorithm verbatim into typed form:

```ts
export function sift4Distance(s1: string, s2: string, maxOffset = 5): number {
  if (!s1 || !s1.length) {
    return s2 ? s2.length : 0;
  }
  if (!s2 || !s2.length) {
    return s1.length;
  }

  const l1 = s1.length;
  const l2 = s2.length;

  let c1 = 0;
  let c2 = 0;
  let lcss = 0;
  let localCs = 0;
  let trans = 0;
  const offsetArr: { c1: number; c2: number; trans: boolean }[] = [];

  while (c1 < l1 && c2 < l2) {
    if (s1.charAt(c1) === s2.charAt(c2)) {
      localCs++;
      let isTrans = false;
      let i = 0;
      while (i < offsetArr.length) {
        const ofs = offsetArr[i]!;
        if (c1 <= ofs.c1 || c2 <= ofs.c2) {
          isTrans = Math.abs(c2 - c1) >= Math.abs(ofs.c2 - ofs.c1);
          if (isTrans) {
            trans++;
          } else if (!ofs.trans) {
            ofs.trans = true;
            trans++;
          }
          break;
        } else if (c1 > ofs.c2 && c2 > ofs.c1) {
          offsetArr.splice(i, 1);
        } else {
          i++;
        }
      }
      offsetArr.push({ c1, c2, trans: isTrans });
    } else {
      lcss += localCs;
      localCs = 0;
      if (c1 !== c2) {
        c1 = c2 = Math.min(c1, c2);
      }
      for (let j = 0; j < maxOffset && (c1 + j < l1 || c2 + j < l2); j++) {
        if (c1 + j < l1 && s1.charAt(c1 + j) === s2.charAt(c2)) {
          c1 += j - 1;
          c2--;
          break;
        }
        if (c2 + j < l2 && s1.charAt(c1) === s2.charAt(c2 + j)) {
          c1--;
          c2 += j - 1;
          break;
        }
      }
    }
    c1++;
    c2++;
    if (c1 >= l1 || c2 >= l2) {
      lcss += localCs;
      localCs = 0;
      c1 = c2 = Math.min(c1, c2);
    }
  }
  lcss += localCs;
  return Math.round(Math.max(l1, l2) - lcss + trans);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/core/sift4.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/sift4.ts src/core/sift4.test.ts
git commit -m "feat(core): add typed sift4 distance function"
```

---

## Task 3: `encodeEmail`

**Files:**
- Create: `src/core/encode-email.ts`, `src/core/encode-email.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/core/encode-email.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```ts
// Encode the email to prevent XSS while leaving valid characters intact,
// per https://en.wikipedia.org/wiki/Email_address#Syntax
export function encodeEmail(email: string): string {
  return encodeURI(email)
    .replace("%20", " ")
    .replace("%25", "%")
    .replace("%5E", "^")
    .replace("%60", "`")
    .replace("%7B", "{")
    .replace("%7C", "|")
    .replace("%7D", "}");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/core/encode-email.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/encode-email.ts src/core/encode-email.test.ts
git commit -m "feat(core): add encodeEmail"
```

---

## Task 4: `splitEmail`

**Files:**
- Create: `src/core/split-email.ts`, `src/core/split-email.test.ts`

- [ ] **Step 1: Write the failing test** (ported from legacy spec, `false` → `null`)

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/core/split-email.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/core/split-email.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/split-email.ts src/core/split-email.test.ts
git commit -m "feat(core): add splitEmail returning null on invalid input"
```

---

## Task 5: `findClosestDomain`

**Files:**
- Create: `src/core/find-closest.ts`, `src/core/find-closest.test.ts`

- [ ] **Step 1: Write the failing test** (ported)

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/core/find-closest.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/core/find-closest.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/find-closest.ts src/core/find-closest.test.ts
git commit -m "feat(core): add findClosestDomain"
```

---

## Task 6: Default domain lists

**Files:**
- Create: `src/core/defaults.ts`

- [ ] **Step 1: Write the lists** (ported from legacy `defaultDomains` etc.)

```ts
export const defaultDomains: string[] = [
  "msn.com", "bellsouth.net", "telus.net", "comcast.net", "optusnet.com.au",
  "earthlink.net", "qq.com", "sky.com", "icloud.com", "mac.com", "sympatico.ca",
  "googlemail.com", "att.net", "xtra.co.nz", "web.de", "cox.net", "gmail.com",
  "ymail.com", "aim.com", "rogers.com", "verizon.net", "rocketmail.com",
  "google.com", "optonline.net", "sbcglobal.net", "aol.com", "me.com",
  "btinternet.com", "charter.net", "shaw.ca",
];

export const defaultSecondLevelDomains: string[] = [
  "yahoo", "hotmail", "mail", "live", "outlook", "gmx",
];

export const defaultTopLevelDomains: string[] = [
  "com", "com.au", "com.tw", "ca", "co.nz", "co.uk", "de", "fr", "it", "ru",
  "net", "org", "edu", "gov", "jp", "nl", "kr", "se", "eu", "ie", "co.il", "us",
  "at", "be", "dk", "hk", "es", "gr", "ch", "no", "cz", "in", "net.au", "info",
  "biz", "mil", "co.jp", "sg", "hu", "uk",
];
```

- [ ] **Step 2: Commit**

```bash
git add src/core/defaults.ts
git commit -m "feat(core): add default domain lists"
```

---

## Task 7: `suggest`

**Files:**
- Create: `src/core/suggest.ts`, `src/core/suggest.test.ts`

- [ ] **Step 1: Write the failing test** (ported from legacy `cases` + `return value`, adapted to options object + `null`)

```ts
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

  it("does not leak threshold state across calls", () => {
    suggest({ email: "test@gmail.co", domains, domainThreshold: 10 });
    expect(suggest({ email: "test@x.com", domains })).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/core/suggest.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```ts
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

  let closestDomain = findClosestDomain(
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/core/suggest.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/suggest.ts src/core/suggest.test.ts
git commit -m "feat(core): add suggest()"
```

---

## Task 8: Core barrel export

**Files:**
- Create: `src/core/index.ts`

- [ ] **Step 1: Write the barrel**

```ts
export { suggest } from "./suggest";
export { sift4Distance } from "./sift4";
export { splitEmail } from "./split-email";
export { findClosestDomain } from "./find-closest";
export { encodeEmail } from "./encode-email";
export {
  defaultDomains,
  defaultSecondLevelDomains,
  defaultTopLevelDomains,
} from "./defaults";
export type {
  Suggestion,
  EmailParts,
  DistanceFunction,
  MailcheckOptions,
} from "./types";
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/core/index.ts
git commit -m "feat(core): add public barrel export"
```

---

## Task 9: `useMailcheck` hook

**Files:**
- Create: `src/react/use-mailcheck.ts`, `src/react/use-mailcheck.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useMailcheck } from "./use-mailcheck";

describe("useMailcheck", () => {
  it("returns a suggestion synchronously when debounce is 0", () => {
    const { result } = renderHook(() => useMailcheck("test@gmial.com"));
    expect(result.current?.full).toBe("test@gmail.com");
  });

  it("returns null when there is no suggestion", () => {
    const { result } = renderHook(() => useMailcheck("test@gmail.com"));
    expect(result.current).toBeNull();
  });

  it("debounces when debounceMs is set", async () => {
    const { result } = renderHook(() => useMailcheck("test@gmial.com", { debounceMs: 50 }));
    expect(result.current).toBeNull();
    await waitFor(() => expect(result.current?.full).toBe("test@gmail.com"));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/react/use-mailcheck.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```ts
"use client";

import { useEffect, useMemo, useState } from "react";
import { suggest } from "../core/suggest";
import type { MailcheckOptions, Suggestion } from "../core/types";

export type UseMailcheckOptions = Omit<MailcheckOptions, "email"> & {
  debounceMs?: number;
};

export function useMailcheck(
  email: string,
  options: UseMailcheckOptions = {},
): Suggestion | null {
  const { debounceMs = 0, ...suggestOptions } = options;

  // Serialize option arrays so the effect/memo only re-run on real changes.
  const optionsKey = JSON.stringify(suggestOptions);

  const immediate = useMemo(
    () => (debounceMs > 0 ? null : suggest({ email, ...suggestOptions })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [email, debounceMs, optionsKey],
  );

  const [debounced, setDebounced] = useState<Suggestion | null>(null);

  useEffect(() => {
    if (debounceMs <= 0) {
      return;
    }
    const timer = setTimeout(() => {
      setDebounced(suggest({ email, ...suggestOptions }));
    }, debounceMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, debounceMs, optionsKey]);

  return debounceMs > 0 ? debounced : immediate;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/react/use-mailcheck.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/react/use-mailcheck.ts src/react/use-mailcheck.test.tsx
git commit -m "feat(react): add useMailcheck hook"
```

---

## Task 10: `<MailcheckSuggestion>` component

**Files:**
- Create: `src/react/MailcheckSuggestion.tsx`, `src/react/MailcheckSuggestion.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MailcheckSuggestion } from "./MailcheckSuggestion";

describe("MailcheckSuggestion", () => {
  it("calls children with the suggestion", () => {
    render(
      <MailcheckSuggestion email="test@gmial.com">
        {(s) => <span>{s ? s.full : "none"}</span>}
      </MailcheckSuggestion>,
    );
    expect(screen.getByText("test@gmail.com")).toBeTruthy();
  });

  it("calls children with null when there is no suggestion", () => {
    render(
      <MailcheckSuggestion email="test@gmail.com">
        {(s) => <span>{s ? s.full : "none"}</span>}
      </MailcheckSuggestion>,
    );
    expect(screen.getByText("none")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/react/MailcheckSuggestion.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```tsx
"use client";

import type { ReactNode } from "react";
import { useMailcheck, type UseMailcheckOptions } from "./use-mailcheck";
import type { Suggestion } from "../core/types";

export interface MailcheckSuggestionProps extends UseMailcheckOptions {
  email: string;
  children: (suggestion: Suggestion | null) => ReactNode;
}

export function MailcheckSuggestion({
  email,
  children,
  ...options
}: MailcheckSuggestionProps): ReactNode {
  const suggestion = useMailcheck(email, options);
  return children(suggestion);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/react/MailcheckSuggestion.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/react/MailcheckSuggestion.tsx src/react/MailcheckSuggestion.test.tsx
git commit -m "feat(react): add headless MailcheckSuggestion component"
```

---

## Task 11: React barrel + SSR safety test

**Files:**
- Create: `src/react/index.ts`, `src/react/ssr.test.ts`

- [ ] **Step 1: Write the SSR-safety test**

```ts
import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { MailcheckSuggestion } from "./MailcheckSuggestion";

describe("SSR safety", () => {
  it("renders to a string without a DOM/window", () => {
    const html = renderToString(
      createElement(
        MailcheckSuggestion,
        { email: "test@gmial.com" },
        (s: { full: string } | null) => createElement("span", null, s ? s.full : "none"),
      ),
    );
    expect(html).toContain("test@gmail.com");
  });
});
```

Note: this test stays in jsdom env but exercises the server renderer; the core/hook must not throw without real browser APIs. `react-dom/server` is available via the `react-dom` devDependency.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/react/ssr.test.ts`
Expected: FAIL (no barrel yet is fine; this imports the component directly, so it tests SSR). If it passes already, proceed — it documents the guarantee.

- [ ] **Step 3: Write the barrel**

```ts
export { useMailcheck } from "./use-mailcheck";
export type { UseMailcheckOptions } from "./use-mailcheck";
export { MailcheckSuggestion } from "./MailcheckSuggestion";
export type { MailcheckSuggestionProps } from "./MailcheckSuggestion";
export type { Suggestion, MailcheckOptions } from "../core/types";
```

- [ ] **Step 4: Run full suite + typecheck**

Run: `pnpm test && pnpm typecheck`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/react/index.ts src/react/ssr.test.ts
git commit -m "feat(react): add barrel and SSR-safety test"
```

---

## Task 12: Build verification

**Files:** none (verification only)

- [ ] **Step 1: Build**

Run: `pnpm build`
Expected: `dist/core/index.{js,cjs,d.ts}` and `dist/react/index.{js,cjs,d.ts}` produced, no errors.

- [ ] **Step 2: Size check**

Run: `pnpm size`
Expected: core under 3 kB limit.

- [ ] **Step 3: Lint**

Run: `pnpm lint`
Expected: no errors. Fix any inline.

- [ ] **Step 4: Commit any lint fixes**

```bash
git add -A
git commit -m "chore: pass lint and build verification" || echo "nothing to commit"
```

---

## Task 13: CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Write the workflow** (SHA-pinned third-party actions per SECURITY.md)

```yaml
name: CI

on:
  push:
    branches: [master]
  pull_request:

permissions:
  contents: read

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node: [20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@fe02b34f77f8bc703788d5817da081398fad5dd2 # v4.0.0
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
      - run: pnpm size
```

Note: replace the `pnpm/action-setup` SHA with the current one for v4 before committing, via:
`gh api repos/pnpm/action-setup/git/ref/tags/v4.0.0 --jq .object.sha`

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add hardened CI workflow"
```

---

## Task 14: Release workflow (OIDC trusted publishing)

**Files:**
- Create: `.github/workflows/release.yml`

- [ ] **Step 1: Write the workflow**

```yaml
name: Release

on:
  push:
    tags: ["v*"]

permissions:
  contents: read

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@fe02b34f77f8bc703788d5817da081398fad5dd2 # v4.0.0
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          registry-url: https://registry.npmjs.org
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm test
      - run: pnpm build
      - run: npm publish --provenance --access public
```

Note: confirm the `pnpm/action-setup` SHA matches the one in `ci.yml`. OIDC trusted publishing must be configured on the npm package settings; no `NPM_TOKEN` secret is used.

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/release.yml
git commit -m "ci: add OIDC trusted-publishing release workflow"
```

---

## Task 15: README + changesets

**Files:**
- Create: `README.md` (replace), `.changeset/config.json`

- [ ] **Step 1: Replace README** with modern usage

Document: install (`pnpm add mailcheck`), core usage (`import { suggest } from "mailcheck"`), React usage (`import { useMailcheck, MailcheckSuggestion } from "mailcheck/react"`), a Next.js App Router note that the hook/component are client components (`"use client"`), options table, and the zero-dependency / tree-shakeable selling points.

- [ ] **Step 2: Write `.changeset/config.json`**

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "master",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

- [ ] **Step 3: Commit**

```bash
git add README.md .changeset/config.json
git commit -m "docs: rewrite README for modern usage; add changesets config"
```

---

## Final verification

- [ ] Run `pnpm install && pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm size` — all green.
- [ ] Confirm `dist/core` and `dist/react` exist with `.d.ts` files.
- [ ] Confirm no legacy files remain (`Gruntfile.coffee`, jQuery source, Jasmine spec).
