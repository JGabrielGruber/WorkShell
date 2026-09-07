import { describe, expect, it } from "vitest";
import { KNOWN_IDS, STORAGE_KEY, seedLayout } from "./types";

describe("seedLayout", () => {
  it("seeds the five panels into the spec slots", () => {
    const s = seedLayout();
    expect(s.version).toBe(1);
    expect(STORAGE_KEY).toBe("projthread.layout.v1");
    expect([...KNOWN_IDS]).toEqual(["backlog", "sprint", "chat", "spec", "metrics"]);
    expect(s.slots.left).toEqual({
      width: 320,
      order: ["backlog"],
      activeId: "backlog",
    });
    expect(s.slots.center).toEqual({
      width: 0,
      order: ["sprint", "chat"],
      activeId: "sprint",
    });
    expect(s.slots.right).toEqual({
      width: 360,
      order: ["spec"],
      activeId: "spec",
    });
    expect(s.panels.backlog.mode).toBe("dock");
    expect(s.panels.backlog.slot).toBe("left");
    expect(s.panels.sprint.mode).toBe("dock");
    expect(s.panels.chat.mode).toBe("dock");
    expect(s.panels.chat.slot).toBe("center");
    expect(s.panels.spec.mode).toBe("dock");
    expect(s.panels.spec.slot).toBe("right");
    expect(s.panels.metrics.mode).toBe("float");
    expect(s.panels.metrics.w).toBe(420);
    expect(s.panels.metrics.h).toBe(280);
    expect(s.overlay).toBeNull();
    expect(s.closed).toEqual([]);
  });
});
