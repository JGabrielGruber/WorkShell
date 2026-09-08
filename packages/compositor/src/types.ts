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
export const CASCADE_PX = 28;

export type OpenOptions = { title?: string };

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
