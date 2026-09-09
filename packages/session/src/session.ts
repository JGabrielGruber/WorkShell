import {
  WorkspaceEngine,
  type EngineHosts,
  type LayoutState,
} from "@workshell/compositor";
import { wrapLayoutStorage } from "./layout-storage";
import { readPrefs, writePrefs } from "./prefs";
import { AppRegistry, type AppRegistration } from "./registry";

export type SessionOptions = {
  defaultTheme: string;
  storage?: Storage;
};

export type SessionBoot = {
  hosts: EngineHosts;
  workspace: HTMLElement;
  seed: () => LayoutState;
  createPanel: (id: string, title: string) => HTMLElement;
};

export type WorkshellSession = {
  readonly storage: Storage;
  register(app: AppRegistration): void;
  list(): Array<{ id: string; title: string }>;
  mount(id: string, el: HTMLElement): void;
  setTheme(workspace: HTMLElement, name: string): void;
  getTheme(workspace: HTMLElement): string | undefined;
  boot(opts: SessionBoot): WorkspaceEngine;
};

export function createSession(opts: SessionOptions): WorkshellSession {
  if (!opts.defaultTheme) throw new Error("defaultTheme required");
  const storage = opts.storage ?? localStorage;
  const defaultTheme = opts.defaultTheme;
  const registry = new AppRegistry();
  let booted = false;

  const session: WorkshellSession = {
    storage,
    register(app) {
      registry.register(app);
    },
    list() {
      return registry.list();
    },
    mount(id, el) {
      registry.mount(id, el);
    },
    setTheme(workspace, name) {
      workspace.dataset.theme = name;
      writePrefs(storage, name);
    },
    getTheme(workspace) {
      return workspace.dataset.theme;
    },
    boot({ hosts, workspace, seed, createPanel }) {
      if (booted) throw new Error("already booted");
      const wrapped = wrapLayoutStorage(storage, () => registry.ids());
      const prefs = readPrefs(storage);
      workspace.dataset.theme = prefs?.theme ?? defaultTheme;
      const engine = new WorkspaceEngine(hosts, wrapped, seed);
      engine.boot((id) => {
        const title = engine.state.panels[id]?.title ?? registry.title(id) ?? id;
        const el = createPanel(id, title);
        const body = el.querySelector(".panel-body");
        if (!(body instanceof HTMLElement)) throw new Error("panel-body missing");
        session.mount(id, body);
        return el;
      });
      booted = true;
      return engine;
    },
  };

  return session;
}
