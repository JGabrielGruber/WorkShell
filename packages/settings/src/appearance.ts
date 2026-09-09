import { listView, page } from "@workshell/kit";
import type { ViewContext } from "@workshell/navigator";
import type { WorkshellSession } from "@workshell/session";

export function appearanceView(_ctx: ViewContext, session: WorkshellSession): HTMLElement {
  const body = document.createElement("div");
  const render = () => {
    const list = listView({
      items: session.theme.list().map((t) => ({ id: t.id, label: t.title })),
      selectedId: session.getTheme() ?? null,
      onSelect: (id) => {
        session.setTheme(id);
        render();
      },
    });
    body.replaceChildren(list);
  };
  render();
  return page({ title: "Appearance", body });
}
