import { describe, expect, it, vi } from "vitest";
import { listView } from "./list";

describe("listView", () => {
  it("is a listbox and selects by id", () => {
    const onSelect = vi.fn();
    const el = listView({
      items: [
        { id: "a", label: "A" },
        { id: "b", label: "B" },
      ],
      selectedId: "a",
      onSelect,
    });
    expect(el.getAttribute("role")).toBe("listbox");
    expect(el.classList.contains("ws-list")).toBe(true);
    const b = el.querySelector('[data-id="b"]')!;
    expect(b.getAttribute("role")).toBe("option");
    b.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onSelect).toHaveBeenCalledWith("b");
  });
});
