import type { WorkspaceEngine } from "@workshell/compositor";
import type { WorkshellSession } from "@workshell/session";

export function mountMenu(
  host: HTMLElement,
  session: WorkshellSession,
  engine: WorkspaceEngine,
): void {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "menu-button";
  button.setAttribute("aria-label", "Menu");
  button.setAttribute("aria-expanded", "false");
  button.textContent = "Menu";

  const list = document.createElement("div");
  list.className = "menu-list";
  list.hidden = true;

  const close = () => {
    button.setAttribute("aria-expanded", "false");
    list.hidden = true;
  };

  const open = () => {
    list.replaceChildren(
      ...session.list().map(({ id, title }) => {
        const row = document.createElement("button");
        row.type = "button";
        row.className = "menu-row";
        row.textContent = title;
        row.addEventListener("click", () => {
          engine.open(id, { title });
          close();
        });
        return row;
      }),
    );
    button.setAttribute("aria-expanded", "true");
    list.hidden = false;
  };

  button.addEventListener("click", () => {
    if (button.getAttribute("aria-expanded") === "true") close();
    else open();
  });

  host.replaceChildren(button, list);
}
