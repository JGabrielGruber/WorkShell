import { describe, expect, it } from "vitest";
import { mountProbe } from "./mount";

describe("mountProbe", () => {
  it("fills three docks and opens Fields in trailing", () => {
    const host = document.createElement("div");
    mountProbe(host);
    expect(host.querySelector(".nav")).toBeTruthy();
    expect(host.querySelectorAll("[data-dock]")).toHaveLength(3);
    expect(host.querySelector('[role="tree"]')).toBeTruthy();
    expect(host.querySelector('[data-dock="trailing"]')?.childElementCount).toBe(0);
    host
      .querySelector('[data-id="/fields"]')!
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(host.querySelector('[data-dock="trailing"] .ws-page-title')?.textContent).toBe("Fields");
    const input = host.querySelector(".nav-chrome input") as HTMLInputElement;
    expect(input.value).toBe("probe:/fields");
  });
});
