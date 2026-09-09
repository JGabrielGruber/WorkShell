export type DockId = "leading" | "center" | "trailing";

export type ViewContext = {
  url: URL;
  go: (href: string) => void;
};

export type ViewFactory = (ctx: ViewContext) => HTMLElement;

export type ViewRule = {
  path: string;
  docks: Partial<Record<DockId, string>>;
};

export type AppRegistration = {
  scheme: string;
  views: Record<string, ViewFactory>;
  rules: ViewRule[];
};

export type NormalizedApp = {
  scheme: string;
  views: Record<string, ViewFactory>;
  rules: ViewRule[];
};

export function normalizeRegistration(app: AppRegistration): NormalizedApp {
  if (!app.scheme) throw new Error("scheme required");
  for (const rule of app.rules) {
    for (const name of Object.values(rule.docks)) {
      if (!app.views[name]) throw new Error(`unknown view: ${name}`);
    }
  }
  const rules = [...app.rules].sort((a, b) => b.path.length - a.path.length);
  return { scheme: app.scheme, views: app.views, rules };
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
  return `${url.protocol}${url.pathname}`;
}

export function schemeOf(url: URL): string {
  return url.protocol.replace(/:$/, "");
}
