import { describe, expect, it, vi } from "vitest";
import { button } from "./button";

describe("button", () => {
  it("defaults to a neutral type=button", () => {
    const el = button({ label: "Go" });
    expect(el.tagName).toBe("BUTTON");
    expect(el.type).toBe("button");
    expect(el.textContent).toBe("Go");
    expect(el.className).toContain("ws-btn");
    expect(el.className).toContain("ws-btn-neutral");
  });

  it("applies kind, disabled, and click", () => {
    const onClick = vi.fn();
    const el = button({ label: "Save", kind: "primary", onClick });
    expect(el.className).toContain("ws-btn-primary");
    el.click();
    expect(onClick).toHaveBeenCalledOnce();
    const dead = button({ label: "X", kind: "danger", disabled: true, onClick });
    expect(dead.disabled).toBe(true);
    expect(dead.className).toContain("ws-btn-danger");
    dead.click();
    expect(onClick).toHaveBeenCalledOnce();
  });
});
