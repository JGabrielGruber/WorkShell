import type { EngineHosts } from "./chrome";
import { loadLayout, saveLayout } from "./persist";
import {
  DEFAULT_FLOAT,
  MIN_FLOAT_H,
  MIN_FLOAT_W,
  SNAP_EDGE_PX,
  type LayoutState,
  type SlotId,
} from "./types";

export function snapZone(
  clientX: number,
  viewportW: number,
  _leftW: number,
  _rightW: number,
): SlotId | null {
  void _leftW;
  void _rightW;
  if (clientX <= SNAP_EDGE_PX) return "left";
  if (clientX >= viewportW - SNAP_EDGE_PX) return "right";
  const third = viewportW / 3;
  if (clientX >= third && clientX <= third * 2) return "center";
  return null;
}

export class WorkspaceEngine {
  state: LayoutState;
  private nodes = new Map<string, HTMLElement>();

  constructor(
    private hosts: EngineHosts,
    private storage: Storage = localStorage,
  ) {
    this.state = loadLayout(storage);
  }

  node(id: string): HTMLElement {
    const el = this.nodes.get(id);
    if (!el) throw new Error(`unknown panel ${id}`);
    return el;
  }

  boot(createPanel: (id: string) => HTMLElement): void {
    this.applySlotWidths();
    for (const id of Object.keys(this.state.panels)) {
      if (this.state.closed.includes(id)) continue;
      const el = createPanel(id);
      this.nodes.set(id, el);
      this.state.panels[id].uid = el.dataset.uid ?? "";
      this.bindPanel(el);
      this.applyMode(id);
    }
    this.renderTabs();
    this.renderTaskbar();
    this.applyOverlayChrome();
    this.hosts.overlayDim.addEventListener("click", () => {
      if (this.state.overlay?.id) this.restoreOverlay();
    });
  }

  persist(): void {
    saveLayout(this.storage, this.state);
  }

  /**
   * Reparent the same panel node. Never clone, never innerHTML-replace the panel.
   * The node must stay isConnected after this call (unless the host is detached).
   */
  mount(panelEl: HTMLElement, targetHost: HTMLElement): void {
    targetHost.appendChild(panelEl);
    console.info("[workshell] reparent", {
      id: panelEl.dataset.id,
      uid: panelEl.dataset.uid,
      isConnected: panelEl.isConnected,
      parent: targetHost.id || targetHost.dataset.slotBody,
    });
  }

  dock(id: string, slot: SlotId): void {
    const panel = this.state.panels[id];
    if (!panel) return;
    if (this.state.overlay?.id === id) this.state.overlay = null;
    this.removeFromSlots(id);
    panel.mode = "dock";
    panel.slot = slot;
    const s = this.state.slots[slot];
    if (!s.order.includes(id)) s.order.push(id);
    s.activeId = id;
    this.applyMode(id);
    this.activateTab(slot, id, false);
    this.renderTabs();
    this.renderTaskbar();
    this.applyOverlayChrome();
    this.persist();
  }

  float(id: string, rect?: { x: number; y: number; w: number; h: number }): void {
    const panel = this.state.panels[id];
    if (!panel) return;
    if (this.state.overlay?.id === id) this.state.overlay = null;
    this.removeFromSlots(id);
    panel.mode = "float";
    if (rect) {
      panel.x = rect.x;
      panel.y = rect.y;
      panel.w = rect.w;
      panel.h = rect.h;
    } else if (!panel.w || !panel.h) {
      panel.x = DEFAULT_FLOAT.x;
      panel.y = DEFAULT_FLOAT.y;
      panel.w = DEFAULT_FLOAT.w;
      panel.h = DEFAULT_FLOAT.h;
    }
    this.focus(id, false);
    this.applyMode(id);
    this.renderTabs();
    this.renderTaskbar();
    this.applyOverlayChrome();
    this.persist();
  }

  overlay(id: string): void {
    const panel = this.state.panels[id];
    if (!panel) return;
    if (this.state.overlay?.id === id) return;
    this.state.overlay = {
      id,
      restore: { mode: panel.mode, slot: panel.slot },
    };
    this.removeFromSlots(id);
    panel.mode = "overlay";
    this.applyMode(id);
    this.renderTabs();
    this.renderTaskbar();
    this.applyOverlayChrome();
    this.persist();
  }

  restoreOverlay(): void {
    const overlay = this.state.overlay;
    if (!overlay) return;
    const { id, restore } = overlay;
    this.state.overlay = null;
    if (restore.mode === "dock" && restore.slot) this.dock(id, restore.slot);
    else this.float(id);
  }

  close(id: string): void {
    const panel = this.state.panels[id];
    if (!panel) return;
    if (this.state.overlay?.id === id) this.state.overlay = null;
    this.removeFromSlots(id);
    if (!this.state.closed.includes(id)) this.state.closed.push(id);
    const el = this.nodes.get(id);
    el?.remove();
    this.nodes.delete(id);
    this.renderTabs();
    this.renderTaskbar();
    this.applyOverlayChrome();
    this.persist();
  }

  focus(id: string, persist = true): void {
    const panel = this.state.panels[id];
    if (!panel) return;
    if (panel.mode === "dock" && panel.slot) this.activateTab(panel.slot, id, persist);
    if (panel.mode === "float") {
      panel.z = this.state.nextZ++;
      const el = this.nodes.get(id);
      if (el) el.style.setProperty("--z", String(panel.z));
    }
    for (const [pid, node] of this.nodes) {
      node.dataset.focus = pid === id ? "true" : "false";
    }
    if (persist) this.persist();
  }

  activateTab(slot: SlotId, id: string, persist = true): void {
    this.state.slots[slot].activeId = id || null;
    for (const pid of this.state.slots[slot].order) {
      const el = this.nodes.get(pid);
      if (!el) continue;
      if (id && pid === id) el.removeAttribute("hidden");
      else el.setAttribute("hidden", "");
    }
    this.renderTabs();
    if (persist) this.persist();
  }

  setSlotWidth(slot: "left" | "right", px: number): void {
    const width = Math.max(180, px);
    this.state.slots[slot].width = width;
    this.applySlotWidths();
    this.persist();
  }

  private applySlotWidths(): void {
    this.hosts.workspace.style.setProperty("--left-w", `${this.state.slots.left.width}px`);
    this.hosts.workspace.style.setProperty("--right-w", `${this.state.slots.right.width}px`);
  }

  private removeFromSlots(id: string): void {
    (["left", "center", "right"] as SlotId[]).forEach((slot) => {
      const s = this.state.slots[slot];
      s.order = s.order.filter((x) => x !== id);
      if (s.activeId === id) s.activeId = s.order[0] ?? null;
      this.activateTab(slot, s.activeId ?? "", false);
    });
  }

  private applyMode(id: string): void {
    const panel = this.state.panels[id];
    const el = this.nodes.get(id);
    if (!panel || !el) return;
    el.dataset.mode = panel.mode;
    el.style.setProperty("--x", `${panel.x}px`);
    el.style.setProperty("--y", `${panel.y}px`);
    el.style.setProperty("--w", `${Math.max(MIN_FLOAT_W, panel.w)}px`);
    el.style.setProperty("--h", `${Math.max(MIN_FLOAT_H, panel.h)}px`);
    el.style.setProperty("--z", String(panel.z));
    el.style.transform = "";
    if (panel.mode === "dock" && panel.slot) {
      this.mount(el, this.slotBody(panel.slot));
      const active = this.state.slots[panel.slot].activeId === id;
      if (active) el.removeAttribute("hidden");
      else el.setAttribute("hidden", "");
    } else if (panel.mode === "float") {
      el.removeAttribute("hidden");
      this.mount(el, this.hosts.floatLayer);
    } else {
      el.removeAttribute("hidden");
      this.mount(el, this.hosts.overlayHost);
    }
  }

  private slotBody(slot: SlotId): HTMLElement {
    if (slot === "left") return this.hosts.leftBody;
    if (slot === "right") return this.hosts.rightBody;
    return this.hosts.centerBody;
  }

  private slotTabs(slot: SlotId): HTMLElement {
    if (slot === "left") return this.hosts.leftTabs;
    if (slot === "right") return this.hosts.rightTabs;
    return this.hosts.centerTabs;
  }

  private applyOverlayChrome(): void {
    const on = Boolean(this.state.overlay);
    this.hosts.overlayDim.dataset.on = on ? "true" : "false";
    this.hosts.overlayHost.dataset.on = on ? "true" : "false";
  }

  private renderTabs(): void {
    (["left", "center", "right"] as SlotId[]).forEach((slot) => {
      const host = this.slotTabs(slot);
      host.replaceChildren();
      for (const id of this.state.slots[slot].order) {
        const panel = this.state.panels[id];
        if (!panel) continue;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "slot-tab";
        btn.textContent = panel.title;
        btn.dataset.active = this.state.slots[slot].activeId === id ? "true" : "false";
        btn.addEventListener("click", () => this.activateTab(slot, id));
        host.append(btn);
      }
    });
  }

  private renderTaskbar(): void {
    this.hosts.taskbar.replaceChildren();
    for (const [id, panel] of Object.entries(this.state.panels)) {
      if (this.state.closed.includes(id)) continue;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "task-pill";
      btn.dataset.mode = panel.mode;
      btn.textContent = `${panel.title} · ${panel.mode}`;
      btn.addEventListener("click", () => this.focus(id));
      this.hosts.taskbar.append(btn);
    }
  }

  private bindPanel(el: HTMLElement): void {
    const id = el.dataset.id!;
    el.addEventListener("pointerdown", () => this.focus(id));
    el.querySelectorAll<HTMLButtonElement>("[data-action]").forEach((btn) => {
      btn.addEventListener("pointerdown", (e) => e.stopPropagation());
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        if (action === "close") this.close(id);
        else if (action === "float") this.float(id);
        else if (action === "overlay") this.overlay(id);
        else if (action === "dock") {
          const panel = this.state.panels[id];
          if (panel.mode === "dock") return;
          this.dock(id, panel.slot ?? "right");
        }
      });
    });
  }
}
