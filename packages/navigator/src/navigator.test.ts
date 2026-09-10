import { describe, expect, it } from "vitest";
import { Navigator } from "./navigator";
import type { AppRegistration, NodeSpec, SurfaceElement, ViewContext } from "./registry";

function fixture(): AppRegistration {
  const box = (name: string) => () => {
    const el = document.createElement("div");
    el.dataset.view = name;
    return el;
  };
  return {
    scheme: "probe",
    views: {
      tree: box("tree"),
      icons: box("icons"),
      fields: box("fields"),
    },
    rules: [
      { path: "/", docks: { leading: "tree", center: "icons" } },
      { path: "/fields", docks: { leading: "tree", center: "icons", trailing: "fields" } },
    ],
  };
}

function dock(nav: Navigator, id: string): HTMLElement {
  return nav.root.querySelector(`[data-dock="${id}"]`) as HTMLElement;
}

describe("Navigator", () => {
  it("builds chrome and applies on register", () => {
    const host = document.createElement("div");
    const nav = new Navigator(host, { initialUrl: "probe:/" });
    expect(nav.root.classList.contains("nav")).toBe(true);
    expect(nav.root.querySelectorAll("[data-dock]")).toHaveLength(3);
    expect(dock(nav, "trailing").childElementCount).toBe(0);
    nav.register(fixture());
    expect(dock(nav, "leading").querySelector('[data-view="tree"]')).toBeTruthy();
    expect(dock(nav, "center").querySelector('[data-view="icons"]')).toBeTruthy();
    expect(dock(nav, "trailing").childElementCount).toBe(0);
    const back = nav.root.querySelector('[data-nav="back"]') as HTMLButtonElement;
    const fwd = nav.root.querySelector('[data-nav="forward"]') as HTMLButtonElement;
    expect(back.disabled).toBe(true);
    expect(fwd.disabled).toBe(true);
  });

  it("goes, backs, and does not match stolen prefixes", () => {
    const host = document.createElement("div");
    const nav = new Navigator(host, { initialUrl: "probe:/" });
    nav.register(fixture());
    nav.go("probe:/fields");
    expect(nav.url.pathname).toBe("/fields");
    expect(dock(nav, "trailing").querySelector('[data-view="fields"]')).toBeTruthy();
    const input = nav.root.querySelector(".nav-chrome input") as HTMLInputElement;
    expect(input.value).toBe("probe:/fields");
    nav.go("probe:/fieldsx");
    expect(dock(nav, "trailing").childElementCount).toBe(0);
    nav.back();
    expect(nav.url.pathname).toBe("/fields");
    nav.back();
    expect(nav.url.pathname).toBe("/");
    const back = nav.root.querySelector('[data-nav="back"]') as HTMLButtonElement;
    expect(back.disabled).toBe(true);
  });

  it("stamps data-empty correctly to allow auto-collapsing", () => {
    const host = document.createElement("div");
    const nav = new Navigator(host, { initialUrl: "probe:/" });
    // Initially empty before register
    expect(dock(nav, "leading").dataset.empty).toBe("true");
    expect(dock(nav, "center").dataset.empty).toBe("true");
    expect(dock(nav, "trailing").dataset.empty).toBe("true");

    nav.register(fixture());
    // On "/" probe, leading and center have views, trailing is omitted
    expect(dock(nav, "leading").dataset.empty).toBe("false");
    expect(dock(nav, "center").dataset.empty).toBe("false");
    expect(dock(nav, "trailing").dataset.empty).toBe("true");

    // Navigate to /fields where trailing has a view
    nav.go("probe:/fields");
    expect(dock(nav, "leading").dataset.empty).toBe("false");
    expect(dock(nav, "center").dataset.empty).toBe("false");
    expect(dock(nav, "trailing").dataset.empty).toBe("false");

    // Navigate back to /
    nav.back();
    expect(dock(nav, "trailing").dataset.empty).toBe("true");
  });

  it("toggles drawer and resets data-open on navigation", () => {
    const host = document.createElement("div");
    const nav = new Navigator(host, { initialUrl: "probe:/" });
    nav.register(fixture());
    const toggle = nav.root.querySelector('[data-nav="drawer-toggle"]') as HTMLButtonElement;
    expect(toggle).toBeTruthy();
    expect(toggle.getAttribute("aria-label")).toBe("Toggle navigation menu");
    expect(dock(nav, "leading").dataset.open).toBe("false");

    toggle.click();
    expect(dock(nav, "leading").dataset.open).toBe("true");

    toggle.click();
    expect(dock(nav, "leading").dataset.open).toBe("false");

    toggle.click();
    expect(dock(nav, "leading").dataset.open).toBe("true");

    nav.go("probe:/fields");
    expect(dock(nav, "leading").dataset.open).toBe("false");

    // Also test calling go with the same url
    toggle.click();
    expect(dock(nav, "leading").dataset.open).toBe("true");
    nav.go("probe:/fields");
    expect(dock(nav, "leading").dataset.open).toBe("false");
  });

  it("provides rich ViewContext including query, back, forward, canGoBack, canGoForward", () => {
    const host = document.createElement("div");
    const nav = new Navigator(host, { initialUrl: "probe:/?filter=active" });
    let capturedCtx: ViewContext | undefined;
    nav.register({
      scheme: "probe",
      views: {
        main: (ctx) => {
          capturedCtx = ctx;
          const el = document.createElement("div") as SurfaceElement;
          el.dataset.view = "main";
          el.onUpdate = (c) => {
            capturedCtx = c;
          };
          return el;
        },
      },
      rules: [{ path: "/", docks: { center: "main" } }],
    });

    expect(capturedCtx).toBeDefined();
    expect(capturedCtx!.query.get("filter")).toBe("active");
    expect(capturedCtx!.canGoBack).toBe(false);
    expect(capturedCtx!.canGoForward).toBe(false);

    nav.go("probe:/?filter=archived");
    expect(capturedCtx!.query.get("filter")).toBe("archived");
    expect(capturedCtx!.canGoBack).toBe(true);
    expect(capturedCtx!.canGoForward).toBe(false);

    capturedCtx!.back();
    expect(nav.url.searchParams.get("filter")).toBe("active");
    expect(capturedCtx!.canGoBack).toBe(false);
    expect(capturedCtx!.canGoForward).toBe(true);

    capturedCtx!.forward();
    expect(nav.url.searchParams.get("filter")).toBe("archived");
  });

  it("no-ops unknown scheme and invalid href; throws on duplicate scheme", () => {
    const host = document.createElement("div");
    const nav = new Navigator(host, { initialUrl: "probe:/" });
    nav.register(fixture());
    nav.go("other:/x");
    expect(nav.url.pathname).toBe("/");
    nav.go(":::");
    expect(nav.url.pathname).toBe("/");
    expect(() => nav.register(fixture())).toThrow(/already registered/);
  });

  it("preserves surface DOM identity, keeps input values intact, and triggers onUpdate", () => {
    const host = document.createElement("div");
    const nav = new Navigator(host, { initialUrl: "probe:/" });
    const updates: { path: string; canGoBack: boolean }[] = [];

    nav.register({
      scheme: "probe",
      views: {
        navTree: () => {
          const el = document.createElement("div") as SurfaceElement;
          el.dataset.view = "tree";
          const input = document.createElement("input");
          input.name = "filter";
          el.append(input);
          el.onUpdate = (ctx) => {
            updates.push({ path: ctx.url.pathname, canGoBack: ctx.canGoBack });
          };
          return el;
        },
        viewA: () => {
          const el = document.createElement("div");
          el.dataset.view = "a";
          return el;
        },
        viewB: () => {
          const el = document.createElement("div");
          el.dataset.view = "b";
          return el;
        },
      },
      rules: [
        { path: "/", docks: { leading: "navTree", center: "viewA" } },
        { path: "/subpath", docks: { leading: "navTree", center: "viewB" } },
      ],
    });

    const leadingDock = dock(nav, "leading");
    const initialSurface = leadingDock.firstElementChild;
    expect(initialSurface).toBeTruthy();
    expect(updates).toEqual([{ path: "/", canGoBack: false }]);

    // Enter a value into the leading dock's input
    const input = leadingDock.querySelector("input") as HTMLInputElement;
    input.value = "preserved query";

    // Navigate to /subpath - leading view is still "navTree"
    nav.go("probe:/subpath");
    expect(leadingDock.firstElementChild).toBe(initialSurface);
    expect((leadingDock.querySelector("input") as HTMLInputElement).value).toBe("preserved query");
    expect(updates).toEqual([
      { path: "/", canGoBack: false },
      { path: "/subpath", canGoBack: true },
    ]);

    // Navigate back to /
    nav.back();
    expect(leadingDock.firstElementChild).toBe(initialSurface);
    expect((leadingDock.querySelector("input") as HTMLInputElement).value).toBe("preserved query");
    expect(updates).toEqual([
      { path: "/", canGoBack: false },
      { path: "/subpath", canGoBack: true },
      { path: "/", canGoBack: false },
    ]);
  });

  it("caches surfaces and reuses them when returning to a previously mounted view", () => {
    const host = document.createElement("div");
    const nav = new Navigator(host, { initialUrl: "probe:/one" });
    let oneCreations = 0;
    let twoCreations = 0;

    nav.register({
      scheme: "probe",
      views: {
        one: () => {
          oneCreations++;
          const el = document.createElement("div");
          el.dataset.view = "one";
          return el;
        },
        two: () => {
          twoCreations++;
          const el = document.createElement("div");
          el.dataset.view = "two";
          return el;
        },
      },
      rules: [
        { path: "/one", docks: { center: "one" } },
        { path: "/two", docks: { center: "two" } },
      ],
    });

    const center = dock(nav, "center");
    const initialOne = center.firstElementChild;
    expect(oneCreations).toBe(1);
    expect(twoCreations).toBe(0);

    nav.go("probe:/two");
    const initialTwo = center.firstElementChild;
    expect(oneCreations).toBe(1);
    expect(twoCreations).toBe(1);
    expect(initialTwo).not.toBe(initialOne);

    nav.go("probe:/one");
    expect(center.firstElementChild).toBe(initialOne);
    expect(oneCreations).toBe(1);
    expect(twoCreations).toBe(1);
  });

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
});

function settingsGraph(ids: string[] = ["base"]): NodeSpec {
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
