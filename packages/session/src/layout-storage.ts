import { STORAGE_KEY } from "@workshell/compositor";

type SlotLike = {
  width?: unknown;
  order?: unknown;
  activeId?: unknown;
};

function filterSlot(slot: SlotLike | undefined, allowed: Set<string>): SlotLike | undefined {
  if (!slot || typeof slot !== "object") return slot;
  const order = Array.isArray(slot.order)
    ? slot.order.filter((id): id is string => typeof id === "string" && allowed.has(id))
    : [];
  const activeId =
    typeof slot.activeId === "string" && order.includes(slot.activeId) ? slot.activeId : null;
  return { ...slot, order, activeId };
}

export function wrapLayoutStorage(inner: Storage, allowlist: () => Set<string>): Storage {
  return {
    get length() {
      return inner.length;
    },
    clear: () => inner.clear(),
    key: (i: number) => inner.key(i),
    removeItem: (k: string) => inner.removeItem(k),
    setItem: (k: string, v: string) => inner.setItem(k, v),
    getItem(k: string) {
      const raw = inner.getItem(k);
      if (k !== STORAGE_KEY || raw == null) return raw;
      try {
        const parsed = JSON.parse(raw) as {
          slots?: { left?: SlotLike; center?: SlotLike; right?: SlotLike };
          panels?: Record<string, unknown>;
          overlay?: { id?: unknown } | null;
          closed?: unknown;
        };
        if (!parsed || typeof parsed !== "object") return raw;
        const allowed = allowlist();
        const panels: Record<string, unknown> = {};
        for (const [id, panel] of Object.entries(parsed.panels ?? {})) {
          if (allowed.has(id)) panels[id] = panel;
        }
        const closed = Array.isArray(parsed.closed)
          ? parsed.closed.filter((id): id is string => typeof id === "string" && allowed.has(id))
          : [];
        const overlayId = parsed.overlay && typeof parsed.overlay.id === "string" ? parsed.overlay.id : null;
        const overlay = overlayId && allowed.has(overlayId) ? parsed.overlay : null;
        const slots = parsed.slots
          ? {
              ...parsed.slots,
              left: filterSlot(parsed.slots.left, allowed),
              center: filterSlot(parsed.slots.center, allowed),
              right: filterSlot(parsed.slots.right, allowed),
            }
          : parsed.slots;
        return JSON.stringify({ ...parsed, slots, panels, overlay, closed });
      } catch {
        return raw;
      }
    },
  };
}
