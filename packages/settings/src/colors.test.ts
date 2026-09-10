import { describe, expect, it } from "vitest";
import { createSession } from "@workshell/session";
import { colorsPage } from "./colors";

function mem(): Storage {
  const m = new Map<string, string>();
  return {
    get length() {
      return m.size;
    },
    clear: () => m.clear(),
    getItem: (k: string) => m.get(k) ?? null,
    key: (i: number) => [...m.keys()][i] ?? null,
    removeItem: (k: string) => {
      m.delete(k);
    },
    setItem: (k: string, v: string) => {
      m.set(k, v);
    },
  };
}

describe("colorsPage", () => {
  it("lists inspect colors for the instance segment", () => {
    const session = createSession({ storage: mem() });
    const ctx = {
      url: new URL("settings:/appearance/theme/base/colors"),
      params: {},
      query: new URLSearchParams(),
      go: () => {},
      back: () => {},
      forward: () => {},
      canGoBack: false,
      canGoForward: false,
    };
    const el = colorsPage(ctx, session);
    expect(el.textContent).toContain("Colors");
    expect(el.textContent).toContain("--color-primary");
  });
});
