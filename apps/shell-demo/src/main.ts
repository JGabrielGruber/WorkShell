import { createDesktop } from "@workshell/desktop-shell";
import "@workshell/compositor/compositor.css";
import "@workshell/desktop-shell/shell.css";
import "@workshell/theme-aetheris/tokens.css";
import "./demo.css";
import { seedLayout } from "./seed";
import { mountKanban } from "./widgets/kanban";
import { fillWindow } from "./windows/task-window";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("#app missing");

const host = createDesktop(app);
const engine = host.boot({
  theme: "aetheris",
  seed: seedLayout,
  fillWidgetLayer(el) {
    mountKanban(el, {
      open(id, title) {
        host.engine.open(id, { title });
      },
    });
  },
  fillPanelBody(id, el) {
    fillWindow(id, el);
  },
});

Object.assign(window, { workshell: engine });
