import { describe, expect, it } from "vitest";
import { Navigator } from "./navigator";
import type { AppRegistration } from "./registry";

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
});
