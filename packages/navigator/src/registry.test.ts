import { describe, expect, it } from "vitest";
import { canonical, matchRule, normalizeRegistration, parseHref } from "./registry";

const views = {
  tree: () => document.createElement("div"),
  icons: () => document.createElement("div"),
  fields: () => document.createElement("div"),
};

describe("normalizeRegistration", () => {
  it("throws on empty scheme, duplicate is the caller's job, unknown view at register", () => {
    expect(() =>
      normalizeRegistration({ scheme: "", views, rules: [] }),
    ).toThrow(/scheme/);
    expect(() =>
      normalizeRegistration({
        scheme: "probe",
        views,
        rules: [{ path: "/", docks: { leading: "nope" } }],
      }),
    ).toThrow(/unknown view/);
  });

  it("sorts rules longest path first", () => {
    const app = normalizeRegistration({
      scheme: "probe",
      views,
      rules: [
        { path: "/", docks: { leading: "tree" } },
        { path: "/fields", docks: { trailing: "fields" } },
      ],
    });
    expect(app.rules.map((r) => r.path)).toEqual(["/fields", "/"]);
  });
});

describe("matchRule", () => {
  const rules = normalizeRegistration({
    scheme: "probe",
    views,
    rules: [
      { path: "/", docks: { leading: "tree", center: "icons" } },
      { path: "/fields", docks: { leading: "tree", trailing: "fields" } },
    ],
  }).rules;

  it("uses longest path and does not steal prefixes", () => {
    expect(matchRule(rules, "/fields")?.path).toBe("/fields");
    expect(matchRule(rules, "/fieldsx")?.path).toBe("/");
    expect(matchRule(rules, "/")?.path).toBe("/");
  });
});

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
