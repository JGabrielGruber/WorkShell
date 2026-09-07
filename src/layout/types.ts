export const STORAGE_KEY = "projthread.layout.v1";

export const SNAP_EDGE_PX = 40;
export const FLOAT_OUT_THRESHOLD_PX = 8;
export const MIN_FLOAT_W = 240;
export const MIN_FLOAT_H = 160;
export const DEFAULT_LEFT_W = 320;
export const DEFAULT_RIGHT_W = 360;
export const DEFAULT_FLOAT = { x: 120, y: 96, w: 420, h: 280 } as const;

export const KNOWN_IDS = ["backlog", "sprint", "chat", "spec", "metrics"] as const;
export type KnownId = (typeof KNOWN_IDS)[number];

export const PANEL_META: Record<KnownId, { title: string }> = {
  backlog: { title: "Backlog / Ideas" },
  sprint: { title: "Sprint Board" },
  chat: { title: "Task Thread" },
  spec: { title: "Spec Viewer" },
  metrics: { title: "Benchmark Metrics" },
};

export type SlotId = "left" | "center" | "right";
export type Mode = "dock" | "float" | "overlay";

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
  version: 1;
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
    version: 1,
    slots: {
      left: { width: DEFAULT_LEFT_W, order: ["backlog"], activeId: "backlog" },
      center: { width: 0, order: ["sprint", "chat"], activeId: "sprint" },
      right: { width: DEFAULT_RIGHT_W, order: ["spec"], activeId: "spec" },
    },
    panels: {
      backlog: {
        id: "backlog",
        uid: "",
        title: PANEL_META.backlog.title,
        mode: "dock",
        slot: "left",
        x: 80,
        y: 80,
        w: float.w,
        h: float.h,
        z: 1,
      },
      sprint: {
        id: "sprint",
        uid: "",
        title: PANEL_META.sprint.title,
        mode: "dock",
        slot: "center",
        x: 120,
        y: 90,
        w: 520,
        h: 360,
        z: 1,
      },
      chat: {
        id: "chat",
        uid: "",
        title: PANEL_META.chat.title,
        mode: "dock",
        slot: "center",
        x: 160,
        y: 110,
        w: 420,
        h: 480,
        z: 1,
      },
      spec: {
        id: "spec",
        uid: "",
        title: PANEL_META.spec.title,
        mode: "dock",
        slot: "right",
        x: 200,
        y: 100,
        w: 420,
        h: 520,
        z: 1,
      },
      metrics: {
        id: "metrics",
        uid: "",
        title: PANEL_META.metrics.title,
        mode: "float",
        slot: "right",
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
