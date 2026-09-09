import { createDesktop } from "@workshell/desktop-shell";
import "@workshell/compositor/compositor.css";
import "@workshell/desktop-shell/shell.css";
import "@workshell/theme-aetheris-glass/tokens.css";
import "@workshell/theme-aetheris-prism/tokens.css";
import "@workshell/kit/kit.css";
import "@workshell/navigator/navigator.css";
import "./demo.css";
import { seedLayout } from "./seed";
import { mountKanban } from "./widgets/kanban";
import { mountThemeSwitch } from "./widgets/theme-switch";
import { fillWindow } from "./windows/task-window";
import { mountProbe } from "./probe/mount";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("#app missing");

const host = createDesktop(app);
const engine = host.boot({
  theme: "aetheris-glass",
  seed: seedLayout,
  fillWidgetLayer(el) {
    mountKanban(el, {
      open(id, title) {
        host.engine.open(id, { title });
      },
    });
  },
  fillPanelBody(id, el) {
    if (id === "probe") {
      mountProbe(el);
      return;
    }
    fillWindow(id, el);
  },
});

const taskbar = host.workspace.querySelector("#taskbar");
if (!(taskbar instanceof HTMLElement)) throw new Error("#taskbar missing");
mountThemeSwitch(taskbar, (name) => host.setTheme(name));

Object.assign(window, { workshell: engine });
