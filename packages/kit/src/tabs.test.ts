import { describe, expect, it } from "vitest";
import { tabs } from "./tabs";

describe("tabs", () => {
  it("shows only the active tabpanel", () => {
    const a = document.createElement("p");
    a.textContent = "A";
    const b = document.createElement("p");
    b.textContent = "B";
    const el = tabs({
      tabs: [
        { id: "one", label: "One", panel: a },
        { id: "two", label: "Two", panel: b },
      ],
      activeId: "one",
    });
    const tablist = el.querySelector('[role="tablist"]');
    expect(tablist).toBeTruthy();
    const panels = [...el.querySelectorAll<HTMLElement>('[role="tabpanel"]')];
    expect(panels).toHaveLength(2);
    expect(panels[0].hidden).toBe(false);
    expect(panels[1].hidden).toBe(true);
    el.querySelector('[data-id="two"]')!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(panels[0].hidden).toBe(true);
    expect(panels[1].hidden).toBe(false);
  });
});
