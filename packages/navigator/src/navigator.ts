import { button } from "@workshell/kit";
import { field } from "@workshell/kit";
import { UrlHistory } from "./history";
import {
  type AppRegistration,
  type DockId,
  type NormalizedApp,
  type SurfaceElement,
  type ViewContext,
  canonical,
  matchRule,
  normalizeRegistration,
  parseHref,
  schemeOf,
} from "./registry";

const DOCKS: DockId[] = ["leading", "center", "trailing"];

export class Navigator {
  readonly root: HTMLElement;
  private readonly history: UrlHistory;
  private readonly apps = new Map<string, NormalizedApp>();
  private readonly surfaceCache = new Map<string, SurfaceElement>();
  private readonly drawerToggleBtn: HTMLButtonElement;
  private readonly backBtn: HTMLButtonElement;
  private readonly fwdBtn: HTMLButtonElement;
  private readonly addressInput: HTMLInputElement;

  constructor(host: HTMLElement, opts: { initialUrl: string }) {
    const parsed = parseHref(opts.initialUrl);
    if (!parsed) throw new Error("initialUrl");
    const initial = canonical(parsed);
    this.history = new UrlHistory(initial);

    host.replaceChildren();
    this.root = document.createElement("div");
    this.root.className = "nav";
    const chrome = document.createElement("div");
    chrome.className = "nav-chrome";
    this.drawerToggleBtn = button({ label: "Menu", kind: "neutral", onClick: () => this.toggleDrawer() });
    this.drawerToggleBtn.dataset.nav = "drawer-toggle";
    this.drawerToggleBtn.setAttribute("aria-label", "Toggle navigation menu");
    this.backBtn = button({ label: "Back", kind: "neutral", onClick: () => this.back() });
    this.backBtn.dataset.nav = "back";
    this.backBtn.setAttribute("aria-label", "Back");
    this.fwdBtn = button({ label: "Forward", kind: "neutral", onClick: () => this.forward() });
    this.fwdBtn.dataset.nav = "forward";
    this.fwdBtn.setAttribute("aria-label", "Forward");
    const address = field({ name: "address", label: "Address", value: initial });
    this.addressInput = address.querySelector("input")!;
    this.addressInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.go(this.addressInput.value);
    });
    chrome.append(this.drawerToggleBtn, this.backBtn, this.fwdBtn, address);
    const docks = document.createElement("div");
    docks.className = "nav-docks";
    for (const id of DOCKS) {
      const col = document.createElement("div");
      col.className = "nav-dock";
      col.dataset.dock = id;
      col.dataset.empty = "true";
      col.dataset.open = "false";
      docks.append(col);
    }
    this.root.append(chrome, docks);
    host.append(this.root);
    this.syncChrome();
  }

  get url(): URL {
    return new URL(this.history.current);
  }

  register(app: AppRegistration): void {
    const norm = normalizeRegistration(app);
    if (this.apps.has(norm.scheme)) throw new Error("already registered");
    this.apps.set(norm.scheme, norm);
    if (schemeOf(this.url) === norm.scheme) this.apply(this.history.current);
  }

  toggleDrawer(): void {
    const leading = this.root.querySelector('[data-dock="leading"]') as HTMLElement | null;
    if (!leading) return;
    leading.dataset.open = leading.dataset.open === "true" ? "false" : "true";
  }

  go(href: string): void {
    const parsed = parseHref(href);
    if (!parsed) return;
    const next = canonical(parsed);
    if (!this.apps.has(schemeOf(parsed))) return;
    if (next === this.history.current) {
      const leading = this.root.querySelector('[data-dock="leading"]') as HTMLElement | null;
      if (leading) leading.dataset.open = "false";
      return;
    }
    this.history.push(next);
    this.apply(next);
  }

  back(): void {
    const href = this.history.back();
    if (href) this.apply(href);
  }

  forward(): void {
    const href = this.history.forward();
    if (href) this.apply(href);
  }

  private apply(href: string): void {
    const leadingDock = this.root.querySelector('[data-dock="leading"]') as HTMLElement | null;
    if (leadingDock) leadingDock.dataset.open = "false";
    const url = new URL(href);
    const app = this.apps.get(schemeOf(url));
    const ctx: ViewContext = {
      url,
      params: {},
      query: url.searchParams,
      go: (h: string) => this.go(h),
      back: () => this.back(),
      forward: () => this.forward(),
      canGoBack: this.history.index > 0,
      canGoForward: this.history.index < this.history.entries.length - 1,
    };
    const rule = app ? matchRule(app.rules, url.pathname) : undefined;
    for (const id of DOCKS) {
      const col = this.root.querySelector(`[data-dock="${id}"]`) as HTMLElement;
      const viewName = rule?.docks[id];
      if (app && viewName) {
        col.dataset.empty = "false";
        const cacheKey = `${app.scheme}:${viewName}`;
        let surface = this.surfaceCache.get(cacheKey);
        if (!surface) {
          surface = app.views[viewName]!(ctx);
          this.surfaceCache.set(cacheKey, surface);
        }
        if (col.firstElementChild !== surface) {
          col.replaceChildren(surface);
        }
        surface.onUpdate?.(ctx);
      } else {
        col.dataset.empty = "true";
        col.replaceChildren();
      }
    }
    this.syncChrome();
  }

  private syncChrome(): void {
    this.addressInput.value = this.history.current;
    this.backBtn.disabled = this.history.index <= 0;
    this.fwdBtn.disabled = this.history.index >= this.history.entries.length - 1;
  }
}
