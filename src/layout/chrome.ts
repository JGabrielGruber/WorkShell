import { mountKanban } from "../desktop/kanban";

export type EngineHosts = {
  workspace: HTMLElement;
  wallpaper: HTMLElement;
  widgetLayer: HTMLElement;
  floatLayer: HTMLElement;
  overlayHost: HTMLElement;
  overlayDim: HTMLElement;
  snapPreview: HTMLElement;
  taskbar: HTMLElement;
  left?: HTMLElement;
  center?: HTMLElement;
  right?: HTMLElement;
  leftTabs?: HTMLElement;
  centerTabs?: HTMLElement;
  rightTabs?: HTMLElement;
  leftBody?: HTMLElement;
  centerBody?: HTMLElement;
  rightBody?: HTMLElement;
};

const WALLPAPER_SRC =
  "https://lh3.googleusercontent.com/aida/AEtjO1Uhx-09OkKAwv1WADA5WF7QRK6dVY5LVKAsYUadzmaJyYaEWaQJ8I5-ytvEUsTnjQiPn7tNESX3AXcEw8FTjGqTYXRs8TdVBi0eDooIvAagyq5YtD6wudNYt77uRZY5bw2ME7aawvIDV3l6LxKPqWhIGSVgkpiSr3WtyUXs50MhXKlDHjSXVvmPk0fAGxHRk__Dt6PmtPpztZyAHQrAYQwZkQIEZesau_fX3bU83ilUPFLsrDq_HGHmGyI";

const WALLPAPER_ALT =
  "Vibrant scenic wallpaper of rolling lush green hills under a bright clear azure blue sky with soft fluffy white cumulus clouds, peaceful Windows Bliss inspired landscape photography, cinematic, ultra-high resolution, serene nature landscape.";

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
  const img = document.createElement("img");
  img.src = WALLPAPER_SRC;
  img.alt = WALLPAPER_ALT;
  const tint = document.createElement("div");
  tint.className = "wallpaper-tint";
  wallpaper.append(img, tint);

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

  mountKanban(widgetLayer);

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
