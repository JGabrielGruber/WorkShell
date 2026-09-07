import type { EngineHosts } from "@workshell/compositor";

export function slot(id: "dock-left" | "dock-center" | "dock-right", side: "left" | "center" | "right"): HTMLElement {
  const el = document.createElement("section");
  el.id = id;
  el.className = `slot slot-${side}`;
  el.dataset.slot = side;
  const tabs = document.createElement("div");
  tabs.className = "slot-tabs";
  tabs.dataset.slotTabs = side;
  const body = document.createElement("div");
  body.className = "slot-body";
  body.dataset.slotBody = side;
  el.append(tabs, body);
  if (side === "left" || side === "right") {
    const handle = document.createElement("div");
    handle.className = "slot-resizer";
    handle.dataset.resizeSlot = side;
    el.append(handle);
  }
  return el;
}

export function buildWorkspace(root: HTMLElement): EngineHosts {
  root.replaceChildren();
  const workspace = document.createElement("div");
  workspace.id = "workspace";
  workspace.style.setProperty("--taskbar-h", "64px");
  workspace.style.setProperty("--taskbar-gap", "12px");

  const wallpaper = document.createElement("div");
  wallpaper.id = "wallpaper";
  wallpaper.dataset.purpose = "desktop-wallpaper";
  wallpaper.style.pointerEvents = "none";

  const widgetLayer = document.createElement("div");
  widgetLayer.id = "widget-layer";

  const floatLayer = document.createElement("div");
  floatLayer.id = "float-layer";
  floatLayer.style.pointerEvents = "none";

  const snapPreview = document.createElement("div");
  snapPreview.id = "snap-preview";
  snapPreview.setAttribute("aria-hidden", "true");
  floatLayer.append(snapPreview);

  const taskbar = document.createElement("nav");
  taskbar.id = "taskbar";

  const overlayDim = document.createElement("div");
  overlayDim.id = "overlay-dim";

  const overlayHost = document.createElement("div");
  overlayHost.id = "overlay-host";

  workspace.append(wallpaper, widgetLayer, floatLayer, taskbar, overlayDim, overlayHost);
  root.append(workspace);

  return {
    workspace,
    wallpaper,
    widgetLayer,
    floatLayer,
    overlayHost,
    overlayDim,
    snapPreview,
    taskbar,
  };
}
