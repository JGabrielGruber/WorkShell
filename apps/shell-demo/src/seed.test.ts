import { describe, expect, it } from "vitest";
import { CASCADE_PX, DEFAULT_FLOAT } from "@workshell/desktop-shell";
import { KNOWN_IDS, STORAGE_KEY, seedLayout } from "./seed";

describe("seedLayout", () => {
  it("seeds task-104 and probe floating with empty slots", () => {
    const s = seedLayout();
    expect(s.version).toBe(2);
    expect(STORAGE_KEY).toBe("workshell.layout.v1");
    expect([...KNOWN_IDS]).toEqual(["task-104", "probe"]);
    expect(s.slots.left).toEqual({ width: 320, order: [], activeId: null });
    expect(s.slots.center).toEqual({ width: 0, order: [], activeId: null });
    expect(s.slots.right).toEqual({ width: 360, order: [], activeId: null });
    expect(s.overlay).toBeNull();
    expect(s.closed).toEqual([]);
    expect(s.panels["task-104"]).toMatchObject({
      id: "task-104",
      title: "TASK-104",
      mode: "float",
      x: DEFAULT_FLOAT.x,
      y: DEFAULT_FLOAT.y,
      w: DEFAULT_FLOAT.w,
      h: DEFAULT_FLOAT.h,
      z: 2,
    });
    expect(s.panels.probe).toMatchObject({
      id: "probe",
      title: "Probe",
      mode: "float",
      x: DEFAULT_FLOAT.x + CASCADE_PX,
      y: DEFAULT_FLOAT.y + CASCADE_PX,
      w: DEFAULT_FLOAT.w,
      h: DEFAULT_FLOAT.h,
      z: 3,
    });
    expect(s.nextZ).toBe(4);
    expect(s.panels["task-104"].restore).toBeUndefined();
    expect(s.panels.backlog).toBeUndefined();
  });
});
