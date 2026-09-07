# Workshell Desktop Shell Design

Date: 2026-09-07
Status: Draft for José's review
Project: workshell (test prototype)
Supersedes (for the next implementation pass): seed layout, live chrome, live window modes, and acceptance in `2026-09-07-workshell-window-manager-design.md`.

The compositor contract in that document still applies: one `mount()`, two clocks (commit vs gesture), reparent-only nodes, no layout/persist/class churn on `pointermove`.

## Goal

Turn Workshell from a three-dock IDE chrome into a **desktop OS shell** that can be judged against the Stitch archive (`archive/stitch_projthread_glassmorphism_kanban_desktop/`).

The desktop is wallpaper + a **kanban widget** (not a window) + a bottom taskbar + **compositor windows**. The seed is one floating TASK-104 inspector, small enough that the board stays visible.

Success: the spatial lie matches the archive (kanban on the canvas, window on top, taskbar as OS chrome) **and** maximize / hide / close work without hitching the existing 180 Hz drag path.

## Non-goals (this pass)

- Desktop slots and window-interior drawers (both deferred; `dock()` stays in the engine unused)
- Snap-to-slot and snap preview
- Overlay chrome (API + DOM hosts stay; seed titlebar does not call `overlay()`)
- OS tiling, workspaces 1–4
- Tear-out / dock-into-drawer
- Kanban card drag-and-drop
- SPA structure, routing, live chat, real data
- Reopen-closed UI
- Migrating `version: 1` three-dock layouts
- Measuring 180 Hz (José on the display)

If a GPU preview panel is added later, it still goes through `mount()`.

## Relationship to the window manager

Keep `WorkspaceEngine` as the only owner of window layout. Do not add a second manager.

| Kept | Changed |
|---|---|
| `mount()`, float drag/resize, persist debounce, overlay API, `dock()` | Seed chrome, live modes, known ids, persist version |
| `#float-layer` / `#overlay-host` / `#overlay-dim` / `#snap-preview` | No `#dock-row` in production chrome |
| Pointer path writes `translate3d` / `--w` / `--h` only | `pointerup` does **not** dock |

`engine.ts` remains owned by the coordinating session. Do not parallelize implementers on it.

## Desktop layers

`#workspace` is a desktop, not a three-column IDE.

```
#workspace                 /* 100vw × 100vh */
  #wallpaper
  #widget-layer            /* kanban; not a panel */
  #float-layer             /* position:fixed; inset:0; pointer-events:none */
    .panel                 /* pointer-events:auto */
    #snap-preview          /* unused this pass; keep in DOM */
  #taskbar                 /* 64px tall, 12px above bottom edge */
  #overlay-dim             /* unused this pass; keep for later */
  #overlay-host            /* unused this pass; sibling after dim, not inside float-layer */
```

There is no `#topbar` and no `#dock-row` in the seed.

`#overlay-host` is a workspace sibling **after** `#overlay-dim` (same as the window-manager spec). Nesting it in `#float-layer` would put the overlay panel under the dim.

Z-order:

| Layer | Role |
|---|---|
| wallpaper | Bliss-like substrate + ambient tint |
| `#widget-layer` | Kanban widget |
| `#float-layer` windows | Float / maximized |
| `#taskbar` | Always above maximized windows |
| `#overlay-dim` / `#overlay-host` | Later; keep z 40 / 50 as today so overlay can dim the taskbar |

Maximize never covers the taskbar: the used rect stops above it, and the taskbar paints on top.

`#float-layer` stays `inset: 0` so overlay can cover the desktop later. Maximize geometry is a **window rect**, not a change to the layer inset.

## Kanban widget

Lives in `#widget-layer`. Not a `PanelState`. Not in `panels`. Does not reparent. Cards are static.

Harvest lane structure and copy from the archive (lane titles may stay Portuguese so the mock is recognizable). Do **not** load `code.html` at runtime and do not use the Tailwind v3 CDN.

Four lanes on the wallpaper. Horizontal layout; lanes ~340px as in Aetheris. The widget stays fully visible around the seed window.

## Window states

Live modes this pass: `float` | `maximized` | `hidden`.

Kept on the type and API, unused in the seed: `dock` | `overlay`.

### Float

Current compositor window in `#float-layer`. Stored `x,y,w,h` is the restore rect. Resize handle on. Drag = existing `translate3d` path.

### Maximized

Same node, still in `#float-layer`. Geometry fills the **usable desktop**: viewport minus taskbar occupancy (`--taskbar-h: 64px` + `--taskbar-gap: 12px` from the bottom). Stored `x,y,w,h` is **not** overwritten. Resize handle off. Titlebar Maximize toggles to Unmaximize.

Unmaximize restores the stored float rect and mode `float`.

### Hidden (minimize)

Same node, not visible (`display: none` or equivalent), still `isConnected === true`. Not in `closed`. Taskbar pill restores the mode it hid from (`float` or `maximized`).

Per panel, not a singleton:

```ts
restore?: { mode: Mode; slot?: SlotId }  // set on hide, cleared on show
```

Hide of a maximized window sets `restore.mode = "maximized"`. Hide of a float window sets `restore.mode = "float"`.

### Close

Current close: leave `panels`, append id to `closed`, detach from layout. No taskbar pill. The seed window returns only by clearing persist (or a later reopen UI).

### Titlebar

Aetheris traffic lights, left-aligned, 12px circles:

| Control | Color | Action |
|---|---|---|
| Close | `#FF5F56` | `close()` |
| Hide | `#FFBD2E` | `hide()` |
| Maximize | `#27C93F` | `maximize()` / `unmaximize()` |

No Dock, no Float, no Overlay in chrome. Overlay stays callable on the engine for later.

### Taskbar pills

Every panel whose mode is `float`, `maximized`, or `hidden`. Not `closed`.

- Hidden pill → `show(id)` (restore `restore.mode`)
- Visible pill → `focus(id)`

No launcher, workspace switchers, or telemetry required this pass beyond a simple clock if cheap. Pills are the required chrome.

## State model

Persist key remains `workshell.layout.v1`. **Version field is `2`.**

```ts
type Mode = "dock" | "float" | "overlay" | "maximized" | "hidden";

type PanelState = {
  id: string;
  uid: string;
  title: string;
  mode: Mode;
  slot?: SlotId; // unused this pass; kept for later dock
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  restore?: { mode: Mode; slot?: SlotId }; // while hidden
};

type LayoutState = {
  version: 2;
  slots: {
    left: SlotState;
    center: SlotState;
    right: SlotState;
  };
  panels: Record<string, PanelState>;
  overlay: OverlayState; // seed: null
  closed: string[];
  nextZ: number;
};
```

`SlotState` / `OverlayState` stay as in the window-manager spec. Seed: all slot `order` empty, `activeId` null, `overlay: null`.

Load: parse JSON; if missing, corrupt, or `version !== 2`, seed defaults. Do not migrate v1.

Save: never from `pointermove`. Debounce on commit (`pointerup`, maximize, unmaximize, hide, show, close, focus).

Unknown panel ids in persist are dropped. Known closed ids stay in `closed` even without a panel record. `uid` is session-only (same rule as today).

## Seed

| id | title | initial mode |
|---|---|---|
| task-104 | TASK-104 | float, ~720×520, offset so the kanban stays visible (not 85vw) |

`KNOWN_IDS` this pass is `["task-104"]` only. Old ids (`backlog`, `sprint`, `chat`, `spec`, `metrics`) are unknown and dropped.

Panel body: static three-column inspector harvested from Stitch (chat | markdown spec | attachments). No routing, no live thread. Inner columns are **not** engine windows.

Reload: hidden stays hidden; maximized stays maximized; float rect round-trips; closed stays closed.

## Engine API (additions)

Commit-time methods, in addition to existing `float`, `overlay`, `close`, `focus`, `persist`, `restore`:

- `maximize(id)` — if hidden, no-op (show first). Sets mode `maximized`. Does not write `x,y,w,h`. Applies usable-desktop rect via CSS (top/left/width/height or equivalent), not `transform`.
- `unmaximize(id)` — mode `float`, apply stored `x,y,w,h`.
- `hide(id)` — stores `restore = { mode, slot }`, mode `hidden`, hide node, persist.
- `show(id)` — if not hidden, `focus`. Else restore `restore.mode` (`maximized` → `maximize()`, else `float()`), clear `restore`, persist.

`dock(id, slot)` remains implemented for later. Production chrome has no slot hosts; tests that cover `dock()` may build slot hosts themselves. Seed never calls `dock()`.

`overlay(id)` remains implemented. Seed never calls it.

### Maximized drag

`pointerdown` on a maximized titlebar (not on traffic lights): one **unmaximize** commit. Choose the restored `x` so the titlebar stays under the cursor (classic OS). Then arm the existing float drag loop (`will-change: transform`, `translate3d` on `pointermove`). Persist on `pointerup`.

This is commit then gesture — not layout on `pointermove`.

### pointerup this pass

Commit `x,y` (or `--w`/`--h` on resize) and persist. **Do not** snap-dock. `snapZone` / `#snap-preview` may remain in the file unused.

### Resize

Float only. Hidden and maximized: handle off. Overlay remains non-draggable / non-resizable.

### Compositor CSS (required, unchanged)

- Floating panel: `transform: translate3d(x, y, 0)`; `will-change: transform` only while dragging
- Maximized panel: no drag transform; fill usable rect
- Hidden panel: not visible; node kept
- `#float-layer { pointer-events: none }` and `.panel { pointer-events: auto }`
- Avoid `backdrop-filter` and heavy box-shadow on the moving node during drag (freeze blur or swap to opaque glass fill for the gesture, restore on `pointerup`)
- `contain: strict` (or `layout paint`) on `.panel` where it does not break the inspector columns

## Visual style

Harvest tokens from `archive/stitch_projthread_glassmorphism_kanban_desktop/DESIGN.md`. Do not paste `code.html` into the Vite app.

- Wallpaper: archive landscape (or equivalent) + ambient tint `rgba(5, 10, 20, 0.2)`
- Cyan hologram glass; not purple SaaS. Violet is a tag color at most
- OS chrome in English
- Kanban lane titles may stay as in the archive
- Fonts: Space Grotesk (titles / lane headers), Plus Jakarta Sans (body / chat), JetBrains Mono (ids / telemetry) if added; otherwise a system stack that still reads as the mock
- Taskbar: floating 12px off the bottom, height 64px, glass, pills for windows
- Window shell: ~16–24px radius, cyan border, traffic lights on a 28px drag bar
- Inspector: 28px drag bar + optional 44px breadcrumb bar as static markup (not engine chrome)

## File map

```
index.html
src/main.ts
src/style.css
src/layout/types.ts          // version 2, Mode, restore, KNOWN_IDS
src/layout/persist.ts        // seed on version !== 2
src/layout/engine.ts         // maximize / hide / show; drag-unmaximize; no snap-dock
src/layout/panels.ts         // createPanel("task-104") + inspector body
src/layout/chrome.ts         // wallpaper, widget-layer, float-layer, taskbar
src/desktop/kanban.ts        // static widget markup (or inline in chrome.ts if small)
README.md
archive/stitch_...           // harvest only; not a runtime dependency
```

`panels.ts` never tears down a node it created. `engine.ts` is the only reparenter.

## Testing and acceptance

### Automated (Vitest)

- `version !== 2` / corrupt / missing → seed (`task-104` float, empty slots, overlay null)
- Maximize does not rewrite stored `x,y,w,h`; unmaximize restores that rect
- Hide: `isConnected === true`, not in `closed`, node not visible; `show` restores float vs maximized from `restore`
- Close: in `closed`, no taskbar pill, not in `panels`
- Seed DOM has no `#dock-row`; kanban is not in `panels`; only known id is `task-104`
- `pointermove` still does not persist
- `pointerup` after a float drag does not change mode to `dock`

Existing `dock()` / overlay unit tests may stay if they construct their own slot/overlay hosts. They are not the seed.

### Browser

1. Desktop shows wallpaper + four kanban lanes + taskbar; one TASK-104 window; board still visible around it
2. Drag and resize the window (same node, `isConnected`, uid stable)
3. Maximize fills usable desktop and stops above the taskbar; unmaximize restores rect
4. Drag a maximized titlebar → unmaximize then float
5. Hide → window gone, pill remains; pill restores; hide while maximized restores maximized
6. Close → no pill; reload does not bring it back
7. Reload keeps float/max/hidden; persist key `workshell.layout.v1`, `version: 2`

### Motion

Drag on a 180 Hz monitor must not hitch. Manual check. Failure is a pointer-path bug.

## Implementation posture

- Coordinating session owns `engine.ts` (maximize / hide / show / drag-unmaximize)
- Chrome, kanban widget, inspector body, persist/types, README may be delegated
- One implementer at a time on `engine.ts`
- Visual replica first; no SPA

## Later (not this spec)

Desktop slots (center slot on the **top-center edge**), window-interior three-dock / drawers, tear-out to OS windows, overlay chrome, OS tiling.
