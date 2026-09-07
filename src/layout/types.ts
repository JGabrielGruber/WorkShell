export const STORAGE_KEY = "workshell.layout.v1";

export const SNAP_EDGE_PX = 40;
export const FLOAT_OUT_THRESHOLD_PX = 8;
export const MIN_FLOAT_W = 240;
export const MIN_FLOAT_H = 160;
export const DEFAULT_LEFT_W = 320;
export const DEFAULT_RIGHT_W = 360;
export const TASKBAR_H = 64;
export const TASKBAR_GAP = 12;
export const DEFAULT_FLOAT = { x: 96, y: 48, w: 720, h: 520 } as const;

export const KNOWN_IDS = ["task-104"] as const;
export type KnownId = (typeof KNOWN_IDS)[number];

export const PANEL_META: Record<KnownId, { title: string }> = {
  "task-104": { title: "TASK-104" },
};

export type SlotId = "left" | "center" | "right";
export type Mode = "dock" | "float" | "overlay" | "maximized" | "hidden";

export type PanelState = {
  id: string;
  uid: string;
  title: string;
  mode: Mode;
  slot?: SlotId;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  restore?: { mode: Mode; slot?: SlotId };
};

export type SlotState = {
  width: number;
  order: string[];
  activeId: string | null;
};

export type OverlayState = {
  id: string;
  restore: { mode: Mode; slot?: SlotId };
} | null;

export type LayoutState = {
  version: 2;
  slots: {
    left: SlotState;
    center: SlotState;
    right: SlotState;
  };
  panels: Record<string, PanelState>;
  overlay: OverlayState;
  closed: string[];
  nextZ: number;
};

export function seedLayout(): LayoutState {
  const float = DEFAULT_FLOAT;
  return {
    version: 2,
    slots: {
      left: { width: DEFAULT_LEFT_W, order: [], activeId: null },
      center: { width: 0, order: [], activeId: null },
      right: { width: DEFAULT_RIGHT_W, order: [], activeId: null },
    },
    panels: {
      "task-104": {
        id: "task-104",
        uid: "",
        title: PANEL_META["task-104"].title,
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
