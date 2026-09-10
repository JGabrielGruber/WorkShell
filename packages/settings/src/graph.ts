import type { NodeSpec } from "@workshell/navigator";
import type { WorkshellSession } from "@workshell/session";

export function settingsGraph(session: WorkshellSession): NodeSpec {
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
              session.theme.list().map((t) => ({
                segment: t.id,
                title: t.title,
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
