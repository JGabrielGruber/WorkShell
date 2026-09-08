import { describe, expect, it } from "vitest";
import { DEFAULT_FLOAT, DEFAULT_LEFT_W, DEFAULT_RIGHT_W, type LayoutState } from "@workshell/compositor";
import { createDesktop } from "./host";

function seedLayout(): LayoutState {
  const float = DEFAULT_FLOAT;
  return {
    version: 2,
    slots: {
      left: { width: DEFAULT_LEFT_W, order: [], activeId: null },
      center: { width: 0, order: [], activeId: null },
      right: { width: DEFAULT_RIGHT_W, order: [], activeId: null },
    },
    panels: {
      "task-104": {
        id: "task-104",
        uid: "",
        title: "TASK-104",
        mode: "float",
        x: float.x,
        y: float.y,
        w: float.w,
        h: float.h,
        z: 2,
      },
    },
    overlay: null,
    closed: [],
    nextZ: 3,
  };
}

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

describe("createDesktop", () => {
  it("throws if engine is read before boot", () => {
    const root = document.createElement("div");
    const host = createDesktop(root);
    expect(() => host.engine).toThrow(/boot/);
  });

  it("boot twice throws", () => {
    const root = document.createElement("div");
    const host = createDesktop(root);
    const opts = {
      theme: "aetheris-glass",
      seed: seedLayout,
      storage: mem(),
      fillWidgetLayer: () => {},
      fillPanelBody: () => {},
    };
    host.boot(opts);
    expect(() => host.boot(opts)).toThrow(/already/);
  });

  it("missing fills throw", () => {
    const root = document.createElement("div");
    const host = createDesktop(root);
    expect(() =>
      host.boot({
        theme: "aetheris-glass",
        seed: seedLayout,
        storage: mem(),
        fillWidgetLayer: undefined as unknown as (el: HTMLElement) => void,
        fillPanelBody: () => {},
      }),
    ).toThrow();
  });

  it("calls fills once and sets data-theme", () => {
    const root = document.createElement("div");
    const host = createDesktop(root);
    const widgets: HTMLElement[] = [];
    const bodies: Array<{ id: string; el: HTMLElement }> = [];
    const engine = host.boot({
      theme: "aetheris-glass",
      seed: seedLayout,
      storage: mem(),
      fillWidgetLayer(el) {
        widgets.push(el);
      },
      fillPanelBody(id, el) {
        bodies.push({ id, el });
      },
    });
    expect(widgets).toHaveLength(1);
    expect(widgets[0].id).toBe("widget-layer");
    expect(bodies).toEqual([{ id: "task-104", el: expect.any(HTMLElement) }]);
    expect(bodies[0].el.className).toBe("panel-body");
    expect(bodies[0].el.childNodes.length).toBe(0);
    expect(host.workspace.dataset.theme).toBe("aetheris-glass");
    expect(host.engine).toBe(engine);
    expect(engine.node("task-104").querySelector(".inspector")).toBeNull();
    host.setTheme("other");
    expect(host.workspace.dataset.theme).toBe("other");
  });

  it("unknown panel body stays empty", () => {
    const root = document.createElement("div");
    const host = createDesktop(root);
    host.boot({
      theme: "aetheris-glass",
      seed: seedLayout,
      storage: mem(),
      fillWidgetLayer() {},
      fillPanelBody() {},
    });
    const body = host.engine.node("task-104").querySelector(".panel-body");
    expect(body?.childNodes.length).toBe(0);
  });

  it("fill callback throw is not swallowed", () => {
    const root = document.createElement("div");
    const host = createDesktop(root);
    expect(() =>
      host.boot({
        theme: "aetheris-glass",
        seed: seedLayout,
        storage: mem(),
        fillWidgetLayer() {},
        fillPanelBody() {
          throw new Error("fill failed");
        },
      }),
    ).toThrow("fill failed");
  });
});
