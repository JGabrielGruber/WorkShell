import {
  type LayoutState,
  type Mode,
  type PanelState,
  type SlotId,
  type SlotState,
  STORAGE_KEY,
} from "./types";

function isSlotId(v: unknown): v is SlotId {
  return v === "left" || v === "center" || v === "right";
}

function isMode(v: unknown): v is Mode {
  return v === "dock" || v === "float" || v === "overlay" || v === "maximized" || v === "hidden";
}

function sanitizeSlot(
  slot: SlotState | undefined,
  fallbackWidth: number,
  known: Set<string>,
): SlotState {
  const width = typeof slot?.width === "number" ? slot.width : fallbackWidth;
  const order = (slot?.order ?? []).filter((id) => known.has(id));
  const activeId =
    slot?.activeId && order.includes(slot.activeId) ? slot.activeId : (order[0] ?? null);
  return { width, order, activeId };
}

function sanitizePanel(id: string, raw: PanelState): PanelState {
  return {
    id,
    uid: typeof raw.uid === "string" ? raw.uid : "",
    title: typeof raw.title === "string" ? raw.title : id,
    mode: isMode(raw.mode) ? raw.mode : "float",
    slot: isSlotId(raw.slot) ? raw.slot : undefined,
    x: typeof raw.x === "number" ? raw.x : 120,
    y: typeof raw.y === "number" ? raw.y : 96,
    w: typeof raw.w === "number" ? raw.w : 420,
    h: typeof raw.h === "number" ? raw.h : 280,
    z: typeof raw.z === "number" ? raw.z : 1,
    restore:
      raw.restore && isMode(raw.restore.mode)
        ? {
            mode: raw.restore.mode,
            slot: isSlotId(raw.restore.slot) ? raw.restore.slot : undefined,
          }
        : undefined,
  };
}

export function sanitizeLayout(parsed: LayoutState, seed: () => LayoutState): LayoutState {
  if (!parsed.slots || !parsed.panels) return seed();
  const seedIds = Object.keys(seed().panels);
  const panels: Record<string, PanelState> = {};
  for (const id of Object.keys(parsed.panels)) {
    if (!id) continue;
    const raw = parsed.panels[id];
    if (!raw || typeof raw !== "object") continue;
    panels[id] = sanitizePanel(id, raw);
  }
  const known = new Set([...seedIds, ...Object.keys(panels)]);
  const closedKnown = (parsed.closed ?? []).filter((id) => known.has(id));
  const overlayRaw = parsed.overlay;
  const overlay =
    overlayRaw && known.has(overlayRaw.id) && panels[overlayRaw.id]
      ? {
          id: overlayRaw.id,
          restore: {
            mode: isMode(overlayRaw.restore?.mode) ? overlayRaw.restore.mode : "float",
            slot: isSlotId(overlayRaw.restore?.slot) ? overlayRaw.restore.slot : undefined,
          },
        }
      : null;
  return {
    version: 2,
    slots: {
      left: sanitizeSlot(parsed.slots.left, 320, known),
      center: sanitizeSlot(parsed.slots.center, 0, known),
      right: sanitizeSlot(parsed.slots.right, 360, known),
    },
    panels,
    overlay,
    closed: closedKnown,
    nextZ: typeof parsed.nextZ === "number" ? parsed.nextZ : 3,
  };
}

export function loadLayout(storage: Storage, seed: () => LayoutState): LayoutState {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return seed();
  try {
    const parsed = JSON.parse(raw) as LayoutState;
    if (parsed?.version !== 2) return seed();
    return sanitizeLayout(parsed, seed);
  } catch {
    return seed();
  }
}

export function saveLayout(storage: Storage, state: LayoutState): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}
