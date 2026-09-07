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

  it("preserves the same node and uid across float", () => {
    const { engine, hosts } = boot();
    const before = engine.node("task-104");
    const uid = before.dataset.uid;
    expect(before.parentElement).toBe(hosts.floatLayer);
    engine.float("task-104", { x: 40, y: 50, w: 300, h: 220 });
    expect(before.isConnected).toBe(true);
    expect(before.dataset.uid).toBe(uid);
    expect(before.parentElement).toBe(hosts.floatLayer);
  });

  it("maximize does not rewrite stored rect; unmaximize restores it", () => {
    const { engine, hosts } = boot();
    engine.float("task-104", { x: 40, y: 50, w: 300, h: 220 });
    const el = engine.node("task-104");
    engine.maximize("task-104");
    expect(engine.state.panels["task-104"].mode).toBe("maximized");
    expect(engine.state.panels["task-104"].x).toBe(40);
    expect(engine.state.panels["task-104"].w).toBe(300);
    expect(el.dataset.mode).toBe("maximized");
    expect(el.parentElement).toBe(hosts.floatLayer);
    engine.unmaximize("task-104");
    expect(engine.state.panels["task-104"].mode).toBe("float");
    expect(engine.state.panels["task-104"].x).toBe(40);
    expect(engine.state.panels["task-104"].y).toBe(50);
    expect(engine.state.panels["task-104"].w).toBe(300);
    expect(engine.state.panels["task-104"].h).toBe(220);
  });

  it("hide keeps the node and show restores maximized", () => {
    const { engine, hosts } = boot();
    const el = engine.node("task-104");
    engine.maximize("task-104");
    engine.hide("task-104");
    expect(el.isConnected).toBe(true);
    expect(engine.state.closed).not.toContain("task-104");
    expect(engine.state.panels["task-104"].mode).toBe("hidden");
    expect(engine.state.panels["task-104"].restore).toEqual({ mode: "maximized" });
    expect(el.style.display).toBe("none");
    const pill = [...hosts.taskbar.querySelectorAll("button")].find((b) =>
      b.textContent?.includes("TASK-104"),
    );
    expect(pill).toBeTruthy();
    pill!.click();
    expect(engine.state.panels["task-104"].mode).toBe("maximized");
    expect(engine.state.panels["task-104"].restore).toBeUndefined();
    expect(el.style.display).not.toBe("none");
  });

  it("close records closed and removes the pill", () => {
    const { engine, hosts } = boot();
    const el = engine.node("task-104");
    engine.close("task-104");
    expect(el.isConnected).toBe(false);
    expect(engine.state.closed).toContain("task-104");
    expect(engine.state.panels["task-104"]).toBeDefined();
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
    engine.float("task-104", { x: 100, y: 80, w: 300, h: 220 });
    const el = engine.node("task-104");
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
    expect(engine.state.panels["task-104"].mode).toBe("float");
    expect(el.parentElement).toBe(hosts.floatLayer);
  });

  it("titlebar drag on maximized unmaximizes then floats", () => {
    const { engine } = boot();
    engine.float("task-104", { x: 100, y: 80, w: 300, h: 220 });
    engine.maximize("task-104");
    const el = engine.node("task-104");
    const bar = el.querySelector(".panel-titlebar")!;
    bar.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, clientX: 400, clientY: 20, pointerId: 1 }),
    );
    expect(engine.state.panels["task-104"].mode).toBe("float");
    document.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, clientX: 430, clientY: 40, pointerId: 1 }),
    );
    expect(el.style.transform).toMatch(/translate3d/);
    document.dispatchEvent(
      new PointerEvent("pointerup", { bubbles: true, clientX: 430, clientY: 40, pointerId: 1 }),
    );
    expect(engine.state.panels["task-104"].mode).toBe("float");
  });
});
