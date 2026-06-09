# Mailcheck Modernization — Design

**Date:** 2026-06-08
**Status:** Approved

## Goal

Modernize the legacy Kicksend Mailcheck library into a standard, framework-agnostic
TypeScript package that works out of the box in modern React, Next.js (App Router /
RSC), and any other JS framework or vanilla environment. Clean break from the legacy
API — existing users are not a concern; the jQuery plugin and callback API are removed.

## Non-Goals

- Backward compatibility with the `Mailcheck.run({ suggested, empty })` callback API.
- jQuery plugin support.
- Shipping CSS or opinionated UI styling.
- Changing the underlying suggestion algorithm (sift4 distance) behavior.

## Architecture

Single package `mailcheck`, TypeScript, ESM-first with CJS fallback, split into two
layers with subpath exports so React is never pulled into a vanilla consumer's bundle.

```
mailcheck/
├── src/
│   ├── core/
│   │   ├── suggest.ts        # main suggest() — pure function
│   │   ├── sift4.ts          # sift4 distance (typed)
│   │   ├── split-email.ts    # splitEmail()
│   │   ├── find-closest.ts   # findClosestDomain()
│   │   ├── encode-email.ts   # encodeEmail()
│   │   ├── defaults.ts       # default domain/SLD/TLD lists
│   │   ├── types.ts          # Suggestion, MailcheckOptions, etc.
│   │   └── index.ts          # public core API barrel
│   └── react/
│       ├── use-mailcheck.ts          # useMailcheck() hook (debounced)
│       ├── MailcheckSuggestion.tsx   # headless render-prop component
│       └── index.ts
├── .github/workflows/
│   ├── ci.yml
│   └── release.yml
└── package.json              # exports map: "." and "./react"
```

### Exports map

- `mailcheck` → core. **Zero runtime dependencies.** Runs in Node, browser, edge,
  and any framework.
- `mailcheck/react` → hook + component. `react` is a **peer dependency**.
  The `react` entry carries a `"use client"` boundary; documented for Next.js
  App Router consumers.

### Tooling

- **Package manager:** `pnpm`, with `packageManager` pinned in `package.json`.
- **Build:** `tsup` — dual ESM/CJS output + `.d.ts` declarations.
- **Test:** `vitest` (+ `@testing-library/react`, `jsdom` for the React layer).
- **Typecheck:** `tsc --noEmit`.
- **Lint:** ESLint (TypeScript config).
- **Versioning/changelog:** `changesets`.
- **Bundle budget:** `size-limit` check in CI to keep core tiny and tree-shakeable.

## Public API

### Core (`mailcheck`)

Pure, synchronous, no side effects, no shared mutable state.

```ts
interface Suggestion {
  address: string;   // local part, e.g. "user"
  domain: string;    // corrected domain, e.g. "gmail.com"
  full: string;      // "user@gmail.com"
}

interface MailcheckOptions {
  email: string;
  domains?: string[];               // defaults to defaultDomains
  secondLevelDomains?: string[];    // defaults to defaultSecondLevelDomains
  topLevelDomains?: string[];       // defaults to defaultTopLevelDomains
  distanceFunction?: (a: string, b: string) => number;  // defaults to sift4
  domainThreshold?: number;         // default 2
  secondLevelThreshold?: number;    // default 2
  topLevelThreshold?: number;       // default 2
}

// Primary API — returns the suggestion or null.
function suggest(options: MailcheckOptions): Suggestion | null;

// Lower-level building blocks, all exported & typed:
export { sift4Distance, splitEmail, findClosestDomain, encodeEmail };
export { defaultDomains, defaultSecondLevelDomains, defaultTopLevelDomains };
```

**Changes from legacy:**
- Callback-style `run({ suggested, empty })` removed. `suggest()` returns
  `Suggestion | null`.
- Thresholds move from mutable globals on the `Mailcheck` object to per-call options.
  No shared mutable state across calls.
- Returns `null` instead of `false` when there is no suggestion.
- `splitEmail` returns `null` (not `false`) on invalid input.

### React (`mailcheck/react`)

```ts
function useMailcheck(
  email: string,
  options?: Omit<MailcheckOptions, "email"> & { debounceMs?: number } // default 0
): Suggestion | null;
```

```tsx
<MailcheckSuggestion email={email} debounceMs={150}>
  {(suggestion) =>
    suggestion && (
      <button type="button" onClick={() => setEmail(suggestion.full)}>
        Did you mean {suggestion.full}?
      </button>
    )
  }
</MailcheckSuggestion>
```

Headless (render-prop). No markup or CSS imposed — works in any design system.
SSR-safe: core and hook never touch `window`, so Next.js App Router / RSC render
without error. The hook and component are client components (`"use client"`).

## Data Flow

1. Consumer calls `suggest({ email })` (or the hook receives an `email` string).
2. `encodeEmail` sanitizes input (XSS-safe encoding, preserving valid chars).
3. `splitEmail` parses into `{ address, domain, secondLevelDomain, topLevelDomain }`
   or returns `null` for invalid input.
4. `findClosestDomain` uses the distance function (default `sift4Distance`) against
   each candidate list with the configured thresholds.
5. Returns a `Suggestion` if a closer valid domain is found, else `null`.

The hook wraps `suggest()` with optional debouncing; it computes synchronously when
`debounceMs` is 0 and defers via a timer otherwise. Cleanup cancels pending timers
on unmount / input change.

## Error Handling

- Invalid / empty / non-string emails: `suggest()` returns `null` (never throws).
- Empty candidate lists: handled gracefully, returns `null`.
- The hook never throws during render; bad input simply yields `null`.

## Testing (TDD — tests written first)

Port the legacy Jasmine `spec/mailcheckSpec.js` cases to Vitest as the baseline
behavioral contract, then extend.

- **Core unit tests:** `suggest`, `sift4Distance`, `splitEmail`, `findClosestDomain`,
  `encodeEmail`. Ported cases + edge cases (empty/invalid emails, threshold tuning,
  custom domain lists, verification that no shared state leaks across calls).
- **React tests** (`@testing-library/react` + jsdom): `useMailcheck` debounce
  behavior and cleanup, SSR-safety (renders without `window`), headless component
  render-prop contract.
- **Type tests:** `tsc --noEmit` validates the public types compile as documented.

TDD loop per module: write/port failing test → implement typed module → green →
next. Core is fully covered before the React layer is built.

## CI/CD (per SECURITY.md)

### `ci.yml` (on `pull_request` + `push`)

- pnpm install with `--frozen-lockfile`.
- Steps: typecheck → lint → test → build → size-limit.
- Matrix: Node 20 and 22.
- All third-party actions **SHA-pinned** (40-char) with a `# vX` comment.
  First-party `actions/*` may use major version tags.
- `permissions: contents: read` by default.
- No `pull_request_target`. No cache shared with a privileged job.

### `release.yml` (on tag push `v*`, master only)

- Build, then `npm publish` via **OIDC trusted publishing** with `--provenance`.
- `id-token: write` only on the publish job. No long-lived `NPM_TOKEN`.

## Repo Cleanup (legacy removal)

Remove: `Gruntfile.coffee`, `.travis.yml`, `bower.json`, `mailcheck.jquery.json`,
ghooks config, `src/mailcheck.js`, `src/mailcheck.min.js`, the Jasmine spec runner
(`spec/spec_runner.html`) and `spec/lib`. Replace `package.json` with a modern one.
Add `**/.DS_Store` to `.gitignore`.

## Success Criteria

- `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build` all pass.
- Core has zero runtime dependencies and is importable in Node, browser, and edge.
- `mailcheck/react` works in a Next.js App Router client component without SSR errors.
- Ported legacy behavioral tests pass against the new core.
- CI and release workflows conform to SECURITY.md (SHA-pinned actions, OIDC publish,
  frozen lockfile, least privilege).
