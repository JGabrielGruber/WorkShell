import { describe, expect, it } from "vitest";
import { createPanelChrome } from "./panel-chrome";

describe("createPanelChrome", () => {
  it("builds traffic lights and an empty body", () => {
    const el = createPanelChrome("task-104", "TASK-104");
    expect(el.dataset.id).toBe("task-104");
    expect(el.dataset.uid).toBeTruthy();
    expect(el.querySelector("[data-action='close']")).toBeTruthy();
    expect(el.querySelector("[data-action='hide']")).toBeTruthy();
    expect(el.querySelector("[data-action='maximize']")).toBeTruthy();
    expect(el.querySelector("[data-action='dock']")).toBeNull();
    expect(el.querySelector("[data-action='float']")).toBeNull();
    expect(el.querySelector("[data-action='overlay']")).toBeNull();
    expect(el.querySelector("[data-pane='chat']")).toBeNull();
    expect(el.querySelector(".inspector")).toBeNull();
    expect(el.querySelector(".panel-body")?.childNodes.length).toBe(0);
    expect(el.querySelector(".panel-title")?.textContent).toBe("TASK-104");
  });
});
