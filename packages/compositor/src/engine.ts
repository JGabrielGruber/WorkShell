import type { EngineHosts } from "./hosts";
import { loadLayout, saveLayout } from "./persist";
import {
  CASCADE_PX,
  DEFAULT_FLOAT,
  FLOAT_OUT_THRESHOLD_PX,
  MIN_FLOAT_H,
  MIN_FLOAT_W,
  SNAP_EDGE_PX,
  type LayoutState,
  type OpenOptions,
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
  private createPanel: ((id: string) => HTMLElement) | null = null;
  private drag: null | {
    id: string;
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    fromDock: boolean;
    armed: boolean;
  } = null;
  private resize: null | {
    id: string;
    pointerId: number;
    startX: number;
    startY: number;
    originW: number;
    originH: number;
  } = null;
  private slotDrag: null | {
    slot: "left" | "right";
    pointerId: number;
    startX: number;
    originW: number;
  } = null;

  constructor(
    private hosts: EngineHosts,
    private storage: Storage,
    seed: () => LayoutState,
  ) {
    this.state = loadLayout(storage, seed);
  }

  node(id: string): HTMLElement {
    const el = this.nodes.get(id);
    if (!el) throw new Error(`unknown panel ${id}`);
    return el;
  }

  boot(createPanel: (id: string) => HTMLElement): void {
    this.createPanel = createPanel;
    this.applySlotWidths();
    for (const id of Object.keys(this.state.panels)) {
      if (this.state.closed.includes(id)) continue;
      this.materialize(id);
    }
    this.renderTabs();
    this.renderTaskbar();
    this.applyOverlayChrome();
    this.hosts.overlayDim.addEventListener("click", () => {
      if (this.state.overlay?.id) this.restoreOverlay();
    });
    document.addEventListener("pointermove", (e) => this.onPointerMove(e));
    document.addEventListener("pointerup", (e) => this.onPointerUp(e));
    document.addEventListener("pointercancel", (e) => this.onPointerUp(e));
    this.hosts.left
      ?.querySelector("[data-resize-slot='left']")
      ?.addEventListener("pointerdown", (e) =>
        this.beginSlotResize(e as PointerEvent, "left"),
      );
    this.hosts.right
      ?.querySelector("[data-resize-slot='right']")
      ?.addEventListener("pointerdown", (e) =>
        this.beginSlotResize(e as PointerEvent, "right"),
      );
  }

  persist(): void {
    saveLayout(this.storage, this.state);
  }

  private materialize(id: string): void {
    if (!this.createPanel) throw new Error("boot() required");
    const el = this.createPanel(id);
    this.nodes.set(id, el);
    this.state.panels[id].uid = el.dataset.uid ?? "";
    this.bindPanel(el);
    this.applyMode(id);
  }

  private cascadeRect(): { x: number; y: number; w: number; h: number } {
    const n = Object.keys(this.state.panels).filter(
      (id) => !this.state.closed.includes(id),
    ).length;
    return {
      x: DEFAULT_FLOAT.x + n * CASCADE_PX,
      y: DEFAULT_FLOAT.y + n * CASCADE_PX,
      w: DEFAULT_FLOAT.w,
      h: DEFAULT_FLOAT.h,
    };
  }

  open(id: string, opts?: OpenOptions): void {
    if (!this.createPanel) throw new Error("boot() required");
    if (!id) return;
    const panel = this.state.panels[id];
    const closed = this.state.closed.includes(id);
    if (panel && !closed) {
      if (panel.mode === "hidden") this.show(id);
      else this.focus(id);
      return;
    }
    if (panel && closed) {
      this.state.closed = this.state.closed.filter((x) => x !== id);
      this.materialize(id);
      this.float(id);
      return;
    }
    const rect = this.cascadeRect();
    this.state.panels[id] = {
      id,
      uid: "",
      title: opts?.title ?? id,
      mode: "float",
      x: rect.x,
      y: rect.y,
      w: rect.w,
      h: rect.h,
      z: this.state.nextZ++,
    };
    this.materialize(id);
    this.float(id);
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

  maximize(id: string): void {
    const panel = this.state.panels[id];
    if (!panel) return;
    if (this.state.overlay?.id === id) this.state.overlay = null;
    this.removeFromSlots(id);
    panel.mode = "maximized";
    this.focus(id, false);
    this.applyMode(id);
    this.renderTaskbar();
    this.applyOverlayChrome();
    this.persist();
  }

  unmaximize(id: string): void {
    const panel = this.state.panels[id];
    if (!panel || panel.mode !== "maximized") return;
    this.float(id);
  }

  hide(id: string): void {
    const panel = this.state.panels[id];
    if (!panel || panel.mode === "hidden") return;
    if (this.state.overlay?.id === id) this.state.overlay = null;
    panel.restore = { mode: panel.mode, slot: panel.slot };
    this.removeFromSlots(id);
    panel.mode = "hidden";
    this.applyMode(id);
    this.renderTaskbar();
    this.applyOverlayChrome();
    this.persist();
  }

  show(id: string): void {
    const panel = this.state.panels[id];
    if (!panel) return;
    if (panel.mode !== "hidden") {
      this.focus(id);
      return;
    }
    const restore = panel.restore;
    panel.restore = undefined;
    if (restore?.mode === "maximized") this.maximize(id);
    else this.float(id);
  }

  focus(id: string, persist = true): void {
    const panel = this.state.panels[id];
    if (!panel) return;
    if (panel.mode === "dock" && panel.slot) this.activateTab(panel.slot, id, persist);
    if (panel.mode === "float" || panel.mode === "maximized") {
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
      el.style.display = "";
      const body = this.slotBody(panel.slot);
      if (body) this.mount(el, body);
      const active = this.state.slots[panel.slot].activeId === id;
      if (active) el.removeAttribute("hidden");
      else el.setAttribute("hidden", "");
    } else if (panel.mode === "float") {
      el.style.display = "";
      el.removeAttribute("hidden");
      this.mount(el, this.hosts.floatLayer);
    } else if (panel.mode === "maximized") {
      el.style.display = "";
      el.removeAttribute("hidden");
      this.mount(el, this.hosts.floatLayer);
    } else if (panel.mode === "hidden") {
      el.style.display = "none";
      this.mount(el, this.hosts.floatLayer);
    } else {
      el.style.display = "";
      el.removeAttribute("hidden");
      this.mount(el, this.hosts.overlayHost);
    }
  }

  private slotBody(slot: SlotId): HTMLElement | undefined {
    if (slot === "left") return this.hosts.leftBody;
    if (slot === "right") return this.hosts.rightBody;
    return this.hosts.centerBody;
  }

  private slotTabs(slot: SlotId): HTMLElement | undefined {
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
      if (!host) return;
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
      btn.addEventListener("click", () => {
        if (this.state.panels[id]?.mode === "hidden") this.show(id);
        else this.focus(id);
      });
      this.hosts.taskbar.append(btn);
    }
  }

  private bindPanel(el: HTMLElement): void {
    const id = el.dataset.id!;
    el.addEventListener("pointerdown", () => this.focus(id));
    const bar = el.querySelector(".panel-titlebar");
    bar?.addEventListener("pointerdown", (e) => this.beginDrag(e as PointerEvent, id));
    el.querySelector("[data-resize]")?.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      this.beginResize(e as PointerEvent, id);
    });
    el.querySelectorAll<HTMLButtonElement>("[data-action]").forEach((btn) => {
      btn.addEventListener("pointerdown", (e) => e.stopPropagation());
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        if (action === "close") this.close(id);
        else if (action === "hide") this.hide(id);
        else if (action === "maximize") {
          if (this.state.panels[id]?.mode === "maximized") this.unmaximize(id);
          else this.maximize(id);
        } else if (action === "float") this.float(id);
        else if (action === "overlay") this.overlay(id);
        else if (action === "dock") {
          const panel = this.state.panels[id];
          if (panel.mode === "dock") return;
          this.dock(id, panel.slot ?? "right");
        }
      });
    });
  }

  private beginDrag(e: PointerEvent, id: string): void {
    if ((e.target as HTMLElement).closest("[data-action]")) return;
    const panel = this.state.panels[id];
    if (!panel || panel.mode === "overlay" || panel.mode === "hidden") return;
    e.preventDefault();
    (e.currentTarget as HTMLElement | null)?.setPointerCapture?.(e.pointerId);
    if (panel.mode === "maximized") {
      const vw = window.innerWidth || 1280;
      const w = panel.w;
      panel.x = Math.max(0, Math.min(e.clientX - w / 2, vw - w));
      panel.y = 0;
      panel.mode = "float";
      this.applyMode(id);
      this.renderTaskbar();
      this.persist();
    }
    this.drag = {
      id,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: panel.x,
      originY: panel.y,
      fromDock: panel.mode === "dock",
      armed: panel.mode === "float",
    };
    if (this.drag.armed) this.nodes.get(id)?.classList.add("is-dragging");
    this.focus(id, false);
  }

  private beginResize(e: PointerEvent, id: string): void {
    const panel = this.state.panels[id];
    if (!panel || panel.mode !== "float") return;
    e.preventDefault();
    this.resize = {
      id,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originW: panel.w,
      originH: panel.h,
    };
  }

  private beginSlotResize(e: PointerEvent, slot: "left" | "right"): void {
    e.preventDefault();
    this.slotDrag = {
      slot,
      pointerId: e.pointerId,
      startX: e.clientX,
      originW: this.state.slots[slot].width,
    };
  }

  private onPointerMove(e: PointerEvent): void {
    if (this.slotDrag && e.pointerId === this.slotDrag.pointerId) {
      const dx = e.clientX - this.slotDrag.startX;
      const next =
        this.slotDrag.slot === "left"
          ? this.slotDrag.originW + dx
          : this.slotDrag.originW - dx;
      this.hosts.workspace.style.setProperty(
        this.slotDrag.slot === "left" ? "--left-w" : "--right-w",
        `${Math.max(180, next)}px`,
      );
      return;
    }
    if (this.resize && e.pointerId === this.resize.pointerId) {
      const el = this.nodes.get(this.resize.id);
      if (!el) return;
      const w = Math.max(MIN_FLOAT_W, this.resize.originW + (e.clientX - this.resize.startX));
      const h = Math.max(MIN_FLOAT_H, this.resize.originH + (e.clientY - this.resize.startY));
      el.style.setProperty("--w", `${w}px`);
      el.style.setProperty("--h", `${h}px`);
      return;
    }
    if (!this.drag || e.pointerId !== this.drag.pointerId) return;
    const dx = e.clientX - this.drag.startX;
    const dy = e.clientY - this.drag.startY;
    if (!this.drag.armed) {
      if (Math.hypot(dx, dy) < FLOAT_OUT_THRESHOLD_PX) return;
      // Commit-time reparent once, then compositor drag.
      this.float(this.drag.id);
      this.drag.armed = true;
      this.drag.originX = e.clientX - 48;
      this.drag.originY = e.clientY - 14;
      this.drag.startX = e.clientX;
      this.drag.startY = e.clientY;
      this.nodes.get(this.drag.id)?.classList.add("is-dragging");
    }
    const el = this.nodes.get(this.drag.id);
    if (!el) return;
    const x = this.drag.originX + (e.clientX - this.drag.startX);
    const y = this.drag.originY + (e.clientY - this.drag.startY);
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }

  private onPointerUp(e: PointerEvent): void {
    if (this.slotDrag && e.pointerId === this.slotDrag.pointerId) {
      const dx = e.clientX - this.slotDrag.startX;
      const next =
        this.slotDrag.slot === "left"
          ? this.slotDrag.originW + dx
          : this.slotDrag.originW - dx;
      this.setSlotWidth(this.slotDrag.slot, next);
      this.slotDrag = null;
      return;
    }
    if (this.resize && e.pointerId === this.resize.pointerId) {
      const panel = this.state.panels[this.resize.id];
      const el = this.nodes.get(this.resize.id);
      if (panel && el) {
        panel.w = Math.max(
          MIN_FLOAT_W,
          this.resize.originW + (e.clientX - this.resize.startX),
        );
        panel.h = Math.max(
          MIN_FLOAT_H,
          this.resize.originH + (e.clientY - this.resize.startY),
        );
        el.style.setProperty("--w", `${panel.w}px`);
        el.style.setProperty("--h", `${panel.h}px`);
        this.persist();
      }
      this.resize = null;
      return;
    }
    if (!this.drag || e.pointerId !== this.drag.pointerId) return;
    const el = this.nodes.get(this.drag.id);
    this.hosts.snapPreview.dataset.on = "false";
    if (el) {
      el.classList.remove("is-dragging");
      const dx = e.clientX - this.drag.startX;
      const dy = e.clientY - this.drag.startY;
      const x = this.drag.originX + dx;
      const y = this.drag.originY + dy;
      el.style.transform = "";
      if (this.drag.armed) {
        const panel = this.state.panels[this.drag.id];
        panel.x = x;
        panel.y = y;
        el.style.setProperty("--x", `${x}px`);
        el.style.setProperty("--y", `${y}px`);
        this.persist();
      }
    }
    this.drag = null;
  }
}
