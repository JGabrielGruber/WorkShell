import { createSession, emptyLayout } from "@workshell/session";
import { createDesktop } from "@workshell/desktop";
import "@workshell/compositor/compositor.css";
import "@workshell/desktop/shell.css";
import "@workshell/theme-aetheris-glass/tokens.css";
import "@workshell/theme-aetheris-prism/tokens.css";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("#app missing");

const session = createSession({ defaultTheme: "aetheris-glass" });
const { engine, workspace } = createDesktop(app, session, { seed: emptyLayout });
Object.assign(window, { workshell: engine, session, workspace });
