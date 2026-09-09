import { describe, expect, it } from "vitest";
import { matchRule, normalizeRegistration } from "./registry";

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
