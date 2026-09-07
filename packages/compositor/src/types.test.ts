import { describe, expect, it } from "vitest";
import * as types from "./types";

describe("compositor types", () => {
  it("keeps persist key and float defaults without a product seed", () => {
    expect(types.STORAGE_KEY).toBe("workshell.layout.v1");
    expect(types.DEFAULT_FLOAT).toEqual({ x: 96, y: 48, w: 720, h: 520 });
    expect(types.TASKBAR_H).toBe(64);
    expect(types.TASKBAR_GAP).toBe(12);
    expect("seedLayout" in types).toBe(false);
    expect("KNOWN_IDS" in types).toBe(false);
    expect("PANEL_META" in types).toBe(false);
  });
});
