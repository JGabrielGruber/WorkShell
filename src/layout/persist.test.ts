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
    expect(s.version).toBe(2);
    expect(s.panels["task-104"].mode).toBe("float");
    expect(s.slots.left.order).toEqual([]);
  });

  it("seeds when JSON is corrupt", () => {
    const storage = mem({ [STORAGE_KEY]: "{not json" });
    expect(loadLayout(storage).version).toBe(2);
    expect(loadLayout(storage).panels["task-104"].title).toBe("TASK-104");
  });

  it("seeds when version is not 2", () => {
    const storage = mem({ [STORAGE_KEY]: JSON.stringify({ version: 1, panels: {} }) });
    expect(loadLayout(storage).panels["task-104"].id).toBe("task-104");
    expect(loadLayout(storage).slots.right.order).toEqual([]);
  });

  it("round-trips float rect, hidden restore, and closed ids", () => {
    const storage = mem();
    const state = seedLayout();
    state.panels["task-104"].x = 44;
    state.panels["task-104"].mode = "hidden";
    state.panels["task-104"].restore = { mode: "maximized" };
    state.closed = ["task-104"];
    delete state.panels["task-104"];
    saveLayout(storage, state);
    const loaded = loadLayout(storage);
    expect(loaded.closed).toEqual(["task-104"]);
    expect(loaded.panels["task-104"]).toBeUndefined();
  });

  it("keeps hidden restore on a live panel", () => {
    const storage = mem();
    const state = seedLayout();
    state.panels["task-104"].mode = "hidden";
    state.panels["task-104"].restore = { mode: "maximized" };
    state.panels["task-104"].x = 80;
    saveLayout(storage, state);
    const loaded = loadLayout(storage);
    expect(loaded.panels["task-104"].mode).toBe("hidden");
    expect(loaded.panels["task-104"].restore).toEqual({ mode: "maximized" });
    expect(loaded.panels["task-104"].x).toBe(80);
  });

  it("drops unknown panel ids", () => {
    const storage = mem();
    const state = seedLayout() as ReturnType<typeof seedLayout> & {
      panels: Record<string, unknown>;
    };
    state.panels.ghost = {
      id: "ghost",
      uid: "x",
      title: "Ghost",
      mode: "float",
      x: 0,
      y: 0,
      w: 10,
      h: 10,
      z: 1,
    };
    state.slots.left.order = ["ghost", "task-104"];
    state.closed = ["nope"];
    saveLayout(storage, state as ReturnType<typeof seedLayout>);
    const loaded = loadLayout(storage);
    expect(loaded.panels.ghost).toBeUndefined();
    expect(loaded.slots.left.order).toEqual(["task-104"]);
    expect(loaded.closed).toEqual([]);
  });
});
