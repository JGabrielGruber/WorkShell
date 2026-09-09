import {
  WorkspaceEngine,
  type EngineHosts,
  type LayoutState,
} from "@workshell/compositor";
import { createTheme, type Theme } from "@workshell/theme";
import { wrapLayoutStorage } from "./layout-storage";
import { readPrefs, writePrefs } from "./prefs";
import { AppRegistry, type AppRegistration } from "./registry";

export type SessionOptions = {
  defaultTheme?: string;
  storage?: Storage;
  theme?: Theme;
};

export type SessionBoot = {
  hosts: EngineHosts;
  workspace: HTMLElement;
  seed: () => LayoutState;
  createPanel: (id: string, title: string) => HTMLElement;
};

export type WorkshellSession = {
  readonly storage: Storage;
  readonly theme: Theme;
  register(app: AppRegistration): void;
  list(): Array<{ id: string; title: string }>;
  mount(id: string, el: HTMLElement): void;
  setTheme(name: string): void;
  getTheme(): string | undefined;
  boot(opts: SessionBoot): WorkspaceEngine;
};

export function createSession(opts: SessionOptions = {}): WorkshellSession {
  if (opts.defaultTheme === "") throw new Error("defaultTheme required");
  const storage = opts.storage ?? localStorage;
  const defaultTheme = opts.defaultTheme ?? "base";
  const theme = opts.theme ?? createTheme();
  const registry = new AppRegistry();
  let booted = false;
  let workspace: HTMLElement | undefined;

  const ids = () => new Set(theme.list().map((t) => t.id));

  const session: WorkshellSession = {
    storage,
    theme,
    register(app) {
      registry.register(app);
    },
    list() {
      return registry.list();
    },
    mount(id, el) {
      registry.mount(id, el);
    },
    setTheme(name) {
      if (!workspace) throw new Error("boot required");
      theme.apply(workspace, name);
      writePrefs(storage, name);
    },
    getTheme() {
      return workspace?.dataset.theme;
    },
    boot({ hosts, workspace: ws, seed, createPanel }) {
      if (booted) throw new Error("already booted");
      if (!ids().has(defaultTheme)) throw new Error("defaultTheme");
      workspace = ws;
      const wrapped = wrapLayoutStorage(storage, () => registry.ids());
      const prefs = readPrefs(storage);
      const name = prefs?.theme && ids().has(prefs.theme) ? prefs.theme : defaultTheme;
      theme.apply(ws, name);
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
