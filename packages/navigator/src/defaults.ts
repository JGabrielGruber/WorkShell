import { iconView, page, tabs, tree } from "@workshell/kit";
import type { NodeSpec, SurfaceElement, ViewContext } from "./registry";
import { childList, joinPath } from "./graph";

function href(protocol: string, path: string): string {
  return `${protocol}${path}`;
}

type TreeRow = { id: string; label: string; children?: TreeRow[] };

export function treeModel(graph: NodeSpec, prefix = ""): TreeRow[] {
  const out: TreeRow[] = [];
  for (const child of childList(graph)) {
    const path = joinPath(prefix || "/", child.segment);
    if (child.tree) {
      out.push({ id: path, label: child.title, children: treeModel(child, path) });
    } else {
      out.push(...treeModel(child, path));
    }
  }
  return out;
}

export function defaultTree(graph: NodeSpec, ctx: ViewContext, selectedId: string | null): SurfaceElement {
  const el = document.createElement("div") as SurfaceElement;
  const paint = (c: ViewContext, sel: string | null) => {
    const nodes = treeModel(graph);
    const t = tree({
      nodes,
      selectedId: sel,
      onSelect: (id) => c.go(href(c.url.protocol, id)),
    });
    el.replaceChildren(t);
  };
  paint(ctx, selectedId);
  el.onUpdate = (c) => paint(c, selectedId);
  return el;
}

export function defaultListing(
  listingNode: NodeSpec,
  listingPath: string,
  ctx: ViewContext,
): SurfaceElement {
  const el = document.createElement("div") as SurfaceElement;
  const paint = (c: ViewContext) => {
    const icons = iconView({
      items: childList(listingNode).map((k) => ({ id: k.segment, label: k.title })),
      onSelect: (id) => c.go(href(c.url.protocol, joinPath(listingPath, id))),
    });
    el.replaceChildren(icons);
  };
  paint(ctx);
  el.onUpdate = paint;
  return el;
}

export function defaultNotFound(): SurfaceElement {
  return page({ title: "Not found", body: document.createElement("div") });
}

export function defaultPage(node: NodeSpec): SurfaceElement {
  return page({ title: node.title, body: document.createElement("div") });
}

export function defaultTabHost(
  parent: NodeSpec,
  parentPath: string,
  activeSegment: string | undefined,
  ctx: ViewContext,
  spawnPage: (child: NodeSpec, childPath: string) => SurfaceElement,
): SurfaceElement {
  const kids = childList(parent).filter((c) => c.tabOfParent);
  const active = activeSegment ?? kids[0]?.segment;
  const root = tabs({
    activeId: active,
    tabs: kids.map((k) => ({
      id: k.segment,
      label: k.title,
      panel: spawnPage(k, joinPath(parentPath, k.segment)),
    })),
  }) as SurfaceElement;
  root.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement | null)?.closest("[role=tab]") as HTMLElement | null;
    const id = btn?.dataset.id;
    if (id) ctx.go(href(ctx.url.protocol, joinPath(parentPath, id)));
  });
  return root;
}
