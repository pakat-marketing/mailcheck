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
