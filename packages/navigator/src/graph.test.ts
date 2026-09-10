import { describe, expect, it } from "vitest";
import type { NodeSpec } from "./registry";
import { resolve } from "./graph";

function fixtureGraph(ids: string[] = ["base"]): NodeSpec {
  return {
    segment: "",
    title: "Settings",
    tree: false,
    listing: "children",
    detail: "none",
    children: [
      {
        segment: "appearance",
        title: "Appearance",
        tree: true,
        listing: "children",
        detail: "none",
        children: [
          {
            segment: "theme",
            title: "Theme",
            tree: true,
            listing: "children",
            detail: "none",
            children: () =>
              ids.map((id) => ({
                segment: id,
                title: id === "base" ? "Base" : id,
                listing: "parent" as const,
                detail: "tabs" as const,
                children: [
                  {
                    segment: "colors",
                    title: "Colors",
                    tabOfParent: true,
                    listing: "none" as const,
                    detail: "page" as const,
                    kind: "theme-colors",
                  },
                ],
              })),
          },
        ],
      },
    ],
  };
}

describe("resolve", () => {
  const graph = fixtureGraph();

  it("appearance and theme have listing, no hole, no detail node", () => {
    const a = resolve(graph, "/appearance");
    expect(a.hole).toBe(false);
    expect(a.node?.segment).toBe("appearance");
    expect(a.listingNode?.segment).toBe("appearance");
    expect(a.node?.detail).toBe("none");

    const t = resolve(graph, "/appearance/theme");
    expect(t.listingNode?.segment).toBe("theme");
    expect(t.node?.detail).toBe("none");
  });

  it("instance and colors listing stays theme", () => {
    const inst = resolve(graph, "/appearance/theme/base");
    expect(inst.node?.segment).toBe("base");
    expect(inst.listingNode?.segment).toBe("theme");
    expect(inst.node?.detail).toBe("tabs");

    const colors = resolve(graph, "/appearance/theme/base/colors");
    expect(colors.node?.segment).toBe("colors");
    expect(colors.listingNode?.segment).toBe("theme");
    expect(colors.node?.kind).toBe("theme-colors");
  });

  it("unknown theme id is a hole under theme", () => {
    const hole = resolve(graph, "/appearance/theme/nope");
    expect(hole.hole).toBe(true);
    expect(hole.listingNode?.segment).toBe("theme");
  });
});
