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
    const { result } = renderHook(() =>
      useMailcheck("test@gmial.com", { debounceMs: 50 }),
    );
    expect(result.current).toBeNull();
    await waitFor(() => expect(result.current?.full).toBe("test@gmail.com"));
  });
});
