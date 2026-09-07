import { createDesktop } from "@workshell/desktop-shell";
import "@workshell/compositor/compositor.css";
import "@workshell/desktop-shell/shell.css";
import "@workshell/theme-aetheris/tokens.css";
import "./demo.css";
import { seedLayout } from "./seed";
import { mountKanban } from "./widgets/kanban";
import { fillTask104 } from "./windows/task-104";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("#app missing");

const host = createDesktop(app);
const engine = host.boot({
  theme: "aetheris",
  seed: seedLayout,
  fillWidgetLayer: mountKanban,
  fillPanelBody(id, el) {
    if (id === "task-104") fillTask104(el);
  },
});

Object.assign(window, { workshell: engine });
