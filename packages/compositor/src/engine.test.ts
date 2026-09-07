import { beforeEach, describe, expect, it } from "vitest";
import { WorkspaceEngine, snapZone } from "./engine";
import { fixtureSeed } from "./fixture-seed";
import type { EngineHosts } from "./hosts";
import { STORAGE_KEY } from "./types";

function fakeHosts(): EngineHosts {
  const workspace = document.createElement("div");
  workspace.id = "workspace";
  const wallpaper = document.createElement("div");
  wallpaper.id = "wallpaper";
  const widgetLayer = document.createElement("div");
  widgetLayer.id = "widget-layer";
  const floatLayer = document.createElement("div");
  floatLayer.id = "float-layer";
  floatLayer.style.pointerEvents = "none";
  const snapPreview = document.createElement("div");
  snapPreview.id = "snap-preview";
  floatLayer.append(snapPreview);
  const overlayHost = document.createElement("div");
  overlayHost.id = "overlay-host";
  const overlayDim = document.createElement("div");
  overlayDim.id = "overlay-dim";
  const taskbar = document.createElement("nav");
  taskbar.id = "taskbar";
  workspace.append(wallpaper, widgetLayer, floatLayer, taskbar, overlayDim, overlayHost);
  document.body.append(workspace);
  return {
    workspace,
    wallpaper,
    widgetLayer,
    floatLayer,
    overlayHost,
    overlayDim,
    snapPreview,
    taskbar,
  };
}

function createTestPanel(id: string): HTMLElement {
  const el = document.createElement("section");
  el.className = "panel";
  el.dataset.id = id;
  el.dataset.uid = `uid-${id}`;
  el.innerHTML = `<div class="panel-titlebar"><span class="panel-title"></span></div><div class="panel-body"></div><div class="resize-handle" data-resize="1"></div>`;
  el.querySelector(".panel-title")!.textContent = id === "alpha" ? "Alpha" : id;
  return el;
}

function boot(storage: Storage = localStorage): {
  engine: WorkspaceEngine;
  hosts: EngineHosts;
} {
  localStorage.clear();
  const hosts = fakeHosts();
  const engine = new WorkspaceEngine(hosts, storage, fixtureSeed);
  engine.boot(createTestPanel);
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

  it("preserves the same node and uid across float", () => {
    const { engine, hosts } = boot();
    const before = engine.node("alpha");
    const uid = before.dataset.uid;
    expect(before.parentElement).toBe(hosts.floatLayer);
    engine.float("alpha", { x: 40, y: 50, w: 300, h: 220 });
    expect(before.isConnected).toBe(true);
    expect(before.dataset.uid).toBe(uid);
    expect(before.parentElement).toBe(hosts.floatLayer);
  });

  it("maximize does not rewrite stored rect; unmaximize restores it", () => {
    const { engine, hosts } = boot();
    engine.float("alpha", { x: 40, y: 50, w: 300, h: 220 });
    const el = engine.node("alpha");
    engine.maximize("alpha");
    expect(engine.state.panels.alpha.mode).toBe("maximized");
    expect(engine.state.panels.alpha.x).toBe(40);
    expect(engine.state.panels.alpha.w).toBe(300);
    expect(el.dataset.mode).toBe("maximized");
    expect(el.parentElement).toBe(hosts.floatLayer);
    engine.unmaximize("alpha");
    expect(engine.state.panels.alpha.mode).toBe("float");
    expect(engine.state.panels.alpha.x).toBe(40);
    expect(engine.state.panels.alpha.y).toBe(50);
    expect(engine.state.panels.alpha.w).toBe(300);
    expect(engine.state.panels.alpha.h).toBe(220);
  });

  it("hide keeps the node and show restores maximized", () => {
    const { engine, hosts } = boot();
    const el = engine.node("alpha");
    engine.maximize("alpha");
    engine.hide("alpha");
    expect(el.isConnected).toBe(true);
    expect(engine.state.closed).not.toContain("alpha");
    expect(engine.state.panels.alpha.mode).toBe("hidden");
    expect(engine.state.panels.alpha.restore).toEqual({ mode: "maximized" });
    expect(el.style.display).toBe("none");
    const pill = [...hosts.taskbar.querySelectorAll("button")].find((b) =>
      b.textContent?.includes("Alpha"),
    );
    expect(pill).toBeTruthy();
    pill!.click();
    expect(engine.state.panels.alpha.mode).toBe("maximized");
    expect(engine.state.panels.alpha.restore).toBeUndefined();
    expect(el.style.display).not.toBe("none");
  });

  it("close records closed and removes the pill", () => {
    const { engine, hosts } = boot();
    const el = engine.node("alpha");
    engine.close("alpha");
    expect(el.isConnected).toBe(false);
    expect(engine.state.closed).toContain("alpha");
    expect(engine.state.panels.alpha).toBeDefined();
    expect(hosts.taskbar.querySelector("button")).toBeNull();
  });
});

describe("gestures", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    localStorage.clear();
  });

  it("pointerup after a float drag does not dock", () => {
    const { engine, hosts } = boot();
    engine.float("alpha", { x: 100, y: 80, w: 300, h: 220 });
    const el = engine.node("alpha");
    const bar = el.querySelector(".panel-titlebar")!;
    bar.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, clientX: 120, clientY: 90, pointerId: 1 }),
    );
    document.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, clientX: 1790, clientY: 90, pointerId: 1 }),
    );
    const before = localStorage.getItem(STORAGE_KEY);
    document.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, clientX: 1800, clientY: 90, pointerId: 1 }),
    );
    expect(localStorage.getItem(STORAGE_KEY)).toBe(before);
    document.dispatchEvent(
      new PointerEvent("pointerup", { bubbles: true, clientX: 1790, clientY: 90, pointerId: 1 }),
    );
    expect(engine.state.panels.alpha.mode).toBe("float");
    expect(el.parentElement).toBe(hosts.floatLayer);
  });

  it("titlebar drag on maximized unmaximizes then floats", () => {
    const { engine } = boot();
    engine.float("alpha", { x: 100, y: 80, w: 300, h: 220 });
    engine.maximize("alpha");
    const el = engine.node("alpha");
    const bar = el.querySelector(".panel-titlebar")!;
    bar.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, clientX: 400, clientY: 20, pointerId: 1 }),
    );
    expect(engine.state.panels.alpha.mode).toBe("float");
    document.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, clientX: 430, clientY: 40, pointerId: 1 }),
    );
    expect(el.style.transform).toMatch(/translate3d/);
    document.dispatchEvent(
      new PointerEvent("pointerup", { bubbles: true, clientX: 430, clientY: 40, pointerId: 1 }),
    );
    expect(engine.state.panels.alpha.mode).toBe("float");
  });
});
