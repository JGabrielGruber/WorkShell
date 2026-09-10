# Settings Resource Spec Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Settings contributes a `settings:` node graph; navigator resolves/spawns surfaces by role; Appearance → Theme catalog → instance → Colors inspects pigment tokens without calling `setTheme`.

**Architecture:** `@workshell/theme` gains `inspect(id)` (read-only `--color-*` for a catalog id, no `apply`). `@workshell/navigator` accepts `graph` **xor** `views`+`rules`; `resolve` + public `spawn` feed default kit tree/icons/tab-host/page. Settings deletes `appearanceView`; it registers `settingsGraph(session)` and kind `theme-colors`. Probe prefix is unchanged.

**Tech Stack:** TypeScript, Vitest (jsdom), existing `@workshell/kit` primitives (`tree`, `iconView`, `tabs`, `page`, `listView`). No new tokens, no pointer-path reads, do not kill Vite, do not push.

**Spec:** `docs/superpowers/specs/2026-09-10-workshell-settings-resource-spec-design.md`

**Worktree:** Create via `using-git-worktrees` at execution time. Run `npx vitest run packages/<pkg>` and `npx tsc --noEmit` from the worktree.

---

## File map

| File | Responsibility |
|---|---|
| `packages/theme/src/theme.ts` | Add `inspect(id)` + `BASE_COLORS` |
| `packages/theme/src/theme.test.ts` | Engine inspect tests |
| `packages/theme/src/tokens.test.ts` | Inspect values match `tokens.css` |
| `packages/navigator/src/registry.ts` | Optional `graph`/`kinds`; `canonical` keeps hash; XOR normalize |
| `packages/navigator/src/registry.test.ts` | Hash + XOR tests |
| `packages/navigator/src/graph.ts` | `NodeSpec`, `resolve`, `spawn`, path helpers |
| `packages/navigator/src/graph.test.ts` | Resolve + spawn (navigator vs window) |
| `packages/navigator/src/defaults.ts` | Default tree / listing / tabs / page / not-found factories |
| `packages/navigator/src/navigator.ts` | `apply` uses `spawn` when `app.graph` |
| `packages/navigator/src/navigator.test.ts` | Graph-hosted navigator; probe tests stay |
| `packages/navigator/src/index.ts` | Export graph types + `spawn` / `resolve` |
| `packages/settings/src/graph.ts` | `settingsGraph(session)` |
| `packages/settings/src/colors.ts` | `theme-colors` detail page |
| `packages/settings/src/settings.ts` | Register graph + kinds |
| `packages/settings/src/settings.test.ts` | Guest: tree, icons, inspect, no `setTheme` |
| `packages/settings/src/index.ts` | Stop exporting `appearanceView` |
| Delete `packages/settings/src/appearance.ts` | Old list + `setTheme` |
| Delete `packages/settings/src/appearance.test.ts` | Replaced by settings tests |

---

### Task 1: `theme.inspect`

**Files:**
- Modify: `packages/theme/src/theme.ts`
- Modify: `packages/theme/src/theme.test.ts`
- Modify: `packages/theme/src/tokens.test.ts`

- [ ] **Step 1: Write failing inspect tests**

Append to `packages/theme/src/theme.test.ts`:

```ts
  it("inspects base color tokens without apply", () => {
    const theme = createTheme();
    const el = document.createElement("div");
    el.dataset.theme = "already";
    const colors = theme.inspect("base").colors;
    expect(colors.find((c) => c.token === "--color-primary")).toEqual({
      token: "--color-primary",
      value: "#000080",
    });
    expect(el.dataset.theme).toBe("already");
    expect(colors.every((c) => c.token.startsWith("--color-"))).toBe(true);
  });

  it("inspect unknown id throws", () => {
    const theme = createTheme();
    expect(() => theme.inspect("nope")).toThrow(/theme/);
  });
```

In `packages/theme/src/tokens.test.ts`, add (file already reads `css` and `CONTRACT_VARS`):

```ts
import { createTheme } from "./theme";

  it("inspect(base) matches --color-* literals in tokens.css", () => {
    const names = CONTRACT_VARS.filter((n) => n.startsWith("--color-"));
    const inspected = createTheme().inspect("base").colors;
    expect(inspected.map((c) => c.token)).toEqual([...names]);
    for (const { token, value } of inspected) {
      const re = new RegExp(`${token.replace(/[*-]/g, "\\$&")}:\\s*${value.replace(/[*-]/g, "\\$&")}`);
      expect(css, `css missing ${token}: ${value}`).toMatch(re);
    }
  });
```

Escape note: prefer `css.includes(`${token}: ${value}`)` if the regex is painful — `tokens.css` uses `--color-primary: #000080;`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run packages/theme`
Expected: FAIL — `inspect` is not a function / not on type `Theme`.

- [ ] **Step 3: Implement inspect**

In `packages/theme/src/theme.ts`, add the pigment table (values copied from `packages/theme/src/base/tokens.css`) and the method:

```ts
export const BASE_COLORS: { token: string; value: string }[] = [
  { token: "--color-base-100", value: "#ffffff" },
  { token: "--color-base-200", value: "#c0c0c0" },
  { token: "--color-base-300", value: "#808080" },
  { token: "--color-base-content", value: "#000000" },
  { token: "--color-primary", value: "#000080" },
  { token: "--color-primary-content", value: "#ffffff" },
  { token: "--color-secondary", value: "#1084d0" },
  { token: "--color-secondary-content", value: "#ffffff" },
  { token: "--color-accent", value: "#008080" },
  { token: "--color-accent-content", value: "#ffffff" },
  { token: "--color-neutral", value: "#c0c0c0" },
  { token: "--color-neutral-content", value: "#000000" },
  { token: "--color-info", value: "#000080" },
  { token: "--color-info-content", value: "#ffffff" },
  { token: "--color-success", value: "#008000" },
  { token: "--color-success-content", value: "#ffffff" },
  { token: "--color-warning", value: "#808000" },
  { token: "--color-warning-content", value: "#000000" },
  { token: "--color-error", value: "#800000" },
  { token: "--color-error-content", value: "#ffffff" },
  { token: "--color-muted", value: "#808080" },
];

export type Theme = {
  register(theme: ThemeRegistration): void;
  list(): ThemeRegistration[];
  apply(el: HTMLElement, id: string): void;
  inspect(id: string): { colors: { token: string; value: string }[] };
};
```

Inside `createTheme()` `api`:

```ts
    inspect(id) {
      if (!catalog.some((t) => t.id === id)) throw new Error("theme");
      if (id !== "base") throw new Error("theme");
      return { colors: BASE_COLORS.map((c) => ({ ...c })) };
    },
```

Do **not** call `apply`. Extra skins this spec: inspect throws `/theme/` (only `base` is tested).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run packages/theme`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/theme/src/theme.ts packages/theme/src/theme.test.ts packages/theme/src/tokens.test.ts
git commit -m "feat(theme): inspect base color tokens without apply"
```

---

### Task 2: Canonical hash + graph XOR registration

**Files:**
- Modify: `packages/navigator/src/registry.ts`
- Modify: `packages/navigator/src/registry.test.ts`

- [ ] **Step 1: Write failing tests**

Add to `packages/navigator/src/registry.test.ts`:

```ts
import { canonical, parseHref } from "./registry";

describe("canonical", () => {
  it("keeps hash", () => {
    const url = parseHref("settings:/appearance/theme/base/colors#primary-color")!;
    expect(canonical(url)).toBe(
      "settings:/appearance/theme/base/colors#primary-color",
    );
  });

  it("omits empty hash", () => {
    expect(canonical(parseHref("probe:/fields")!)).toBe("probe:/fields");
  });
});

describe("graph xor rules", () => {
  const graph = {
    segment: "",
    title: "root",
    listing: "none" as const,
    detail: "none" as const,
  };

  it("throws /graph/ when graph and views both set", () => {
    expect(() =>
      normalizeRegistration({
        scheme: "settings",
        graph,
        views,
        rules: [{ path: "/", docks: { center: "icons" } }],
      }),
    ).toThrow(/graph/);
  });

  it("accepts graph without views", () => {
    const app = normalizeRegistration({ scheme: "settings", graph });
    expect(app.graph?.title).toBe("root");
    expect(app.rules).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run packages/navigator/src/registry.test.ts`
Expected: FAIL — `canonical` drops hash; `graph` not on type / throws views.

- [ ] **Step 3: Update registry types and normalize**

`packages/navigator/src/registry.ts` — extend types (keep `ViewRule` / `ViewFactory` as they are):

```ts
export type NodeSpec = {
  segment: string;
  title: string;
  tree?: boolean;
  listing?: "children" | "parent" | "none";
  detail?: "none" | "tabs" | "page";
  tabOfParent?: boolean;
  kind?: string;
  children?: NodeSpec[] | (() => NodeSpec[]);
};

export type KindHandlers = Record<
  string,
  { listing?: ViewFactory; detail?: ViewFactory }
>;

export type AppRegistration = {
  scheme: string;
  views?: Record<string, ViewFactory>;
  rules?: ViewRule[];
  graph?: NodeSpec;
  kinds?: KindHandlers;
};

export type NormalizedApp = {
  scheme: string;
  views: Record<string, ViewFactory>;
  rules: ViewRule[];
  graph?: NodeSpec;
  kinds?: KindHandlers;
};

export function normalizeRegistration(app: AppRegistration): NormalizedApp {
  if (!app.scheme) throw new Error("scheme required");
  const hasGraph = !!app.graph;
  const hasViews = !!(app.views && Object.keys(app.views).length);
  const hasRules = !!(app.rules && app.rules.length);
  if (hasGraph && (hasViews || hasRules)) throw new Error("graph");
  if (!hasGraph) {
    if (!app.views || !app.rules) throw new Error("views");
    for (const rule of app.rules) {
      for (const name of Object.values(rule.docks)) {
        if (!app.views[name]) throw new Error(`unknown view: ${name}`);
      }
    }
    const rules = [...app.rules].sort((a, b) => b.path.length - a.path.length);
    return { scheme: app.scheme, views: app.views, rules };
  }
  return {
    scheme: app.scheme,
    views: {},
    rules: [],
    graph: app.graph,
    kinds: app.kinds,
  };
}

export function canonical(url: URL): string {
  return `${url.protocol}${url.pathname}${url.search}${url.hash}`;
}
```

Existing `matchRule` unchanged. Probe registrations still pass `views`+`rules` only.

- [ ] **Step 4: Run tests**

Run: `npx vitest run packages/navigator/src/registry.test.ts packages/navigator/src/navigator.test.ts`
Expected: PASS (probe still uses views+rules; address bar without hash still matches).

- [ ] **Step 5: Commit**

```bash
git add packages/navigator/src/registry.ts packages/navigator/src/registry.test.ts
git commit -m "feat(navigator): keep URL hash; graph xor view rules"
```

---

### Task 3: `resolve` the node graph

**Files:**
- Create: `packages/navigator/src/graph.ts`
- Create: `packages/navigator/src/graph.test.ts`

- [ ] **Step 1: Write failing resolve tests**

`packages/navigator/src/graph.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run packages/navigator/src/graph.test.ts`
Expected: FAIL — cannot find module `./graph`.

- [ ] **Step 3: Implement resolve**

`packages/navigator/src/graph.ts`:

```ts
import type { KindHandlers, NodeSpec, SurfaceElement, ViewContext } from "./registry";

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
    nodePath: hole ? joinPath(stack[stack.length - 1]!.path, parts[parts.length - 1]!) : path || "/",
    listingNode,
    listingPath,
    hole,
  };
}
```

Leave `spawn` for Task 4 (export a stub only if tests import it — they should not yet).

Re-export `NodeSpec` from registry (already there). Do not duplicate the type.

- [ ] **Step 4: Run tests**

Run: `npx vitest run packages/navigator/src/graph.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/navigator/src/graph.ts packages/navigator/src/graph.test.ts
git commit -m "feat(navigator): resolve settings-style node graphs"
```

---

### Task 4: `spawn` default views + window host

**Files:**
- Create: `packages/navigator/src/defaults.ts`
- Modify: `packages/navigator/src/graph.ts`
- Modify: `packages/navigator/src/graph.test.ts`

- [ ] **Step 1: Write failing spawn tests**

Append to `packages/navigator/src/graph.test.ts`:

```ts
import { spawn } from "./graph";
import type { ViewContext } from "./registry";

function ctx(href: string): ViewContext {
  const url = new URL(href);
  return {
    url,
    params: {},
    query: url.searchParams,
    go: () => {},
    back: () => {},
    forward: () => {},
    canGoBack: false,
    canGoForward: false,
  };
}

describe("spawn", () => {
  const graph = fixtureGraph();
  const kinds = {
    "theme-colors": {
      detail: () => {
        const el = document.createElement("div");
        el.dataset.view = "colors";
        return el;
      },
    },
  };

  it("navigator at appearance: tree+listing, no detail", () => {
    const c = ctx("settings:/appearance");
    const out = spawn({ url: c.url, graph, kinds, host: "navigator", ctx: c });
    expect(out.tree?.textContent).toContain("Appearance");
    expect(out.tree?.textContent).toContain("Theme");
    expect(out.listing?.textContent).toContain("Theme");
    expect(out.detail).toBeUndefined();
  });

  it("navigator at instance: listing stays catalog, detail is tab host", () => {
    const c = ctx("settings:/appearance/theme/base");
    const out = spawn({ url: c.url, graph, kinds, host: "navigator", ctx: c });
    expect(out.listing?.textContent).toContain("Base");
    expect(out.detail?.querySelector("[role=tab]")?.textContent).toContain("Colors");
    expect(out.detail?.querySelector("[data-view=colors]")).toBeTruthy();
  });

  it("window at colors is colors only", () => {
    const c = ctx("settings:/appearance/theme/base/colors");
    const out = spawn({ url: c.url, graph, kinds, host: "window", ctx: c });
    expect(out.main?.dataset.view).toBe("colors");
    expect(out.tree).toBeUndefined();
    expect(out.listing).toBeUndefined();
  });

  it("hole instance: not-found detail, listing ok", () => {
    const c = ctx("settings:/appearance/theme/nope");
    const out = spawn({ url: c.url, graph, kinds, host: "navigator", ctx: c });
    expect(out.listing?.textContent).toContain("Base");
    expect(out.detail?.textContent).toMatch(/Not found/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run packages/navigator/src/graph.test.ts`
Expected: FAIL — `spawn` is not exported.

- [ ] **Step 3: Implement defaults + spawn**

`packages/navigator/src/defaults.ts`:

```ts
import { iconView } from "@workshell/kit";
import { page } from "@workshell/kit";
import { tabs } from "@workshell/kit";
import { tree } from "@workshell/kit";
import type { NodeSpec, SurfaceElement, ViewContext } from "./registry";
import { childList, joinPath } from "./graph";

function href(protocol: string, path: string): string {
  return `${protocol}${path}`;
}

export function treeModel(graph: NodeSpec, prefix = ""): { id: string; label: string; children?: ReturnType<typeof treeModel> }[] {
  const out: { id: string; label: string; children?: ReturnType<typeof treeModel> }[] = [];
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

export function defaultListing(listingNode: NodeSpec, listingPath: string, ctx: ViewContext): SurfaceElement {
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
```

**Circular import:** `defaults.ts` imports `childList`/`joinPath` from `graph.ts`, and `graph.ts` `spawn` will import defaults. Split helpers to avoid cycles: keep `childList`/`joinPath`/`resolve` in `graph.ts`; put `spawn` in `graph.ts` and import defaults. If the bundler/tsc cycles, move helpers into `graph.ts` only and have `defaults.ts` import type-only + helpers — Vitest/TS project is `nodenext`. Prefer: put `childList` and `joinPath` in `graph.ts`; `spawn` in `graph.ts` after importing defaults. Node ESM cycles work if `spawn` runs after both evaluate. If `tsc` errors, move helpers to `packages/navigator/src/paths.ts`.

`spawn` in `graph.ts`:

```ts
import type { KindHandlers, NodeSpec, SurfaceElement, ViewContext } from "./registry";
import {
  defaultListing,
  defaultNotFound,
  defaultPage,
  defaultTabHost,
  defaultTree,
  treeModel,
} from "./defaults";

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
    // instance is parent of colors
    const parentSeg = parts[parts.length - 2];
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
```

When URL is `.../base/colors`, navigator host still needs **listing** of Theme plus **tab host** (not only the colors page). Window host returns Colors page only (`tabOfParent` + `detail === "page"`).

When URL is `.../base`, `detail === "tabs"` → tab host, first tab.

- [ ] **Step 4: Run tests**

Run: `npx vitest run packages/navigator/src/graph.test.ts`
Expected: PASS.

If circular import fails, extract `childList`/`joinPath`/`resolve` to `packages/navigator/src/paths.ts` and import from both.

- [ ] **Step 5: Commit**

```bash
git add packages/navigator/src/graph.ts packages/navigator/src/graph.test.ts packages/navigator/src/defaults.ts packages/navigator/src/paths.ts
git commit -m "feat(navigator): spawn graph surfaces for navigator and window hosts"
```

---

### Task 5: Navigator applies graph registrations

**Files:**
- Modify: `packages/navigator/src/navigator.ts`
- Modify: `packages/navigator/src/navigator.test.ts`
- Modify: `packages/navigator/src/index.ts`

- [ ] **Step 1: Write failing navigator graph test**

Append to `packages/navigator/src/navigator.test.ts` (reuse `fixtureGraph` copy or import from `graph.test.ts` — **do not import from graph.test.ts**. Duplicate a small `settingsGraph()` helper at the bottom of `navigator.test.ts`, same shape as Task 3, `ids = ["base"]`).

```ts
  it("graph: empty trailing until instance; window not required", () => {
    const host = document.createElement("div");
    const nav = new Navigator(host, { initialUrl: "settings:/appearance" });
    const kinds = {
      "theme-colors": {
        detail: () => {
          const el = document.createElement("div");
          el.dataset.view = "colors";
          return el;
        },
      },
    };
    nav.register({ scheme: "settings", graph: settingsGraph(), kinds });
    expect(dock(nav, "leading").textContent).toContain("Theme");
    expect(dock(nav, "center").textContent).toContain("Theme");
    expect(dock(nav, "trailing").dataset.empty).toBe("true");

    nav.go("settings:/appearance/theme");
    expect(dock(nav, "center").textContent).toContain("Base");
    expect(dock(nav, "trailing").dataset.empty).toBe("true");

    nav.go("settings:/appearance/theme/base");
    expect(dock(nav, "center").textContent).toContain("Base");
    expect(dock(nav, "trailing").dataset.empty).toBe("false");
    expect(dock(nav, "trailing").textContent).toContain("Colors");

    const tab = dock(nav, "trailing").querySelector("[role=tab]") as HTMLElement;
    tab.click();
    expect(nav.url.pathname).toBe("/appearance/theme/base/colors");
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run packages/navigator/src/navigator.test.ts`
Expected: FAIL — register graph does not fill docks.

- [ ] **Step 3: Wire `apply`**

In `packages/navigator/src/navigator.ts`, import `spawn`. Replace the rule loop body:

```ts
    if (app?.graph) {
      const spawned = spawn({
        url,
        graph: app.graph,
        kinds: app.kinds ?? {},
        host: "navigator",
        ctx,
      });
      const assigned: Record<DockId, SurfaceElement | undefined> = {
        leading: spawned.tree,
        center: spawned.listing,
        trailing: spawned.detail,
      };
      for (const id of DOCKS) {
        const col = this.root.querySelector(`[data-dock="${id}"]`) as HTMLElement;
        const surface = assigned[id];
        if (surface) {
          col.dataset.empty = "false";
          const cacheKey = `${app.scheme}:graph:${id}`;
          let cached = this.surfaceCache.get(cacheKey);
          if (!cached) {
            cached = surface;
            this.surfaceCache.set(cacheKey, cached);
          }
          if (col.firstElementChild !== cached) col.replaceChildren(cached);
          cached.onUpdate?.(ctx);
        } else {
          col.dataset.empty = "true";
          col.replaceChildren();
          this.surfaceCache.delete(`${app.scheme}:graph:${id}`);
        }
      }
    } else {
      const rule = app ? matchRule(app.rules, url.pathname) : undefined;
      // existing viewName loop unchanged
    }
```

**Keep-alive caveat:** caching only by dock id reuses listing when navigating appearance → theme, but listing **content** must change (Theme icon vs Base icon). That is why `defaultListing` paints inside `onUpdate`. **Always call `onUpdate`**. First mount: if cache is from a previous listing node, `onUpdate` must rebuild icons from current `resolve` — defaults currently close over the **first** `listingNode`. Fix: store listing factory that re-resolves on `onUpdate`, **or** cache key includes `listingPath` / `detailPath`:

```ts
const cacheKey = `${app.scheme}:${id}:${id === "leading" ? "tree" : id === "center" ? spawnedListingPath : spawnedDetailPath}`;
```

Pass paths out of `spawn` or re-resolve in `apply`:

```ts
const r = resolve(app.graph, url.pathname);
const listingKey = r.listingPath ?? "";
const detailKey = r.hole ? "hole" : r.nodePath + (r.node?.detail ?? "");
```

Use:

- leading: `${scheme}:tree`
- center: `${scheme}:listing:${listingKey}`
- trailing: `${scheme}:detail:${detailKey}` (empty → no cache, dock empty)

When the key changes, create a new surface via `spawn` (already done each apply — only reuse if `cacheKey` hits). Simplest correct approach: **call `spawn` every apply**, then:

```
const key = ...
let surface = cache.get(key);
if (!surface) { surface = spawned.xxx; cache.set(key, surface); }
```

Do not reuse appearance listing for theme listing.

Probe `views` path unchanged.

Export from `packages/navigator/src/index.ts`:

```ts
export { spawn, resolve } from "./graph";
export type { NodeSpec, KindHandlers } from "./registry";
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run packages/navigator`
Expected: PASS (probe keep-alive tests still pass).

- [ ] **Step 5: Commit**

```bash
git add packages/navigator/src/navigator.ts packages/navigator/src/navigator.test.ts packages/navigator/src/index.ts
git commit -m "feat(navigator): apply graph registrations into docks"
```

---

### Task 6: Settings graph + Colors page; delete appearance list

**Files:**
- Create: `packages/settings/src/graph.ts`
- Create: `packages/settings/src/colors.ts`
- Modify: `packages/settings/src/settings.ts`
- Modify: `packages/settings/src/index.ts`
- Delete: `packages/settings/src/appearance.ts`
- Delete: `packages/settings/src/appearance.test.ts`
- Modify: `packages/settings/src/settings.test.ts`

- [ ] **Step 1: Write failing Colors + guest tests**

Replace the catalog-click assertions in `packages/settings/src/settings.test.ts`. Keep `mem()`, `createDesktop`, menu → Settings. Change the mount test to:

```ts
  it("mounts navigator at settings:/appearance as a section", () => {
    const storage = mem();
    const session = createSession({ storage });
    const setTheme = session.setTheme.bind(session);
    let setThemeCalls = 0;
    session.setTheme = (id) => {
      setThemeCalls += 1;
      return setTheme(id);
    };
    session.register(createSettings(session));
    const { workspace, engine } = createDesktop(document.createElement("div"), session, {
      seed: emptyLayout,
    });
    const btn = workspace.querySelector("[data-slot=menu] [aria-label=Menu]") as HTMLElement;
    btn.click();
    const menuList = btn.nextElementSibling as HTMLElement;
    const settingsRow = [...menuList.querySelectorAll("*")].find((el) => el.textContent === "Settings") as
      | HTMLElement
      | undefined;
    settingsRow!.click();
    const body = engine.node("settings").querySelector(".panel-body")!;
    const input = body.querySelector(".nav-chrome input") as HTMLInputElement;
    expect(input.value).toBe("settings:/appearance");
    expect(body.querySelector(".nav-dock[data-dock=leading]")?.textContent).toContain("Appearance");
    expect(body.querySelector(".nav-dock[data-dock=leading]")?.textContent).toContain("Theme");
    expect(body.querySelector(".nav-dock[data-dock=center]")?.textContent).toContain("Theme");
    expect(body.querySelector(".nav-dock[data-dock=trailing]")?.getAttribute("data-empty")).toBe("true");

    const themeIcon = [...body.querySelectorAll("[data-id]")].find(
      (el) => (el as HTMLElement).dataset.id === "theme",
    ) as HTMLElement;
    themeIcon.click();
    expect(input.value).toBe("settings:/appearance/theme");
    expect(body.querySelector(".nav-dock[data-dock=center]")?.textContent).toContain("Base");
    expect(body.querySelector(".nav-dock[data-dock=trailing]")?.getAttribute("data-empty")).toBe("true");

    const baseIcon = [...body.querySelectorAll("[data-id]")].find(
      (el) => (el as HTMLElement).dataset.id === "base",
    ) as HTMLElement;
    baseIcon.click();
    expect(input.value).toBe("settings:/appearance/theme/base");
    expect(setThemeCalls).toBe(0);
    expect(storage.getItem(PREFS_KEY)).toBeNull();
    const trailing = body.querySelector(".nav-dock[data-dock=trailing]")!;
    expect(trailing.getAttribute("data-empty")).toBe("false");
    expect(trailing.textContent).toContain("Colors");
    expect(trailing.textContent).toContain("--color-primary");
    expect(trailing.textContent).toContain("#000080");
  });
```

Add `packages/settings/src/colors.ts` tests inline in `settings.test.ts` or a small `colors.test.ts` that calls `colorsPage` with a fake ctx after `createSession`+`boot` (inspect works without boot). Prefer a focused `colors.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createSession } from "@workshell/session";
import { colorsPage } from "./colors";

it("lists inspect colors for the instance segment", () => {
  const session = createSession({ storage: mem() });
  const ctx = {
    url: new URL("settings:/appearance/theme/base/colors"),
    params: {},
    query: new URLSearchParams(),
    go: () => {},
    back: () => {},
    forward: () => {},
    canGoBack: false,
    canGoForward: false,
  };
  const el = colorsPage(ctx, session);
  expect(el.textContent).toContain("Colors");
  expect(el.textContent).toContain("--color-primary");
});
```

Copy `mem()` into that file (same as appearance.test — do not share a util unless one already exists).

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run packages/settings`
Expected: FAIL — still listView Appearance / `setTheme` on click; `appearanceView` tests if not deleted yet.

- [ ] **Step 3: Implement graph, colors, guest; delete appearance**

`packages/settings/src/graph.ts`:

```ts
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
```

`packages/settings/src/colors.ts`:

```ts
import { listView } from "@workshell/kit";
import { page } from "@workshell/kit";
import type { SurfaceElement, ViewContext } from "@workshell/navigator";
import type { WorkshellSession } from "@workshell/session";

export function colorsPage(ctx: ViewContext, session: WorkshellSession): SurfaceElement {
  const parts = ctx.url.pathname.split("/").filter(Boolean);
  const id = parts[2] ?? "";
  const colors = session.theme.inspect(id).colors;
  const body = listView({
    items: colors.map((c) => ({ id: c.token, label: `${c.token} ${c.value}` })),
  });
  return page({ title: "Colors", body });
}
```

Instance id is the third segment: `appearance`, `theme`, `{id}`, `colors`.

`packages/settings/src/settings.ts`:

```ts
import { Navigator } from "@workshell/navigator";
import type { AppRegistration, WorkshellSession } from "@workshell/session";
import { colorsPage } from "./colors";
import { settingsGraph } from "./graph";

export function createSettings(session: WorkshellSession): AppRegistration {
  return {
    id: "settings",
    title: "Settings",
    mount(el) {
      const nav = new Navigator(el, { initialUrl: "settings:/appearance" });
      nav.register({
        scheme: "settings",
        graph: settingsGraph(session),
        kinds: {
          "theme-colors": { detail: (ctx) => colorsPage(ctx, session) },
        },
      });
    },
  };
}
```

`packages/settings/src/index.ts`:

```ts
export { createSettings } from "./settings";
```

Delete `appearance.ts` and `appearance.test.ts`. Grep the repo for `appearanceView` and remove leftovers.

Session `WorkshellSession.theme` must be the `Theme` type that includes `inspect`. If session types the engine as `Theme` from `@workshell/theme`, Task 1 already widened it.

- [ ] **Step 4: Run tests**

Run: `npx vitest run packages/settings packages/navigator packages/theme`
Run: `npx tsc --noEmit`
Expected: PASS / clean.

- [ ] **Step 5: Commit**

```bash
git add packages/settings packages/navigator/src/index.ts
git rm packages/settings/src/appearance.ts packages/settings/src/appearance.test.ts
git commit -m "feat(settings): Appearance section graph; Colors inspect; drop setTheme list"
```

---

### Task 7: Docs pointers

STATUS and AGENTS already point at this plan (landed with the plan commit). If a worktree copy is stale, set:

- `docs/superpowers/STATUS.md` active row plan → `2026-09-10-workshell-settings-resource-spec.md`
- `AGENTS.md` Active Plan → the same path

No extra commit if already pointed.

---

## Self-review (author)

| Spec success / law | Task |
|---|---|
| `inspect(base)` pigment, no apply | 1 |
| unknown inspect throws `/theme/` | 1 |
| `canonical` keeps hash | 2 |
| graph XOR views+rules; probe unchanged | 2, 5 |
| resolve listing parent; hole under Theme | 3 |
| spawn navigator vs window | 4 |
| tree Appearance+Theme; trailing empty until instance | 5, 6 |
| icon click navigates, no `setTheme` | 6 |
| Colors lists `--color-primary` | 6 |
| delete appearance listView | 6 |
| tab click updates path | 5 |
| no new tokens / no pointer-path / no tear-out | all |

No `setTheme` / Apply / Desktop / custom tiles / field-hash chrome in any task.
