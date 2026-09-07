export type { EngineHosts } from "./hosts";
export type {
  LayoutState,
  PanelState,
  Mode,
  SlotId,
  SlotState,
  OverlayState,
} from "./types";
export {
  STORAGE_KEY,
  SNAP_EDGE_PX,
  FLOAT_OUT_THRESHOLD_PX,
  MIN_FLOAT_W,
  MIN_FLOAT_H,
  DEFAULT_LEFT_W,
  DEFAULT_RIGHT_W,
  TASKBAR_H,
  TASKBAR_GAP,
  DEFAULT_FLOAT,
} from "./types";
export { loadLayout, saveLayout, sanitizeLayout } from "./persist";
export { WorkspaceEngine, snapZone } from "./engine";

