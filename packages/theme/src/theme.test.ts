import { describe, expect, it } from "vitest";
import { baseTheme, createTheme } from "./theme";

describe("createTheme", () => {
  it("auto-registers base first", () => {
    const theme = createTheme();
    expect(theme.list()).toEqual([baseTheme]);
    expect(baseTheme.id).toBe("base");
    expect(baseTheme.title).toBe("Base");
    expect(baseTheme.description.length).toBeGreaterThan(0);
  });

  it("apply stamps a registered id", () => {
    const theme = createTheme();
    const el = document.createElement("div");
    theme.apply(el, "base");
    expect(el.dataset.theme).toBe("base");
  });

  it("apply unknown id throws and does not stamp", () => {
    const theme = createTheme();
    const el = document.createElement("div");
    expect(() => theme.apply(el, "nope")).toThrow(/theme/);
    expect(el.dataset.theme).toBeUndefined();
  });

  it("duplicate register throws", () => {
    const theme = createTheme();
    expect(() => theme.register(baseTheme)).toThrow(/already registered/);
  });

  it("register empty fields throw", () => {
    const theme = createTheme();
    expect(() => theme.register({ id: "", title: "X", description: "X" })).toThrow();
    expect(() => theme.register({ id: "x", title: "", description: "X" })).toThrow();
    expect(() => theme.register({ id: "x", title: "X", description: "" })).toThrow();
  });

  it("register extra skin then apply", () => {
    const theme = createTheme();
    const prism = { id: "prism", title: "Prism", description: "x" };
    theme.register(prism);
    expect(theme.list()).toEqual([baseTheme, prism]);
    const el = document.createElement("div");
    theme.apply(el, "prism");
    expect(el.dataset.theme).toBe("prism");
  });
});
