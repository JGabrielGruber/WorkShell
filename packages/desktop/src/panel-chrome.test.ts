import { describe, expect, it } from "vitest";
import { createPanelChrome } from "./panel-chrome";

describe("createPanelChrome", () => {
  it("builds Classic caption buttons on the right and an empty body", () => {
    const el = createPanelChrome("task-104", "TASK-104");
    expect(el.dataset.id).toBe("task-104");
    expect(el.dataset.uid).toBeTruthy();

    expect(el.querySelector(".traffic")).toBeNull();
    expect(el.querySelector(".tl")).toBeNull();
    expect(el.querySelector(".tl-close")).toBeNull();
    expect(el.querySelector(".tl-hide")).toBeNull();
    expect(el.querySelector(".tl-max")).toBeNull();

    const title = el.querySelector(".panel-title");
    const cluster = el.querySelector(".caption-buttons");
    expect(title).toBeTruthy();
    expect(cluster).toBeTruthy();
    expect(title!.nextElementSibling).toBe(cluster);

    const buttons = [...cluster!.querySelectorAll("button")];
    expect(buttons.map((btn) => btn.dataset.action)).toEqual(["hide", "maximize", "close"]);
    expect(buttons.map((btn) => btn.getAttribute("aria-label"))).toEqual([
      "Minimize",
      "Maximize",
      "Close",
    ]);
    expect(buttons[0].classList.contains("caption-btn")).toBe(true);
    expect(buttons[0].classList.contains("caption-min")).toBe(true);
    expect(buttons[1].classList.contains("caption-max")).toBe(true);
    expect(buttons[2].classList.contains("caption-close")).toBe(true);

    expect(el.querySelector("[data-action='dock']")).toBeNull();
    expect(el.querySelector("[data-action='float']")).toBeNull();
    expect(el.querySelector("[data-action='overlay']")).toBeNull();
    expect(el.querySelector("[data-pane='chat']")).toBeNull();
    expect(el.querySelector(".inspector")).toBeNull();
    expect(el.querySelector(".panel-body")?.childNodes.length).toBe(0);
    expect(title?.textContent).toBe("TASK-104");
  });
});
