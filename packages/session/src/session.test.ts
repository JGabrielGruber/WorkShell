import { describe, expect, it } from "vitest";
import { STORAGE_KEY, type EngineHosts } from "@workshell/compositor";
import { emptyLayout } from "./empty";
import { PREFS_KEY } from "./prefs";
import { createSession } from "./session";

function fakeHosts(): EngineHosts {
  const workspace = document.createElement("div");
  workspace.id = "workspace";
  const floatLayer = document.createElement("div");
  const snapPreview = document.createElement("div");
  floatLayer.append(snapPreview);
  return {
    workspace,
    wallpaper: document.createElement("div"),
    widgetLayer: document.createElement("div"),
    floatLayer,
    overlayHost: document.createElement("div"),
    overlayDim: document.createElement("div"),
    snapPreview,
    taskbar: document.createElement("div"),
  };
}

function createPanel(id: string, title: string): HTMLElement {
  const el = document.createElement("section");
  el.dataset.id = id;
  el.dataset.uid = id;
  el.innerHTML = `<div class="panel-title">${title}</div><div class="panel-body"></div>`;
  return el;
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

const leftover = {
  version: 2,
  slots: {
    left: { width: 320, order: ["probe"], activeId: "probe" },
    center: { width: 0, order: [], activeId: null },
    right: { width: 360, order: ["task-104"], activeId: "task-104" },
  },
  panels: {
    probe: { id: "probe", uid: "", title: "Probe", mode: "float", x: 1, y: 1, w: 100, h: 100, z: 1 },
    fake: { id: "fake", uid: "", title: "Fake", mode: "float", x: 2, y: 2, w: 100, h: 100, z: 2 },
  },
  overlay: { id: "probe", restore: { mode: "float" as const } },
  closed: ["task-104", "fake"],
  nextZ: 4,
};

function boot(session: ReturnType<typeof createSession>, hosts = fakeHosts()) {
  return {
    engine: session.boot({
      hosts,
      workspace: hosts.workspace,
      seed: emptyLayout,
      createPanel,
    }),
    hosts,
  };
}

describe("createSession", () => {
  it("throws when defaultTheme is empty", () => {
    expect(() => createSession({ defaultTheme: "" })).toThrow(/defaultTheme/);
  });

  it("exposes theme catalog with base and no registerTheme", () => {
    const session = createSession({ storage: mem() });
    expect(session.theme.list()[0]?.id).toBe("base");
    expect(session).not.toHaveProperty("registerTheme");
    expect(session).not.toHaveProperty("themes");
  });

  it("setTheme before boot throws", () => {
    const session = createSession({ storage: mem() });
    expect(() => session.setTheme("base")).toThrow(/boot/);
  });

  it("setTheme stamps and writes prefs", () => {
    const storage = mem();
    const session = createSession({ storage });
    const { hosts } = boot(session);
    session.setTheme("base");
    expect(hosts.workspace.dataset.theme).toBe("base");
    expect(session.getTheme()).toBe("base");
    expect(JSON.parse(storage.getItem(PREFS_KEY)!)).toEqual({ version: 1, theme: "base" });
  });

  it("setTheme unknown throws; no stamp; no write", () => {
    const storage = mem();
    const session = createSession({ storage });
    const { hosts } = boot(session);
    expect(() => session.setTheme("nope")).toThrow(/theme/);
    expect(hosts.workspace.dataset.theme).toBe("base");
    expect(storage.getItem(PREFS_KEY)).toBeNull();
  });

  it("getTheme is undefined before boot", () => {
    const session = createSession({ storage: mem() });
    expect(session.getTheme()).toBeUndefined();
  });

  it("list is live after register", () => {
    const session = createSession({ storage: mem() });
    expect(session.list()).toEqual([]);
    session.register({ id: "fake", title: "Fake", mount: () => {} });
    expect(session.list()).toEqual([{ id: "fake", title: "Fake" }]);
  });
});

describe("boot", () => {
  it("stamps base when prefs are missing and does not write PREFS_KEY", () => {
    const storage = mem();
    const writes: string[] = [];
    const setItem = storage.setItem.bind(storage);
    storage.setItem = (k, v) => {
      if (k === PREFS_KEY) writes.push(v);
      setItem(k, v);
    };
    const session = createSession({ storage });
    const { hosts } = boot(session);
    expect(hosts.workspace.dataset.theme).toBe("base");
    expect(writes).toEqual([]);
    expect(storage.getItem(PREFS_KEY)).toBeNull();
  });

  it("unknown stored theme falls back to default without write", () => {
    const storage = mem();
    const raw = JSON.stringify({ version: 1, theme: "ghost" });
    storage.setItem(PREFS_KEY, raw);
    const session = createSession({ storage });
    const { hosts } = boot(session);
    expect(hosts.workspace.dataset.theme).toBe("base");
    expect(storage.getItem(PREFS_KEY)).toBe(raw);
  });

  it("stamps stored prefs theme when registered", () => {
    const storage = mem();
    storage.setItem(PREFS_KEY, JSON.stringify({ version: 1, theme: "prism" }));
    const session = createSession({ storage });
    session.theme.register({ id: "prism", title: "Prism", description: "x" });
    const { hosts } = boot(session);
    expect(hosts.workspace.dataset.theme).toBe("prism");
  });

  it("boot throws when defaultTheme is not in the catalog", () => {
    const session = createSession({ defaultTheme: "prism", storage: mem() });
    expect(() => boot(session)).toThrow(/defaultTheme/);
    session.theme.register({ id: "prism", title: "Prism", description: "x" });
    const { hosts } = boot(session);
    expect(hosts.workspace.dataset.theme).toBe("prism");
  });

  it("drops leftover probe when the registry is empty", () => {
    const storage = mem();
    storage.setItem(STORAGE_KEY, JSON.stringify(leftover));
    const session = createSession({ storage });
    const { engine } = boot(session);
    expect(engine.state.panels.probe).toBeUndefined();
    expect(engine.state.panels).toEqual({});
  });

  it("keeps registered leftover fake and drops probe", () => {
    const storage = mem();
    storage.setItem(STORAGE_KEY, JSON.stringify(leftover));
    const session = createSession({ storage });
    session.register({ id: "fake", title: "Fake", mount: () => {} });
    const { engine } = boot(session);
    expect(engine.state.panels.fake).toBeDefined();
    expect(engine.state.panels.probe).toBeUndefined();
  });

  it("throws on a second boot", () => {
    const session = createSession({ storage: mem() });
    boot(session);
    expect(() => boot(session)).toThrow(/already/);
  });

  it("throws when createPanel result has no .panel-body", () => {
    const storage = mem();
    storage.setItem(STORAGE_KEY, JSON.stringify(leftover));
    const session = createSession({ storage });
    session.register({ id: "probe", title: "Probe", mount: () => {} });
    const hosts = fakeHosts();
    expect(() =>
      session.boot({
        hosts,
        workspace: hosts.workspace,
        seed: emptyLayout,
        createPanel: (id) => {
          const el = document.createElement("section");
          el.dataset.id = id;
          el.dataset.uid = id;
          return el;
        },
      }),
    ).toThrow(/panel-body/);
  });
});
