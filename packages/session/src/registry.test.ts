import { describe, expect, it } from "vitest";
import { AppRegistry } from "./registry";

describe("AppRegistry", () => {
  it("lists in registration order", () => {
    const r = new AppRegistry();
    r.register({ id: "a", title: "A", mount: () => {} });
    r.register({ id: "b", title: "B", mount: () => {} });
    expect(r.list()).toEqual([
      { id: "a", title: "A" },
      { id: "b", title: "B" },
    ]);
  });

  it("duplicate id throws", () => {
    const r = new AppRegistry();
    r.register({ id: "a", title: "A", mount: () => {} });
    expect(() => r.register({ id: "a", title: "A2", mount: () => {} })).toThrow(/already registered/);
  });

  it("empty id throws", () => {
    const r = new AppRegistry();
    expect(() => r.register({ id: "", title: "A", mount: () => {} })).toThrow(/id/);
  });

  it("mount unknown is a no-op", () => {
    const r = new AppRegistry();
    const el = document.createElement("div");
    expect(() => r.mount("nope", el)).not.toThrow();
    expect(el.childNodes.length).toBe(0);
  });

  it("mount calls the app", () => {
    const r = new AppRegistry();
    const seen: HTMLElement[] = [];
    r.register({
      id: "a",
      title: "A",
      mount(el) {
        seen.push(el);
      },
    });
    const el = document.createElement("div");
    r.mount("a", el);
    expect(seen).toEqual([el]);
  });

  it("ids() is the allowlist", () => {
    const r = new AppRegistry();
    r.register({ id: "a", title: "A", mount: () => {} });
    expect([...r.ids()]).toEqual(["a"]);
  });
});
