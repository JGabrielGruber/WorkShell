import { describe, expect, it } from "vitest";
import { PREFS_KEY, readPrefs } from "./prefs";

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

describe("readPrefs", () => {
  it("returns null when missing", () => {
    expect(readPrefs(mem())).toBeNull();
  });

  it("returns null on bad JSON", () => {
    const s = mem();
    s.setItem(PREFS_KEY, "{");
    expect(readPrefs(s)).toBeNull();
  });

  it("returns null on bad version", () => {
    const s = mem();
    s.setItem(PREFS_KEY, JSON.stringify({ version: 2, theme: "aetheris-prism" }));
    expect(readPrefs(s)).toBeNull();
  });

  it("returns null on empty theme", () => {
    const s = mem();
    s.setItem(PREFS_KEY, JSON.stringify({ version: 1, theme: "" }));
    expect(readPrefs(s)).toBeNull();
  });

  it("returns v1 theme", () => {
    const s = mem();
    s.setItem(PREFS_KEY, JSON.stringify({ version: 1, theme: "aetheris-prism" }));
    expect(readPrefs(s)).toEqual({ version: 1, theme: "aetheris-prism" });
  });
});
