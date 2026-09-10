import { listView, page } from "@workshell/kit";
import type { SurfaceElement, ViewContext } from "@workshell/navigator";
import type { WorkshellSession } from "@workshell/session";

export function colorsPage(ctx: ViewContext, session: WorkshellSession): SurfaceElement {
  const parts = ctx.url.pathname.split("/").filter(Boolean);
  const id = parts[2] ?? "";
  const colors = session.theme.inspect(id).colors;
  const body = listView({
    items: colors.map((c) => ({ id: c.token, label: `${c.token} ${c.value}` })),
  });
  return page({ title: "Colors", body });
}
