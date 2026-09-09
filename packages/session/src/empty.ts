import { DEFAULT_LEFT_W, DEFAULT_RIGHT_W, type LayoutState } from "@workshell/compositor";

export function emptyLayout(): LayoutState {
  return {
    version: 2,
    slots: {
      left: { width: DEFAULT_LEFT_W, order: [], activeId: null },
      center: { width: 0, order: [], activeId: null },
      right: { width: DEFAULT_RIGHT_W, order: [], activeId: null },
    },
    panels: {},
    overlay: null,
    closed: [],
    nextZ: 1,
  };
}
