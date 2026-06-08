# mailcheck

Suggest a corrected domain when your users misspell their email address. When
someone types `user@gmial.con`, mailcheck suggests `user@gmail.com`.

- **Framework-agnostic core** — pure, synchronous, **zero runtime dependencies**.
  Runs in Node, the browser, edge runtimes, and any framework.
- **First-class React** — a `useMailcheck` hook and a headless
  `<MailcheckSuggestion>` component, shipped as a separate `mailcheck/react` entry.
- **TypeScript** — full type definitions, dual ESM/CJS, tree-shakeable.
- **SSR-safe** — no `window` access; works in Next.js App Router / React Server
  Components out of the box.

## Install

```sh
pnpm add mailcheck
# or: npm install mailcheck / yarn add mailcheck
```

`react` is an optional peer dependency — only required if you import
`mailcheck/react`.

## Core usage (any framework, or none)

```ts
import { suggest } from "mailcheck";

const result = suggest({ email: "user@gmial.con" });
// => { address: "user", domain: "gmail.com", full: "user@gmail.com" }

const none = suggest({ email: "user@gmail.com" });
// => null
```

`suggest()` returns a `Suggestion` or `null`. It never throws — invalid or empty
input simply yields `null`.

### Options

| Option                 | Type                               | Default                     | Description                              |
| ---------------------- | ---------------------------------- | --------------------------- | ---------------------------------------- |
| `email`                | `string`                           | —                           | The email to check (required).           |
| `domains`              | `string[]`                         | `defaultDomains`            | Full domains to match against.           |
| `secondLevelDomains`   | `string[]`                         | `defaultSecondLevelDomains` | Second-level domains (e.g. `gmail`).     |
| `topLevelDomains`      | `string[]`                         | `defaultTopLevelDomains`    | Top-level domains (e.g. `com`, `co.uk`). |
| `distanceFunction`     | `(a: string, b: string) => number` | `sift4Distance`             | String-distance function.                |
| `domainThreshold`      | `number`                           | `2`                         | Max distance for a full-domain match.    |
| `secondLevelThreshold` | `number`                           | `2`                         | Max distance for a second-level match.   |
| `topLevelThreshold`    | `number`                           | `2`                         | Max distance for a top-level match.      |

The default domain lists are exported if you want to extend them:

```ts
import { defaultDomains, suggest } from "mailcheck";

suggest({ email: "user@mycompany.con", domains: [...defaultDomains, "mycompany.com"] });
```

Lower-level building blocks are exported too: `sift4Distance`, `splitEmail`,
`findClosestDomain`, `encodeEmail`.

## React usage

> The `mailcheck/react` entry is a **client module** (`"use client"`). In Next.js
> App Router, import it from a client component, or from a server component that
> renders it as a child — the directive is already baked into the package.

### Hook

```tsx
import { useState } from "react";
import { useMailcheck } from "mailcheck/react";

function EmailField() {
  const [email, setEmail] = useState("");
  const suggestion = useMailcheck(email, { debounceMs: 150 });

  return (
    <div>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      {suggestion && (
        <button type="button" onClick={() => setEmail(suggestion.full)}>
          Did you mean {suggestion.full}?
        </button>
      )}
    </div>
  );
}
```

`useMailcheck(email, options?)` accepts every core option plus `debounceMs`
(default `0`). With `debounceMs: 0` it computes synchronously during render; with a
positive value it debounces and cancels pending work on unmount or input change.

### Headless component

`<MailcheckSuggestion>` uses a render-prop so you own all markup and styling:

```tsx
import { MailcheckSuggestion } from "mailcheck/react";

<MailcheckSuggestion email={email} debounceMs={150}>
  {(suggestion) =>
    suggestion && (
      <button type="button" onClick={() => setEmail(suggestion.full)}>
        Did you mean {suggestion.full}?
      </button>
    )
  }
</MailcheckSuggestion>;
```

## API reference

```ts
interface Suggestion {
  address: string; // local part, e.g. "user"
  domain: string;  // corrected domain, e.g. "gmail.com"
  full: string;    // "user@gmail.com"
}

function suggest(options: MailcheckOptions): Suggestion | null;

// mailcheck/react
function useMailcheck(
  email: string,
  options?: Omit<MailcheckOptions, "email"> & { debounceMs?: number },
): Suggestion | null;
```

## License

MIT
