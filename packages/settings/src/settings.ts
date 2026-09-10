import { Navigator } from "@workshell/navigator";
import type { AppRegistration, WorkshellSession } from "@workshell/session";
import { colorsPage } from "./colors";
import { settingsGraph } from "./graph";

export function createSettings(session: WorkshellSession): AppRegistration {
  return {
    id: "settings",
    title: "Settings",
    mount(el) {
      const nav = new Navigator(el, { initialUrl: "settings:/appearance" });
      nav.register({
        scheme: "settings",
        graph: settingsGraph(session),
        kinds: {
          "theme-colors": { detail: (ctx) => colorsPage(ctx, session) },
        },
      });
    },
  };
}
