import { beforeEach, describe, expect, it } from "vitest";
import { buildWorkspace } from "./chrome";
import { WorkspaceEngine, snapZone } from "./engine";
import { createPanel } from "./panels";
import { STORAGE_KEY } from "./types";

function boot(storage: Storage = localStorage): {
  engine: WorkspaceEngine;
  hosts: ReturnType<typeof buildWorkspace>;
} {
  localStorage.clear();
  const root = document.createElement("div");
  document.body.append(root);
  const hosts = buildWorkspace(root);
  const engine = new WorkspaceEngine(hosts, storage);
  engine.boot(createPanel);
  return { engine, hosts };
}

describe("snapZone", () => {
  it("uses 40px edges and the middle third for center", () => {
    expect(snapZone(10, 1800, 320, 360)).toBe("left");
    expect(snapZone(1790, 1800, 320, 360)).toBe("right");
    expect(snapZone(900, 1800, 320, 360)).toBe("center");
    expect(snapZone(80, 1800, 320, 360)).toBeNull();
  });
});

describe("WorkspaceEngine", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    localStorage.clear();
  });

  it("preserves the same node and uid across float and dock", () => {
    const { engine, hosts } = boot();
    const before = engine.node("spec");
    const uid = before.dataset.uid;
    expect(before.parentElement).toBe(hosts.rightBody);
    engine.float("spec");
    expect(before.isConnected).toBe(true);
    expect(before.dataset.uid).toBe(uid);
    expect(before.parentElement).toBe(hosts.floatLayer);
    engine.dock("spec", "right");
    expect(before.isConnected).toBe(true);
    expect(before.dataset.uid).toBe(uid);
    expect(before.parentElement).toBe(hosts.rightBody);
    expect(before).toBe(engine.node("spec"));
  });

  it("stacks docked panels as tabs and can overlay then restore", () => {
    const { engine, hosts } = boot();
    const chat = engine.node("chat");
    expect(engine.state.slots.center.order).toEqual(["sprint", "chat"]);
    engine.activateTab("center", "chat");
    expect(engine.state.slots.center.activeId).toBe("chat");
    expect(chat.hasAttribute("hidden")).toBe(false);
    engine.overlay("chat");
    expect(chat.parentElement).toBe(hosts.overlayHost);
    expect(hosts.overlayDim.dataset.on).toBe("true");
    hosts.overlayDim.click();
    expect(engine.state.panels.chat.mode).toBe("dock");
    expect(chat.parentElement).toBe(hosts.centerBody);
    expect(chat.hasAttribute("hidden")).toBe(false);
    expect(engine.node("sprint").hasAttribute("hidden")).toBe(true);
  });

  it("close removes the panel from the slot and records closed", () => {
    const { engine } = boot();
    const metrics = engine.node("metrics");
    engine.close("metrics");
    expect(metrics.isConnected).toBe(false);
    expect(engine.state.closed).toContain("metrics");
    expect(engine.state.slots.right.order).not.toContain("metrics");
  });

  it("persist round-trips after dock/float", () => {
    const { engine } = boot();
    engine.float("spec", { x: 40, y: 50, w: 300, h: 220 });
    engine.persist();
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(raw.panels.spec.mode).toBe("float");
    expect(raw.panels.spec.x).toBe(40);
  });
});

describe("gestures", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    localStorage.clear();
  });

  it("docks a floating panel on pointerup in the right snap zone", () => {
    const { engine, hosts } = boot();
    engine.float("spec", { x: 100, y: 80, w: 300, h: 220 });
    const el = engine.node("spec");
    const bar = el.querySelector(".panel-titlebar")!;
    bar.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, clientX: 120, clientY: 90, pointerId: 1 }),
    );
    document.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, clientX: 1790, clientY: 90, pointerId: 1 }),
    );
    document.dispatchEvent(
      new PointerEvent("pointerup", { bubbles: true, clientX: 1790, clientY: 90, pointerId: 1 }),
    );
    expect(engine.state.panels.spec.mode).toBe("dock");
    expect(el.parentElement).toBe(hosts.rightBody);
  });
});
