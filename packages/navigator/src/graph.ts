import type { NodeSpec } from "./registry";

export function childList(node: NodeSpec): NodeSpec[] {
  const c = node.children;
  if (!c) return [];
  return typeof c === "function" ? c() : c;
}

export function joinPath(base: string, segment: string): string {
  if (!base || base === "/") return `/${segment}`;
  return `${base.replace(/\/$/, "")}/${segment}`;
}

export type Resolved = {
  node: NodeSpec | null;
  nodePath: string;
  listingNode: NodeSpec | null;
  listingPath: string | null;
  hole: boolean;
};

export function resolve(graph: NodeSpec, pathname: string): Resolved {
  const parts = pathname.split("/").filter(Boolean);
  let node: NodeSpec = graph;
  let path = "";
  const stack: { node: NodeSpec; path: string }[] = [{ node: graph, path: "/" }];
  let hole = false;
  for (const part of parts) {
    const next = childList(node).find((c) => c.segment === part);
    if (!next) {
      hole = true;
      break;
    }
    node = next;
    path = joinPath(path || "/", part);
    stack.push({ node, path });
  }
  let listingNode: NodeSpec | null = null;
  let listingPath: string | null = null;
  for (let i = stack.length - 1; i >= 0; i--) {
    const row = stack[i]!;
    if (row.node.listing === "children") {
      listingNode = row.node;
      listingPath = row.path === "" ? "/" : row.path;
      break;
    }
  }
  return {
    node: hole ? null : node,
    nodePath: hole
      ? joinPath(stack[stack.length - 1]!.path, parts[parts.length - 1]!)
      : path || "/",
    listingNode,
    listingPath,
    hole,
  };
}
