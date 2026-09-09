import { iconView, tree } from "@workshell/kit";
import type { AppRegistration, ViewContext } from "@workshell/navigator";
import { probeIcons, probeTree } from "./graph";
import { dialogPage, fieldsPage, listPage, tabsPage } from "./pages";

function probeTreeView(ctx: ViewContext): HTMLElement {
  return tree({
    nodes: probeTree,
    selectedId: ctx.url.pathname,
    onSelect: (id) => ctx.go(`probe:${id}`),
  });
}

function probeIconView(ctx: ViewContext): HTMLElement {
  return iconView({
    items: probeIcons,
    onSelect: (id) => ctx.go(`probe:${id}`),
  });
}

export const probeApp: AppRegistration = {
  scheme: "probe",
  views: {
    "probe-tree": probeTreeView,
    "probe-icons": probeIconView,
    "probe-fields": () => fieldsPage(),
    "probe-tabs": () => tabsPage(),
    "probe-list": () => listPage(),
    "probe-dialog": () => dialogPage(),
  },
  rules: [
    { path: "/fields", docks: { leading: "probe-tree", center: "probe-icons", trailing: "probe-fields" } },
    { path: "/tabs", docks: { leading: "probe-tree", center: "probe-icons", trailing: "probe-tabs" } },
    { path: "/list", docks: { leading: "probe-tree", center: "probe-icons", trailing: "probe-list" } },
    { path: "/dialog", docks: { leading: "probe-tree", center: "probe-icons", trailing: "probe-dialog" } },
    { path: "/", docks: { leading: "probe-tree", center: "probe-icons" } },
  ],
};
