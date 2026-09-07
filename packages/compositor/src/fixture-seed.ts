import { DEFAULT_FLOAT, DEFAULT_LEFT_W, DEFAULT_RIGHT_W, type LayoutState } from "./types";

export function fixtureSeed(): LayoutState {
  const float = DEFAULT_FLOAT;
  return {
    version: 2,
    slots: {
      left: { width: DEFAULT_LEFT_W, order: [], activeId: null },
      center: { width: 0, order: [], activeId: null },
      right: { width: DEFAULT_RIGHT_W, order: [], activeId: null },
    },
    panels: {
      alpha: {
        id: "alpha",
        uid: "",
        title: "Alpha",
        mode: "float",
        x: float.x,
        y: float.y,
        w: float.w,
        h: float.h,
        z: 2,
      },
    },
    overlay: null,
    closed: [],
    nextZ: 3,
  };
}
