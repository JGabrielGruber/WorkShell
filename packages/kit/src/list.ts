export type ListItem = { id: string; label: string };

export type ListOpts = {
  items: ListItem[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
};

export function listView(opts: ListOpts): HTMLElement {
  const el = document.createElement("ul");
  el.className = "ws-list";
  el.setAttribute("role", "listbox");
  for (const item of opts.items) {
    const li = document.createElement("li");
    li.className = "ws-option";
    li.setAttribute("role", "option");
    li.dataset.id = item.id;
    li.setAttribute("aria-selected", item.id === opts.selectedId ? "true" : "false");
    li.tabIndex = 0;
    li.textContent = item.label;
    el.append(li);
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
