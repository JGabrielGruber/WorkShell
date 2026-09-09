import { describe, expect, it, vi } from "vitest";
import { iconView } from "./icons";

describe("iconView", () => {
  it("groups tiles and reports onSelect", () => {
    const onSelect = vi.fn();
    const el = iconView({
      items: [
        { id: "/fields", label: "Fields", group: "Kit" },
        { id: "/tabs", label: "Tabs", group: "Kit" },
      ],
      onSelect,
    });
    expect(el.classList.contains("ws-icons")).toBe(true);
    expect(el.getAttribute("role")).toBe("list");
    expect(el.textContent).toContain("Kit");
    expect(el.textContent).toContain("Fields");
    el.querySelector('[data-id="/tabs"]')!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onSelect).toHaveBeenCalledWith("/tabs");
  });
});
