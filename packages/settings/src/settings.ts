import { Navigator } from "@workshell/navigator";
import type { AppRegistration, WorkshellSession } from "@workshell/session";
import { appearanceView } from "./appearance";

export function createSettings(session: WorkshellSession): AppRegistration {
  return {
    id: "settings",
    title: "Settings",
    mount(el) {
      const nav = new Navigator(el, { initialUrl: "settings:/appearance" });
      nav.register({
        scheme: "settings",
        views: { appearance: (ctx) => appearanceView(ctx, session) },
        rules: [{ path: "/", docks: { center: "appearance" } }],
      });
    },
  };
}
