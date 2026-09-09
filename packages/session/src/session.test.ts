import { describe, expect, it } from "vitest";
import { STORAGE_KEY, type EngineHosts } from "@workshell/compositor";
import { emptyLayout } from "./empty";
import { PREFS_KEY } from "./prefs";
import { createSession, type SessionOptions } from "./session";

function fakeHosts(): EngineHosts {
  const workspace = document.createElement("div");
  workspace.id = "workspace";
  const taskbar = document.createElement("div");
  const overlayDim = document.createElement("div");
  const overlayHost = document.createElement("div");
  const floatLayer = document.createElement("div");
  const snapPreview = document.createElement("div");
  floatLayer.append(snapPreview);
  return {
    workspace,
    wallpaper: document.createElement("div"),
    widgetLayer: document.createElement("div"),
    floatLayer,
    overlayHost,
    overlayDim,
    snapPreview,
    taskbar,
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

function glassSession(storage: Storage = mem()) {
  return createSession({ defaultTheme: "aetheris-glass", storage });
}

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
  it("throws when defaultTheme is missing", () => {
    expect(() => createSession({} as SessionOptions)).toThrow(/defaultTheme/);
  });

  it("throws when defaultTheme is empty", () => {
    expect(() => createSession({ defaultTheme: "" })).toThrow(/defaultTheme/);
  });

  it("setTheme stamps and writes prefs", () => {
    const storage = mem();
    const session = glassSession(storage);
    const workspace = document.createElement("div");
    session.setTheme(workspace, "aetheris-prism");
    expect(workspace.dataset.theme).toBe("aetheris-prism");
    expect(JSON.parse(storage.getItem(PREFS_KEY)!)).toEqual({
      version: 1,
      theme: "aetheris-prism",
    });
  });

  it("getTheme reads dataset.theme", () => {
    const session = glassSession();
    const workspace = document.createElement("div");
    expect(session.getTheme(workspace)).toBeUndefined();
    workspace.dataset.theme = "aetheris-prism";
    expect(session.getTheme(workspace)).toBe("aetheris-prism");
  });

  it("list is live after register", () => {
    const session = glassSession();
    expect(session.list()).toEqual([]);
    session.register({ id: "fake", title: "Fake", mount: () => {} });
    expect(session.list()).toEqual([{ id: "fake", title: "Fake" }]);
  });
});

describe("boot", () => {
  it("stamps defaultTheme when prefs are missing and does not write PREFS_KEY", () => {
    const storage = mem();
    const writes: string[] = [];
    const setItem = storage.setItem.bind(storage);
    storage.setItem = (k, v) => {
      if (k === PREFS_KEY) writes.push(v);
      setItem(k, v);
    };
    const session = glassSession(storage);
    const { hosts } = boot(session);
    expect(hosts.workspace.dataset.theme).toBe("aetheris-glass");
    expect(writes).toEqual([]);
    expect(storage.getItem(PREFS_KEY)).toBeNull();
  });

  it("stamps stored prefs theme and does not rewrite the key", () => {
    const storage = mem();
    const raw = JSON.stringify({ version: 1, theme: "aetheris-prism" });
    storage.setItem(PREFS_KEY, raw);
    const session = glassSession(storage);
    const { hosts } = boot(session);
    expect(hosts.workspace.dataset.theme).toBe("aetheris-prism");
    expect(storage.getItem(PREFS_KEY)).toBe(raw);
  });

  it("drops leftover probe when the registry is empty", () => {
    const storage = mem();
    storage.setItem(STORAGE_KEY, JSON.stringify(leftover));
    const session = glassSession(storage);
    const { engine } = boot(session);
    expect(engine.state.panels.probe).toBeUndefined();
    expect(engine.state.panels).toEqual({});
  });

  it("keeps registered leftover fake and drops probe", () => {
    const storage = mem();
    storage.setItem(STORAGE_KEY, JSON.stringify(leftover));
    const session = glassSession(storage);
    session.register({ id: "fake", title: "Fake", mount: () => {} });
    const { engine } = boot(session);
    expect(engine.state.panels.fake).toBeDefined();
    expect(engine.state.panels.probe).toBeUndefined();
  });

  it("throws on a second boot", () => {
    const session = glassSession();
    boot(session);
    expect(() => boot(session)).toThrow(/already/);
  });

  it("stamps theme even with an empty seed", () => {
    const storage = mem();
    const session = glassSession(storage);
    const hosts = fakeHosts();
    session.boot({
      hosts,
      workspace: hosts.workspace,
      seed: emptyLayout,
      createPanel,
    });
    expect(hosts.workspace.dataset.theme).toBe("aetheris-glass");
    expect(hosts.workspace.getAttribute("data-theme")).toBe("aetheris-glass");
  });

  it("throws when createPanel result has no .panel-body", () => {
    const storage = mem();
    storage.setItem(STORAGE_KEY, JSON.stringify(leftover));
    const session = glassSession(storage);
    session.register({
      id: "probe",
      title: "Probe",
      mount: () => {},
    });
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
