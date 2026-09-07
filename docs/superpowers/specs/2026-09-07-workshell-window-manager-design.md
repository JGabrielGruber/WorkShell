# Workshell Window Manager Design

Date: 2026-09-07
Status: Approved in conversation; awaiting José's review of this file
Project: workshell (test prototype)

## Goal

Build a single-page vanilla TypeScript + Vite + Tailwind CSS prototype called Workshell: a minimal desktop-like **window manager** for a dark holographic project workspace.

This is not a full app and not a WebGPU renderer. It is only the window manager, with placeholder panel bodies.

Success is the Grok Chat acceptance demo **and** smooth open/move/resize on a 180 Hz display. The pointer path is a first-class constraint, not a polish pass.

## Non-goals

- React, Angular, or any UI framework
- Backend, network, auth
- Iframes
- Docking libraries (Golden Layout, Dockview, etc.)
- WebGPU / GPU preview as a real renderer
- Reopen-closed UI, workspace rename, multi-workspace
- Minimize (close removes the panel from the layout; seed panels return only by clearing `localStorage`)
- Seeding a "GPU Preview" panel

If a panel titled "GPU Preview" is added later, it is a black canvas plus the text "WebGPU host" and must still survive reparenting through the same `mount()` path.

## Stack

- Vite
- TypeScript
- Tailwind CSS
- All state in memory + `localStorage`
- Small custom engine; no docking library

## Architecture

`WorkspaceEngine` is the only owner of layout. Panels are records in memory. Each panel's DOM node is created once and **never destroyed** when switching dock / float / overlay. Mode changes reparent the same node.

Two clocks:

| Commit (may layout) | Gesture (must not layout) |
|---|---|
| dock, float, overlay, close, tab switch, persist, slot-width commit | `pointermove` drag and resize |

During a gesture the moving window is a compositor layer. Persist and reparent happen on `pointerup`.

### DOM structure

```
#workspace                    /* 100vw × 100vh */
  #topbar                     /* "PROJTHREAD OS // ENGINE CORE" */
  #dock-row
    #dock-left                /* default 320px, resizable */
    #dock-center              /* flex */
    #dock-right               /* default 360px, resizable */
  #taskbar                    /* pills for open panels */
#float-layer                  /* position:fixed; inset:0; pointer-events:none */
  floating .panel             /* pointer-events:auto */
  #snap-preview
  #overlay-host               /* centered overlay panel mounts here */
#overlay-dim                  /* click to dismiss overlay */
```

`#float-layer` does not steal clicks from the dock row except where floating panels, snap preview (during drag), or overlay host sit. `#overlay-dim` is a sibling of `#float-layer` (last child of `#workspace`) so it can dim docks and the taskbar. It has `pointer-events: auto` only while overlay is active.

### Panel node

Each panel is one DOM node:

- `data-id` — stable logical id (`backlog`, `sprint`, `chat`, `spec`, `metrics`)
- `data-uid` — assigned once at create; never changed for that node
- Titlebar: title, Dock, Float, Overlay, Close
- Body: placeholder content
- Bottom-right resize handle (visible only in float mode)

`engine.ts` is the only module allowed to reparent. Reparent is one function, `mount(panelEl, targetHost)`, commented in place. After mount, apply mode chrome (resize handle on/off, tab visibility). The node stays `isConnected === true`.

## State model

```ts
type SlotId = "left" | "center" | "right";
type Mode = "dock" | "float" | "overlay";

type PanelState = {
  id: string;
  uid: string;
  title: string;
  mode: Mode;
  slot?: SlotId; // last dock slot; kept while floating so Dock has a target
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
};

type SlotState = {
  width: number;
  order: string[];
  activeId: string | null;
};

type OverlayState = {
  id: string;
  restore: { mode: Mode; slot?: SlotId };
} | null;

type LayoutState = {
  version: 1;
  slots: {
    left: SlotState;
    center: SlotState;
    right: SlotState;
  };
  panels: Record<string, PanelState>;
  overlay: OverlayState;
  closed: string[];
  nextZ: number;
};
```

Float rect (`x,y,w,h`) is kept even while docked so float/overlay restore has a size. Overlay is not draggable; it uses a centered size (`min(720px, 80vw)` × `min(70vh)`) and still preserves the stored float rect for later float.

### Persistence

- Key: `projthread.layout.v1`
- Module: `src/layout/persist.ts`
- Load: parse JSON; if missing, corrupt, or `version !== 1`, seed defaults (do not crash)
- Save: serialize `LayoutState`; **never** from `pointermove`; debounce on commit (`pointerup`, dock/float/overlay/close/tab/slot-width)
- Unknown panel ids in persist are dropped
- Closed panels stay in `closed` and are not in the DOM
- `uid` is created when the panel node is first constructed in a session. Persist does not need to round-trip `uid` for identity across reloads; reload creates new nodes with new uids. Intra-session reparent **must** keep the same uid and the same node.

### Seed (first load / failed restore)

| id | title | initial mode |
|---|---|---|
| backlog | Backlog / Ideas | dock left |
| sprint | Sprint Board | dock center (active tab) |
| chat | Task Thread | dock center (tab) |
| spec | Spec Viewer | dock right |
| metrics | Benchmark Metrics | float (~420×280) |

Default slot widths: left 320, right 360. Center is flex remainder.

## Engine API

Commit-time methods on `WorkspaceEngine`:

- `dock(id, slot)`
- `float(id, rect?)` — uses stored rect if omitted
- `overlay(id)` — stores previous `{ mode, slot }`, reparents to `#overlay-host`, shows dim
- `close(id)` — reparent out / detach, push id to `closed`, update slot order / taskbar
- `focus(id)` — floating: bump `z` from `nextZ`; docked: activate tab
- `activateTab(slot, id)`
- `setSlotWidth(slot, px)` — left and right only
- `restore()` / `persist()`

**Dock button:** if already docked, no-op. If floating or overlay, dock to the panel's last slot, or **right** if none.

**Float button:** reparent to `#float-layer` at stored rect (or a default if never floated).

**Overlay button:** enter overlay from any mode.

**Close:** panel gone until storage is cleared. Taskbar only lists open panels.

Clicking a taskbar pill focuses the panel (activate tab if docked, z-bump if floating, no-op extra if already overlay).

## Pointer path (180 Hz)

Hard rule: the pointer path cannot read layout (`getBoundingClientRect`, offsetWidth, etc.) and cannot touch `localStorage` or toggle Tailwind classes on the moving panel.

### Drag (floating titlebar)

1. `pointerdown` on titlebar of a floating window (not on buttons): `setPointerCapture`, snapshot `{ x, y, pointerId }`, set `will-change: transform`, `focus` → z bump.
2. `pointermove`: `x = origin.x + dx`, `y = origin.y + dy`, write `transform: translate3d(...)` only. Snap zone from `event.clientX` vs `window.innerWidth` and **stored** left/right slot widths. Edge bands ~40px; center is the middle third of the viewport. Snap preview is a sibling overlay updated via CSS variables, not class churn on the panel.
3. `pointerup` / `pointercancel`: if a snap zone is set → `dock(id, zone)`; else commit `x,y` into state → persist. Clear `will-change`.

### Float-out from dock

Docked titlebar drag: on first move past a threshold (~8px), `float()` once (commit/reparent), then the same transform loop. Threshold avoids accidental undock. Click without drag still uses titlebar buttons / focus.

### Resize (floating only)

Bottom-right handle. Write `--w` / `--h` (min ~240×160). No layout reads. Persist on pointerup.

### Slot width

Left/right dock edges: drag handle, write width into state/CSS variable, persist on pointerup. Not on the 180 Hz window-drag path.

### Overlay

Not draggable. Click `#overlay-dim` restores previous mode (dock to stored slot, or float at stored rect).

### Compositor CSS (required)

- Floating panel: `transform: translate3d(x, y, 0)`; `will-change: transform` only while dragging
- `#float-layer { pointer-events: none }` and `.panel { pointer-events: auto }`
- Avoid `backdrop-filter` and heavy box-shadow on the moving node during drag
- `contain: strict` (or `layout paint`) on `.panel` where it does not break tabs

If drag hitches on a 180 Hz display, the bug is in this path. Fix it before adding features.

## Visual style

- Dark teal/cyan, futuristic IDE — not stock purple SaaS
- `#workspace`: faint grid background
- Panels: rounded, thin cyan glow border; stronger glow on focus
- Top bar: `PROJTHREAD OS // ENGINE CORE`
- Bottom taskbar: open-panel pills (title + docked/float/overlay hint)
- Overlay dim: dark translucent scrim over the workspace

Default overlay size: `min(720px, 80vw)` × `min(70vh)`, centered.

## Placeholder bodies

| Panel | Body |
|---|---|
| Backlog | 2 fake cards |
| Sprint | 2 columns, 1 card each |
| Chat | 3 fake messages |
| Spec | fake markdown title + small code block |
| Metrics | 3 stat tiles: `4.12 ms`, `340 MB`, `144 Hz` |

No real data, no GPU.

## File map

```
index.html
src/main.ts                 // boot chrome, construct engine, seed or restore
src/style.css               // Tailwind entry + compositor rules
src/layout/types.ts
src/layout/persist.ts       // load / save / seed-on-corrupt
src/layout/engine.ts        // WorkspaceEngine: mount, dock, float, overlay, gestures
src/layout/panels.ts        // createPanel(id) → node with uid + placeholder body
src/layout/chrome.ts        // topbar, slots, taskbar, snap preview, overlay dim
README.md                   // npm install, npm run dev
```

`panels.ts` never tears down a node it created. `engine.ts` comments reparenting and snap logic.

## Testing and acceptance

### Automated

Vitest against the state machine (no full browser required for these):

- dock / float / overlay restore previous mode
- persist round-trip of slot order, active tabs, float rects, closed ids
- corrupt localStorage → seed
- close removes from slot order and adds to `closed`

### Browser (acceptance demo)

1. Float Spec Viewer, drag it, resize it
2. Dock it back to the right slot (snap or Dock button)
3. Overlay Chat; click dim restores previous mode
4. Reload keeps positions (`projthread.layout.v1`)
5. Same panel DOM node after float/dock: log `isConnected` and `data-uid` on every reparent (dev helper in engine). `isConnected === true` and uid unchanged

### Motion

Drag on a 180 Hz monitor must not hitch. Manual check. Failure is a pointer-path bug.

## Implementation posture

- Window-manager core (`types`, `persist`, `engine` gestures) stays in the coordinating session
- Scaffold (Vite/Tailwind), seed markup, README may be delegated after the engine API is locked
- Do not parallelize multiple implementers on `engine.ts` — one state machine
- No GPU/render code in this prototype
