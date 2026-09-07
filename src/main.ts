import { buildWorkspace } from "./layout/chrome";
import { WorkspaceEngine } from "./layout/engine";
import { createPanel } from "./layout/panels";
import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("#app missing");

const hosts = buildWorkspace(app);
const engine = new WorkspaceEngine(hosts, localStorage);
engine.boot(createPanel);

Object.assign(window, { workshell: engine });
