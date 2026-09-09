import { describe, expect, it, vi } from "vitest";
import { tree } from "./tree";

describe("tree", () => {
  it("renders nested treeitems and reports onSelect", () => {
    const onSelect = vi.fn();
    const el = tree({
      nodes: [
        {
          id: "/",
          label: "Probe",
          children: [{ id: "/fields", label: "Fields" }],
        },
      ],
      selectedId: "/fields",
      onSelect,
    });
    expect(el.getAttribute("role")).toBe("tree");
    expect(el.classList.contains("ws-tree")).toBe(true);
    const items = [...el.querySelectorAll('[role="treeitem"]')];
    expect(items.map((n) => n.getAttribute("data-id"))).toEqual(["/", "/fields"]);
    expect(el.querySelector('[data-id="/fields"]')?.getAttribute("aria-selected")).toBe("true");
    el.querySelector('[data-id="/"]')!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onSelect).toHaveBeenCalledWith("/");
  });
});
