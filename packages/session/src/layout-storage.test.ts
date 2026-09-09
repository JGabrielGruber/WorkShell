import { describe, expect, it } from "vitest";
import { STORAGE_KEY } from "@workshell/compositor";
import { wrapLayoutStorage } from "./layout-storage";
import { PREFS_KEY } from "./prefs";

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

const leftover = {
  version: 2,
  slots: {
    left: { width: 320, order: ["probe"], activeId: "probe" },
    center: { width: 0, order: [], activeId: null },
    right: { width: 360, order: ["task-104"], activeId: "task-104" },
  },
  panels: {
    probe: {
      id: "probe",
      uid: "",
      title: "Probe",
      mode: "float",
      x: 1,
      y: 1,
      w: 100,
      h: 100,
      z: 1,
    },
    fake: {
      id: "fake",
      uid: "",
      title: "Fake",
      mode: "float",
      x: 2,
      y: 2,
      w: 100,
      h: 100,
      z: 2,
    },
  },
  overlay: { id: "probe", restore: { mode: "float" as const } },
  closed: ["task-104", "fake"],
  nextZ: 4,
};

describe("wrapLayoutStorage", () => {
  it("drops ids not in the allowlist on getItem(STORAGE_KEY)", () => {
    const inner = mem();
    inner.setItem(STORAGE_KEY, JSON.stringify(leftover));
    const wrapped = wrapLayoutStorage(inner, () => new Set(["fake"]));
    const parsed = JSON.parse(wrapped.getItem(STORAGE_KEY)!);
    expect(Object.keys(parsed.panels)).toEqual(["fake"]);
    expect(parsed.closed).toEqual(["fake"]);
    expect(parsed.overlay).toBeNull();
    expect(parsed.slots.left.order).toEqual([]);
    expect(parsed.slots.left.activeId).toBeNull();
    expect(parsed.slots.right.order).toEqual([]);
  });

  it("empty allowlist drops all panels", () => {
    const inner = mem();
    inner.setItem(STORAGE_KEY, JSON.stringify(leftover));
    const wrapped = wrapLayoutStorage(inner, () => new Set());
    const parsed = JSON.parse(wrapped.getItem(STORAGE_KEY)!);
    expect(parsed.panels).toEqual({});
    expect(parsed.closed).toEqual([]);
  });

  it("passes PREFS_KEY through", () => {
    const inner = mem();
    inner.setItem(PREFS_KEY, "keep");
    const wrapped = wrapLayoutStorage(inner, () => new Set());
    expect(wrapped.getItem(PREFS_KEY)).toBe("keep");
    wrapped.setItem(PREFS_KEY, "x");
    expect(inner.getItem(PREFS_KEY)).toBe("x");
  });

  it("returns raw on bad JSON", () => {
    const inner = mem();
    inner.setItem(STORAGE_KEY, "{");
    const wrapped = wrapLayoutStorage(inner, () => new Set());
    expect(wrapped.getItem(STORAGE_KEY)).toBe("{");
  });
});
