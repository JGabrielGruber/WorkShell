import { describe, expect, it } from "vitest";
import { KNOWN_IDS, STORAGE_KEY, seedLayout } from "./seed";

describe("seedLayout", () => {
  it("seeds task-104 floating with empty slots", () => {
    const s = seedLayout();
    expect(s.version).toBe(2);
    expect(STORAGE_KEY).toBe("workshell.layout.v1");
    expect([...KNOWN_IDS]).toEqual(["task-104"]);
    expect(s.slots.left).toEqual({ width: 320, order: [], activeId: null });
    expect(s.slots.center).toEqual({ width: 0, order: [], activeId: null });
    expect(s.slots.right).toEqual({ width: 360, order: [], activeId: null });
    expect(s.overlay).toBeNull();
    expect(s.closed).toEqual([]);
    expect(s.panels["task-104"]).toMatchObject({
      id: "task-104",
      title: "TASK-104",
      mode: "float",
      x: 96,
      y: 48,
      w: 720,
      h: 520,
      z: 2,
    });
    expect(s.panels["task-104"].restore).toBeUndefined();
    expect(s.panels.backlog).toBeUndefined();
  });
});
