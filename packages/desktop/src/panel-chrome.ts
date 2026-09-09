function uid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createPanelChrome(id: string, title: string): HTMLElement {
  const el = document.createElement("section");
  el.className = "panel";
  el.dataset.id = id;
  el.dataset.uid = uid();
  el.innerHTML = `
    <div class="panel-titlebar">
      <span class="panel-title"></span>
      <div class="caption-buttons">
        <button type="button" class="caption-btn caption-min" data-action="hide" aria-label="Minimize"></button>
        <button type="button" class="caption-btn caption-max" data-action="maximize" aria-label="Maximize"></button>
        <button type="button" class="caption-btn caption-close" data-action="close" aria-label="Close"></button>
      </div>
    </div>
    <div class="panel-body"></div>
    <div class="resize-handle" data-resize="1"></div>
  `;
  el.querySelector(".panel-title")!.textContent = title;
  return el;
}
