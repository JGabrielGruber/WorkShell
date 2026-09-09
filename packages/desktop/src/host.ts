import type { LayoutState, WorkspaceEngine } from "@workshell/compositor";
import type { WorkshellSession } from "@workshell/session";
import { buildWorkspace } from "./chrome";
import { mountMenu } from "./menu";
import { createPanelChrome } from "./panel-chrome";

export function createDesktop(
  root: HTMLElement,
  session: WorkshellSession,
  opts: { seed: () => LayoutState },
): { workspace: HTMLElement; engine: WorkspaceEngine } {
  if (!(root instanceof HTMLElement)) throw new Error("#app missing");
  const hosts = buildWorkspace(root);
  const engine = session.boot({
    hosts,
    workspace: hosts.workspace,
    seed: opts.seed,
    createPanel: createPanelChrome,
  });
  mountMenu(hosts.workspace.querySelector("[data-slot=menu]")!, session, engine);
  return { workspace: hosts.workspace, engine };
}
