import { describe, expect, it } from "vitest";
import { createDesktop } from "@workshell/desktop-shell";
import { seedLayout } from "../seed";
import { fillTask104 } from "./task-104";

describe("TASK-104 body", () => {
  it("paints the three-column inspector through fillPanelBody", () => {
    const root = document.createElement("div");
    const host = createDesktop(root);
    host.boot({
      theme: "aetheris-glass",
      seed: seedLayout,
      storage: localStorage,
      fillWidgetLayer() {},
      fillPanelBody(id, el) {
        if (id === "task-104") fillTask104(el);
      },
    });
    const el = host.engine.node("task-104");
    expect(el.querySelector("[data-pane='chat']")).toBeTruthy();
    expect(el.querySelector("[data-pane='spec']")).toBeTruthy();
    expect(el.querySelector("[data-pane='attachments']")).toBeTruthy();
    expect(el.querySelector(".panel-title")?.textContent).toBe("TASK-104");
  });
});
