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
