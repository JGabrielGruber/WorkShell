export type EngineHosts = {
  workspace: HTMLElement;
  left: HTMLElement;
  center: HTMLElement;
  right: HTMLElement;
  leftTabs: HTMLElement;
  centerTabs: HTMLElement;
  rightTabs: HTMLElement;
  leftBody: HTMLElement;
  centerBody: HTMLElement;
  rightBody: HTMLElement;
  floatLayer: HTMLElement;
  overlayHost: HTMLElement;
  overlayDim: HTMLElement;
  snapPreview: HTMLElement;
  taskbar: HTMLElement;
};

function slot(id: "dock-left" | "dock-center" | "dock-right", side: "left" | "center" | "right"): HTMLElement {
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

  const topbar = document.createElement("header");
  topbar.id = "topbar";
  topbar.textContent = "PROJTHREAD OS // ENGINE CORE";

  const dockRow = document.createElement("div");
  dockRow.id = "dock-row";
  const left = slot("dock-left", "left");
  const center = slot("dock-center", "center");
  const right = slot("dock-right", "right");
  dockRow.append(left, center, right);

  const taskbar = document.createElement("nav");
  taskbar.id = "taskbar";

  const floatLayer = document.createElement("div");
  floatLayer.id = "float-layer";
  floatLayer.style.pointerEvents = "none";

  const snapPreview = document.createElement("div");
  snapPreview.id = "snap-preview";
  snapPreview.setAttribute("aria-hidden", "true");
  floatLayer.append(snapPreview);

  const overlayDim = document.createElement("div");
  overlayDim.id = "overlay-dim";

  const overlayHost = document.createElement("div");
  overlayHost.id = "overlay-host";

  workspace.append(topbar, dockRow, taskbar, floatLayer, overlayDim, overlayHost);
  root.append(workspace);

  return {
    workspace,
    left,
    center,
    right,
    leftTabs: left.querySelector("[data-slot-tabs='left']") as HTMLElement,
    centerTabs: center.querySelector("[data-slot-tabs='center']") as HTMLElement,
    rightTabs: right.querySelector("[data-slot-tabs='right']") as HTMLElement,
    leftBody: left.querySelector("[data-slot-body='left']") as HTMLElement,
    centerBody: center.querySelector("[data-slot-body='center']") as HTMLElement,
    rightBody: right.querySelector("[data-slot-body='right']") as HTMLElement,
    floatLayer,
    overlayHost,
    overlayDim,
    snapPreview,
    taskbar,
  };
}
