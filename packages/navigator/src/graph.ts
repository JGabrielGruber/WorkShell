import type { KindHandlers, NodeSpec, SurfaceElement, ViewContext } from "./registry";
import {
  defaultListing,
  defaultNotFound,
  defaultPage,
  defaultTabHost,
  defaultTree,
} from "./defaults";

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

export type SpawnHost = "navigator" | "window";

export type Spawned = {
  tree?: SurfaceElement;
  listing?: SurfaceElement;
  detail?: SurfaceElement;
  main?: SurfaceElement;
};

export function spawn(opts: {
  url: URL;
  graph: NodeSpec;
  kinds: KindHandlers;
  host: SpawnHost;
  ctx: ViewContext;
}): Spawned {
  const resolved = resolve(opts.graph, opts.url.pathname);
  const pageOf = (node: NodeSpec): SurfaceElement => {
    const kind = node.kind ? opts.kinds[node.kind] : undefined;
    if (kind?.detail) return kind.detail(opts.ctx);
    return defaultPage(node);
  };

  const listing =
    resolved.listingNode && resolved.listingPath
      ? defaultListing(resolved.listingNode, resolved.listingPath, opts.ctx)
      : undefined;

  let detail: SurfaceElement | undefined;
  if (resolved.hole) {
    detail = defaultNotFound();
  } else if (resolved.node?.detail === "page") {
    detail = pageOf(resolved.node);
  } else if (resolved.node?.detail === "tabs") {
    detail = defaultTabHost(
      resolved.node,
      resolved.nodePath,
      undefined,
      opts.ctx,
      (child) => pageOf(child),
    );
  } else if (resolved.node?.tabOfParent) {
    const parts = resolved.nodePath.split("/").filter(Boolean);
    const parentPath = "/" + parts.slice(0, -1).join("/");
    const themeResolved = resolve(opts.graph, parentPath);
    if (themeResolved.node?.detail === "tabs") {
      detail = defaultTabHost(
        themeResolved.node,
        parentPath,
        resolved.node.segment,
        opts.ctx,
        (child) => pageOf(child),
      );
    } else {
      detail = pageOf(resolved.node);
    }
  }

  const treeSelected = deepestTreePath(opts.graph, opts.url.pathname);
  const treeSurf = defaultTree(opts.graph, opts.ctx, treeSelected);

  if (opts.host === "window") {
    if (resolved.hole) return { main: defaultNotFound() };
    if (resolved.node?.tabOfParent && resolved.node.detail === "page") {
      return { main: pageOf(resolved.node) };
    }
    if (resolved.node?.detail === "tabs") return { main: detail };
    return { main: listing ?? defaultPage(resolved.node ?? opts.graph) };
  }

  return { tree: treeSurf, listing, detail };
}

function deepestTreePath(graph: NodeSpec, pathname: string): string | null {
  const parts = pathname.split("/").filter(Boolean);
  let node: NodeSpec = graph;
  let path = "";
  let last: string | null = null;
  for (const part of parts) {
    const next = childList(node).find((c) => c.segment === part);
    if (!next) break;
    path = joinPath(path || "/", part);
    node = next;
    if (next.tree) last = path;
  }
  return last;
}
