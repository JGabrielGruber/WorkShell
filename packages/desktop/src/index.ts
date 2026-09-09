export { buildWorkspace, slot } from "./chrome";
export { createPanelChrome } from "./panel-chrome";
export { createDesktop } from "./host";
export { mountMenu } from "./menu";

export type {
  EngineHosts,
  LayoutState,
  Mode,
  OpenOptions,
  OverlayState,
  PanelState,
  SlotId,
  SlotState,
} from "@workshell/compositor";
export {
  CASCADE_PX,
  DEFAULT_FLOAT,
  DEFAULT_LEFT_W,
  DEFAULT_RIGHT_W,
  STORAGE_KEY,
  TASKBAR_GAP,
  TASKBAR_H,
  WorkspaceEngine,
  snapZone,
} from "@workshell/compositor";
