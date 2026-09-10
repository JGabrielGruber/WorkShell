export type DockId = "leading" | "center" | "trailing";

export type ViewContext = {
  url: URL;
  params: Record<string, string>;
  query: URLSearchParams;
  go: (href: string) => void;
  back: () => void;
  forward: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
};

export type SurfaceElement = HTMLElement & {
  onUpdate?: (ctx: ViewContext) => void;
};

export type ViewFactory = (ctx: ViewContext) => SurfaceElement;

export type ViewRule = {
  path: string;
  docks: Partial<Record<DockId, string>>;
};

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

export function matchRule(rules: ViewRule[], pathname: string): ViewRule | undefined {
  return rules.find((r) => {
    if (r.path === "/") return pathname.startsWith("/");
    return pathname === r.path || pathname.startsWith(`${r.path}/`);
  });
}

export function parseHref(href: string): URL | null {
  try {
    return new URL(href);
  } catch {
    return null;
  }
}

export function canonical(url: URL): string {
  return `${url.protocol}${url.pathname}${url.search}${url.hash}`;
}

export function schemeOf(url: URL): string {
  return url.protocol.replace(/:$/, "");
}
