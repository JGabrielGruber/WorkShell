import { createSession, emptyLayout } from "@workshell/session";
import { createDesktop } from "@workshell/desktop";
import { createSettings } from "@workshell/settings";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("#app missing");

const session = createSession();
session.register(createSettings(session));
const { engine, workspace } = createDesktop(app, session, { seed: emptyLayout });
Object.assign(window, { workshell: engine, session, workspace });
