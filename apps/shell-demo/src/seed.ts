import {
  CASCADE_PX,
  DEFAULT_FLOAT,
  DEFAULT_LEFT_W,
  DEFAULT_RIGHT_W,
  type LayoutState,
} from "@workshell/desktop-shell";

export { STORAGE_KEY } from "@workshell/desktop-shell";

export const KNOWN_IDS = ["task-104", "probe"] as const;
export type KnownId = (typeof KNOWN_IDS)[number];

export const PANEL_META: Record<KnownId, { title: string }> = {
  "task-104": { title: "TASK-104" },
  probe: { title: "Probe" },
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
      probe: {
        id: "probe",
        uid: "",
        title: PANEL_META.probe.title,
        mode: "float",
        x: float.x + CASCADE_PX,
        y: float.y + CASCADE_PX,
        w: float.w,
        h: float.h,
        z: 3,
      },
    },
    overlay: null,
    closed: [],
    nextZ: 4,
  };
}
