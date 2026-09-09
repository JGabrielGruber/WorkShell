import { describe, expect, it } from "vitest";
import { createSession, emptyLayout } from "@workshell/session";
import { appearanceView } from "./appearance";

function mem(): Storage {
  const m = new Map<string, string>();
  return {
    get length() {
      return m.size;
    },
    clear: () => m.clear(),
    getItem: (k: string) => m.get(k) ?? null,
    key: (i: number) => [...m.keys()][i] ?? null,
    removeItem: (k: string) => {
      m.delete(k);
    },
    setItem: (k: string, v: string) => {
      m.set(k, v);
    },
  };
}

describe("appearanceView", () => {
  it("lists session.theme.list titles", () => {
    const session = createSession({ storage: mem() });
    const workspace = document.createElement("div");
    session.boot({
      hosts: {
        workspace,
        wallpaper: document.createElement("div"),
        widgetLayer: document.createElement("div"),
        floatLayer: document.createElement("div"),
        overlayHost: document.createElement("div"),
        overlayDim: document.createElement("div"),
        snapPreview: document.createElement("div"),
        taskbar: document.createElement("div"),
      },
      workspace,
      seed: emptyLayout,
      createPanel: (id) => {
        const el = document.createElement("section");
        el.innerHTML = `<div class="panel-body"></div>`;
        el.dataset.id = id;
        return el;
      },
    });
    const fakeCtx = { url: new URL("settings:/appearance"), go: () => {} };
    const el = appearanceView(fakeCtx, session);
    expect(el.className).toContain("ws-page");
    expect(el.textContent).toContain("Appearance");
    expect(el.querySelector('[data-id="base"]')?.textContent).toContain("Base");
  });
});
