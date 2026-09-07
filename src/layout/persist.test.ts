import { describe, expect, it } from "vitest";
import { loadLayout, saveLayout } from "./persist";
import { STORAGE_KEY, seedLayout } from "./types";

function mem(initial?: Record<string, string>): Storage {
  const m = new Map<string, string>(Object.entries(initial ?? {}));
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

describe("persist", () => {
  it("seeds when the key is missing", () => {
    const s = loadLayout(mem());
    expect(s.slots.left.order).toEqual(["backlog"]);
    expect(s.panels.metrics.mode).toBe("float");
  });

  it("seeds when JSON is corrupt", () => {
    const storage = mem({ [STORAGE_KEY]: "{not json" });
    expect(loadLayout(storage).version).toBe(1);
    expect(loadLayout(storage).panels.spec.title).toBe("Spec Viewer");
  });

  it("seeds when version is not 1", () => {
    const storage = mem({ [STORAGE_KEY]: JSON.stringify({ version: 2, panels: {} }) });
    expect(loadLayout(storage).slots.right.order).toEqual(["spec"]);
  });

  it("round-trips slot order, active tabs, float rects, and closed ids", () => {
    const storage = mem();
    const state = seedLayout();
    state.slots.center.activeId = "chat";
    state.panels.metrics.x = 44;
    state.panels.metrics.y = 66;
    state.closed = ["backlog"];
    state.slots.left.order = [];
    state.slots.left.activeId = null;
    delete state.panels.backlog;
    saveLayout(storage, state);
    const loaded = loadLayout(storage);
    expect(loaded.slots.center.activeId).toBe("chat");
    expect(loaded.panels.metrics.x).toBe(44);
    expect(loaded.panels.metrics.y).toBe(66);
    expect(loaded.closed).toEqual(["backlog"]);
    expect(loaded.slots.left.order).toEqual([]);
    expect(loaded.panels.backlog).toBeUndefined();
  });

  it("drops unknown panel ids from panels, orders, overlay, and closed", () => {
    const storage = mem();
    const state = seedLayout() as ReturnType<typeof seedLayout> & {
      panels: Record<string, unknown>;
    };
    state.panels.ghost = {
      id: "ghost",
      uid: "x",
      title: "Ghost",
      mode: "dock",
      slot: "left",
      x: 0,
      y: 0,
      w: 10,
      h: 10,
      z: 1,
    };
    state.slots.left.order = ["backlog", "ghost"];
    state.closed = ["nope"];
    state.overlay = {
      id: "ghost",
      restore: { mode: "dock", slot: "left" },
    };
    saveLayout(storage, state as ReturnType<typeof seedLayout>);
    const loaded = loadLayout(storage);
    expect(loaded.panels.ghost).toBeUndefined();
    expect(loaded.slots.left.order).toEqual(["backlog"]);
    expect(loaded.closed).toEqual([]);
    expect(loaded.overlay).toBeNull();
  });
});
