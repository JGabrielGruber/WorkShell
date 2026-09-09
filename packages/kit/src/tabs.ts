export type Tab = { id: string; label: string; panel: HTMLElement };

export type TabsOpts = { tabs: Tab[]; activeId?: string };

export function tabs(opts: TabsOpts): HTMLElement {
  const root = document.createElement("div");
  root.className = "ws-tabs";
  const list = document.createElement("div");
  list.className = "ws-tablist";
  list.setAttribute("role", "tablist");
  const initial = opts.activeId ?? opts.tabs[0]?.id;
  const buttons: HTMLButtonElement[] = [];
  const panels: HTMLElement[] = [];

  function activate(id: string): void {
    for (const tab of opts.tabs) {
      const on = tab.id === id;
      const btn = buttons.find((b) => b.dataset.id === tab.id);
      const panel = panels[opts.tabs.indexOf(tab)];
      if (btn) {
        btn.setAttribute("aria-selected", on ? "true" : "false");
      }
      if (panel) panel.hidden = !on;
    }
  }

  for (const tab of opts.tabs) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ws-tab";
    btn.setAttribute("role", "tab");
    btn.dataset.id = tab.id;
    btn.textContent = tab.label;
    btn.addEventListener("click", () => activate(tab.id));
    buttons.push(btn);
    list.append(btn);
    const panel = document.createElement("div");
    panel.setAttribute("role", "tabpanel");
    panel.append(tab.panel);
    panels.push(panel);
  }
  root.append(list, ...panels);
  if (initial) activate(initial);
  return root;
}
