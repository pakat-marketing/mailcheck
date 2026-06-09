import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { MailcheckSuggestion } from "./MailcheckSuggestion";
import type { Suggestion } from "../core/types";

describe("SSR safety", () => {
  it("renders to a string without relying on browser APIs", () => {
    const html = renderToString(
      createElement(MailcheckSuggestion, {
        email: "test@gmial.com",
        children: (s: Suggestion | null) =>
          createElement("span", null, s ? s.full : "none"),
      }),
    );
    expect(html).toContain("test@gmail.com");
  });
});
