import { button, dialogFrame, field, listView, page, tabs } from "@workshell/kit";

export function fieldsPage(): HTMLElement {
  const body = document.createElement("div");
  body.append(
    field({ name: "demo-text", label: "Name", value: "Probe" }),
    field({ name: "demo-check", label: "Enabled", kind: "checkbox", value: true }),
    field({ name: "demo-dead", label: "Read-only", value: "locked", disabled: true }),
    button({ label: "Primary", kind: "primary" }),
  );
  return page({ title: "Fields", body });
}

export function tabsPage(): HTMLElement {
  const one = document.createElement("p");
  one.textContent = "Panel one";
  const two = document.createElement("p");
  two.textContent = "Panel two";
  const body = tabs({
    tabs: [
      { id: "one", label: "One", panel: one },
      { id: "two", label: "Two", panel: two },
    ],
    activeId: "one",
  });
  return page({ title: "Tabs", body });
}

export function listPage(): HTMLElement {
  const body = listView({
    items: [
      { id: "r1", label: "Row one" },
      { id: "r2", label: "Row two" },
      { id: "r3", label: "Row three" },
      { id: "r4", label: "Row four" },
    ],
  });
  return page({ title: "List", body });
}

export function dialogPage(): HTMLElement {
  const body = document.createElement("p");
  body.textContent = "A dialog frame, not an overlay.";
  const actions = document.createElement("div");
  actions.append(
    button({ label: "Cancel", kind: "neutral" }),
    button({ label: "Confirm", kind: "primary" }),
  );
  return page({
    title: "Dialog",
    body: dialogFrame({ title: "Example", body, actions }),
  });
}
