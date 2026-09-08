import { describe, expect, it } from "vitest";
import { fixtureSeed } from "./fixture-seed";
import { loadLayout, saveLayout } from "./persist";
import { STORAGE_KEY } from "./types";

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
    const s = loadLayout(mem(), fixtureSeed);
    expect(s.version).toBe(2);
    expect(s.panels.alpha.mode).toBe("float");
    expect(s.slots.left.order).toEqual([]);
    expect(s.panels["task-104"]).toBeUndefined();
  });

  it("seeds when JSON is corrupt", () => {
    const storage = mem({ [STORAGE_KEY]: "{not json" });
    expect(loadLayout(storage, fixtureSeed).version).toBe(2);
    expect(loadLayout(storage, fixtureSeed).panels.alpha.title).toBe("Alpha");
  });

  it("seeds when version is not 2", () => {
    const storage = mem({ [STORAGE_KEY]: JSON.stringify({ version: 1, panels: {} }) });
    expect(loadLayout(storage, fixtureSeed).panels.alpha.id).toBe("alpha");
    expect(loadLayout(storage, fixtureSeed).slots.right.order).toEqual([]);
  });

  it("round-trips float rect, hidden restore, and closed ids", () => {
    const storage = mem();
    const state = fixtureSeed();
    state.closed = ["alpha"];
    delete state.panels.alpha;
    saveLayout(storage, state);
    const loaded = loadLayout(storage, fixtureSeed);
    expect(loaded.closed).toEqual(["alpha"]);
    expect(loaded.panels.alpha).toBeUndefined();
  });

  it("keeps hidden restore on a live panel", () => {
    const storage = mem();
    const state = fixtureSeed();
    state.panels.alpha.mode = "hidden";
    state.panels.alpha.restore = { mode: "maximized" };
    state.panels.alpha.x = 80;
    saveLayout(storage, state);
    const loaded = loadLayout(storage, fixtureSeed);
    expect(loaded.panels.alpha.mode).toBe("hidden");
    expect(loaded.panels.alpha.restore).toEqual({ mode: "maximized" });
    expect(loaded.panels.alpha.x).toBe(80);
  });

  it("keeps well-formed panel ids that are not in the seed", () => {
    const storage = mem();
    const state = fixtureSeed();
    state.panels.ghost = {
      id: "ghost",
      uid: "x",
      title: "Ghost",
      mode: "float",
      x: 10,
      y: 20,
      w: 300,
      h: 220,
      z: 4,
    };
    state.slots.left.order = ["ghost", "alpha"];
    state.closed = ["nope"];
    saveLayout(storage, state);
    const loaded = loadLayout(storage, fixtureSeed);
    expect(loaded.panels.ghost).toMatchObject({
      id: "ghost",
      title: "Ghost",
      mode: "float",
      x: 10,
      y: 20,
      w: 300,
      h: 220,
    });
    expect(loaded.slots.left.order).toEqual(["ghost", "alpha"]);
    expect(loaded.closed).toEqual([]);
  });

  it("drops stored panels that are not objects", () => {
    const storage = mem();
    const state = fixtureSeed();
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...state, panels: { ...state.panels, ghost: "nope" } }),
    );
    const loaded = loadLayout(storage, fixtureSeed);
    expect(loaded.panels.ghost).toBeUndefined();
    expect(loaded.panels.alpha).toBeDefined();
  });
});
