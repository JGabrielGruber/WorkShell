import { PANEL_META, type KnownId } from "./types";

function uid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function bodyFor(id: string, title: string): string {
  if (title === "GPU Preview") {
    return `<div class="gpu-host"><canvas width="16" height="16"></canvas><span>WebGPU host</span></div>`;
  }
  switch (id) {
    case "backlog":
      return `<div class="cards"><article class="card">Capture holographic snap zones</article><article class="card">Keep panel nodes alive across dock/float</article></div>`;
    case "sprint":
      return `<div class="columns"><div class="column card"><h3>Doing</h3><article class="card">Window manager pointer path</article></div><div class="column card"><h3>Done</h3><article class="card">Seed layout</article></div></div>`;
    case "chat":
      return `<div class="cards"><p class="msg"><strong>sys</strong> overlay restores previous mode</p><p class="msg"><strong>dev</strong> reparent, do not clone</p><p class="msg"><strong>sys</strong> persist on pointerup only</p></div>`;
    case "spec":
      return `<div><h2>Spec Viewer</h2><p>Layout engine contract</p><pre><code>mount(node, host) // same node</code></pre></div>`;
    case "metrics":
      return `<div class="stats"><div class="stat">4.12 ms</div><div class="stat">340 MB</div><div class="stat">144 Hz</div></div>`;
    default:
      return `<div class="card">${title}</div>`;
  }
}

export function createPanel(id: string, title?: string): HTMLElement {
  const resolvedTitle =
    title ?? (id in PANEL_META ? PANEL_META[id as KnownId].title : id);
  const el = document.createElement("section");
  el.className = "panel";
  el.dataset.id = id;
  el.dataset.uid = uid();
  el.innerHTML = `
    <div class="panel-titlebar">
      <span class="panel-title"></span>
      <div class="panel-actions">
        <button type="button" data-action="dock">Dock</button>
        <button type="button" data-action="float">Float</button>
        <button type="button" data-action="overlay">Overlay</button>
        <button type="button" data-action="close">Close</button>
      </div>
    </div>
    <div class="panel-body"></div>
    <div class="resize-handle" data-resize="1"></div>
  `;
  el.querySelector(".panel-title")!.textContent = resolvedTitle;
  el.querySelector(".panel-body")!.innerHTML = bodyFor(id, resolvedTitle);
  return el;
}
