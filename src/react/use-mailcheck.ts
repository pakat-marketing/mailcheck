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

  // Serialize options so effect/memo only re-run when their contents change,
  // not on every new object identity passed by the caller.
  const optionsKey = JSON.stringify(suggestOptions);

  const immediate = useMemo(
    () => (debounceMs > 0 ? null : suggest({ email, ...suggestOptions })),
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
  }, [email, debounceMs, optionsKey]);

  return debounceMs > 0 ? debounced : immediate;
}
