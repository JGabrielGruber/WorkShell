import { describe, expect, it } from "vitest";
import { createPanel } from "./panels";

describe("createPanel", () => {
  it("builds traffic lights and a three-column inspector for task-104", () => {
    const el = createPanel("task-104");
    expect(el.dataset.id).toBe("task-104");
    expect(el.dataset.uid).toBeTruthy();
    expect(el.querySelector("[data-action='close']")).toBeTruthy();
    expect(el.querySelector("[data-action='hide']")).toBeTruthy();
    expect(el.querySelector("[data-action='maximize']")).toBeTruthy();
    expect(el.querySelector("[data-action='dock']")).toBeNull();
    expect(el.querySelector("[data-action='float']")).toBeNull();
    expect(el.querySelector("[data-action='overlay']")).toBeNull();
    expect(el.querySelector("[data-pane='chat']")).toBeTruthy();
    expect(el.querySelector("[data-pane='spec']")).toBeTruthy();
    expect(el.querySelector("[data-pane='attachments']")).toBeTruthy();
    expect(el.querySelector(".panel-title")?.textContent).toBe("TASK-104");
  });
});
