export type IconItem = { id: string; label: string; group?: string };

export type IconOpts = {
  items: IconItem[];
  onSelect?: (id: string) => void;
};

export function iconView(opts: IconOpts): HTMLElement {
  const el = document.createElement("div");
  el.className = "ws-icons";
  el.setAttribute("role", "list");
  const groups = new Map<string, IconItem[]>();
  for (const item of opts.items) {
    const g = item.group ?? "";
    const list = groups.get(g) ?? [];
    list.push(item);
    groups.set(g, list);
  }
  for (const [name, items] of groups) {
    if (name) {
      const h = document.createElement("div");
      h.className = "ws-icon-group";
      h.textContent = name;
      el.append(h);
    }
    for (const item of items) {
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "ws-icon";
      tile.setAttribute("role", "listitem");
      tile.dataset.id = item.id;
      tile.textContent = item.label;
      el.append(tile);
    }
  }
  if (opts.onSelect) {
    el.addEventListener("click", (e) => {
      const item = (e.target as HTMLElement | null)?.closest("[data-id]");
      const id = item instanceof HTMLElement ? item.dataset.id : undefined;
      if (id) opts.onSelect?.(id);
    });
  }
  return el;
}
