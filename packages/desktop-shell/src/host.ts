import { WorkspaceEngine, type LayoutState } from "@workshell/compositor";
import { buildWorkspace } from "./chrome";
import { createPanelChrome } from "./panel-chrome";

export type FillWidgetLayer = (host: HTMLElement) => void;
export type FillPanelBody = (id: string, host: HTMLElement) => void;

export type BootOptions = {
  theme: string;
  seed: () => LayoutState;
  fillWidgetLayer: FillWidgetLayer;
  fillPanelBody: FillPanelBody;
  storage?: Storage;
};

export type WorkshellHost = {
  readonly workspace: HTMLElement;
  readonly engine: WorkspaceEngine;
  boot(opts: BootOptions): WorkspaceEngine;
  setTheme(name: string): void;
};

export function createDesktop(root: HTMLElement): WorkshellHost {
  if (!(root instanceof HTMLElement)) throw new Error("#app missing");
  const hosts = buildWorkspace(root);
  let engine: WorkspaceEngine | undefined;
  let booted = false;

  const api: WorkshellHost = {
    workspace: hosts.workspace,
    get engine() {
      if (!engine) throw new Error("boot() required");
      return engine;
    },
    boot(opts: BootOptions) {
      if (booted) throw new Error("boot() already called");
      if (!opts.theme || !opts.seed || !opts.fillWidgetLayer || !opts.fillPanelBody) {
        throw new Error("boot() missing required options");
      }
      booted = true;
      engine = new WorkspaceEngine(hosts, opts.storage ?? localStorage, opts.seed);
      engine.boot((id) => {
        const title = engine!.state.panels[id]?.title ?? id;
        const el = createPanelChrome(id, title);
        const body = el.querySelector(".panel-body");
        if (!(body instanceof HTMLElement)) throw new Error("panel-body missing");
        opts.fillPanelBody(id, body);
        return el;
      });
      opts.fillWidgetLayer(hosts.widgetLayer);
      api.setTheme(opts.theme);
      return engine;
    },
    setTheme(name: string) {
      hosts.workspace.dataset.theme = name;
    },
  };
  return api;
}
