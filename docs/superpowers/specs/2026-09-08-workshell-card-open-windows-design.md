# Workshell Card-Open Windows Design

Date: 2026-09-08
Status: Approved in conversation (José: interactive shell-demo first; Angular spa later; no Stitch compliance)
Project: workshell (test prototype)

Depends on: compositor contract in `2026-09-07-workshell-window-manager-design.md`, desktop chrome in `2026-09-07-workshell-desktop-shell-design.md`, package door in `2026-09-07-workshell-package-carve-design.md`.

This spec does **not** change window modes, persist key, layout `version: 2`, the 180 Hz pointer path, or `createDesktop` / `boot()` shape. It adds `WorkspaceEngine.open()` so the board can launch windows, and wires that in `shell-demo`.

## Goal

Click a kanban card → a compositor window. Several windows can be open at once. Clicking an already-open card focuses it. Hide restores; close then click reopens.

Success: the seed desktop still shows TASK-104, and every other card on the board can open its own window through the same `mount()` path. `open()` is the API an Angular spa will call later.

Visual language stays the current OS-style chrome (traffic lights, float, cascade). Do not restyle toward the Stitch archive.

## Non-goals

- Angular `apps/spa`
- Kanban drag-and-drop
- Overlay / dock chrome in the titlebar
- Reopen-closed UI in the taskbar (the card is the reopen)
- A second theme
- Changing persist key `workshell.layout.v1` or `version: 2`
- Pointer-path work (`getBoundingClientRect` / persist / class toggles on `pointermove` stay forbidden)

## Architecture

`WorkspaceEngine` remains the only owner of window layout. `open()` is a **commit-clock** method (same class as `float` / `close` / `hide`). It may create a node, reparent, persist, and update the taskbar. It must not run on `pointermove`.

```
kanban card click (demo)
  → engine.open(id, { title })
      → create or restore PanelState
      → createPanel(id) if the node is missing
      → focus | show | float
      → persist
```

Desktop-shell `boot()` already builds chrome and calls `fillPanelBody`. `open()` reuses that factory. Do not add a second panel constructor.

`fillWidgetLayer` stays `(host: HTMLElement) => void`. The demo closes over `host.engine` after `boot()` has assigned it (fill runs after `engine.boot()`, so `host.engine` is legal inside the fill).

## `open(id, opts?)`

```ts
type OpenOptions = { title?: string };

class WorkspaceEngine {
  open(id: string, opts?: OpenOptions): void;
}
```

Export `OpenOptions` from `@workshell/compositor` and re-export from `@workshell/desktop-shell`.

`boot(createPanel)` **stores** `createPanel`. `open()` before `boot()` throws `/boot/`.

Empty `id` returns without changing state.

| Current state | Result |
|---|---|
| Unknown id | Create `PanelState` (title = `opts.title ?? id`), cascade rect, materialize node, `float(id)` |
| In `closed[]` | Remove from `closed[]`, materialize a **new** node, `float(id)` using the stored rect (no cascade) |
| `hidden` | `show(id)` |
| Live (`float` / `maximized` / `dock` / `overlay`) | `focus(id)` |

Materialize: `createPanel(id)` → `nodes.set` → copy `dataset.uid` onto state → `bindPanel` → `applyMode`. Same path as `boot()` for a live id.

Close still destroys the node. Reopen is a new node and a new uid. Uid stays stable only while the window lives.

`createPanel` in `desktop-shell` already reads `engine.state.panels[id].title` before building chrome, so `open()` must write `PanelState` **before** calling the factory.

### Cascade

New windows only (not reopen, not focus).

```
CASCADE_PX = 28
n = count of panels that are not in closed[]  // before inserting the new record
x = DEFAULT_FLOAT.x + n * CASCADE_PX
y = DEFAULT_FLOAT.y + n * CASCADE_PX
w, h = DEFAULT_FLOAT
```

Count **before** writing the new `PanelState`. The seed window is live, so the first extra card is `n = 1` and stacks 28px off TASK-104. Do not use layout reads on the pointer path; `window.innerWidth` is allowed here (commit clock) but not required this pass.

## Persist

`sanitizeLayout` today allowlists **seed panel ids only**, so a dynamically opened window dies on reload.

Change: the known set is **seed panel ids ∪ well-formed stored panel ids**.

A stored panel is well-formed when `id` is a non-empty string and the value is a non-null object. Then run existing `sanitizePanel`.

`closed` keeps an id only if it is in that known set.

Malformed extras still drop. Seed panels that were never stored stay absent (current round-trip: closed `alpha` with the record deleted does not resurrect `panels.alpha`).

Persist key and version stay the same.

## Demo

Single catalog: `apps/shell-demo/src/tasks.ts`. Kanban and window bodies both read it. Seed still only opens `task-104`.

Each task: `{ id, lane, tag, title, body?: string }`. Ids are `task-104` style (lowercase, hyphen). Chrome title is the uppercase TASK-nnn (existing `PANEL_META` / seed title for task-104).

Kanban: render from the catalog (no HTML-string lanes). Each card:

- `data-task-id`
- clickable (`button` type=button wrapping the card, or `article` with a click handler)
- `cursor: pointer` + hover lift in `demo.css`

`mountKanban(host, opts?: { open?: (id: string, title: string) => void })`. Existing one-arg call still mounts four lanes. If `open` is passed, card click calls `open(id, title)`.

`main.ts`:

```ts
fillWidgetLayer(el) {
  mountKanban(el, {
    open(id, title) {
      host.engine.open(id, { title });
    },
  });
}
fillPanelBody(id, el) {
  fillWindow(id, el);
}
```

`fillWindow`: `task-104` keeps the current inspector. Every other id gets a small document body (id, title, lane, tag, optional copy). Unknown id stays empty (current host test).

Cards are not panels. The widget layer still has no `.panel`.

## Acceptance

1. Load demo: wallpaper, four lanes, one TASK-104 window, taskbar pill.
2. Click TASK-112 (or any other card): a second window opens, offset from TASK-104; a second pill appears; the board stays visible.
3. Click the same card again: that window focuses (z rises). No duplicate node.
4. Hide the window: pill remains; click the card (or pill) restores.
5. Close the window: pill gone; click the card again: window returns.
6. Reload: dynamically opened windows that were left open are still there (persist). Clear `localStorage` to return to seed (TASK-104 only).

## Testing

- Persist: extra well-formed id survives `loadLayout`; garbage ids still drop; closed-without-record still drops.
- Engine: `open` before boot throws; new id materializes + cascade; second `open` focuses and does not duplicate; `open` after `close` recreates; `open` on hidden shows; taskbar pill count matches live windows.
- Kanban: four lanes; cards have `data-task-id`; click with `open` spy; no `.panel` in the widget layer.
- `fillWindow` for `task-104` still mounts `.inspector`; another id mounts the document body.

## Later (not this spec)

Angular spa on the same `open()` / `boot()` door. Overlay, dock, kanban DnD.
