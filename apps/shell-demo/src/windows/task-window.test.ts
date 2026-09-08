import { describe, expect, it } from "vitest";
import { fillWindow } from "./task-window";

describe("fillWindow", () => {
  it("keeps the TASK-104 inspector", () => {
    const host = document.createElement("div");
    fillWindow("task-104", host);
    expect(host.querySelector(".inspector")).toBeTruthy();
  });

  it("fills other tasks as a document body", () => {
    const host = document.createElement("div");
    fillWindow("task-112", host);
    expect(host.querySelector(".inspector")).toBeNull();
    expect(host.querySelector(".task-doc")?.textContent).toMatch(/WebGPU/);
    expect(host.querySelector(".task-doc")?.textContent).toMatch(/TASK-112/);
  });

  it("leaves unknown ids empty", () => {
    const host = document.createElement("div");
    fillWindow("nope", host);
    expect(host.childNodes.length).toBe(0);
  });
});
