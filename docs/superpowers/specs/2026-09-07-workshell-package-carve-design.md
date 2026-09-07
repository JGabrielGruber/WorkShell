# Workshell Package Carve Design

Date: 2026-09-07
Status: Draft for José's review
Project: workshell (test prototype)

Depends on (behavior, not layout): `2026-09-07-workshell-window-manager-design.md` compositor contract and `2026-09-07-workshell-desktop-shell-design.md` live chrome.

This spec does **not** change window modes, persist key, seed identity (TASK-104), or the 180 Hz pointer path. It carves the current blob into packages so desktop-shell can stay apart from content, themes can multiply later, and an Angular SPA can fill the same hosts.

## Goal

Split Workshell into an npm-workspaces monorepo:

```
workshell/
  packages/compositor          @workshell/compositor
  packages/desktop-shell       @workshell/desktop-shell
  packages/themes/aetheris     @workshell/theme-aetheris
  apps/shell-demo              @workshell/shell-demo
```

Success: `npm run dev` at repo root still boots today’s acceptance desktop (wallpaper, four kanban lanes, one TASK-104 inspector, taskbar, drag / maximize / hide / close). The demo is the only package that knows kanban or TASK-104. Angular is not created. A second theme is not created.

## Non-goals (this spec)

- `apps/spa` / Angular
- A second theme, a switcher UI, or dynamic CSS import of theme packages
- Iframes, custom elements, or a DOM event bus as the host door
- Nx, Turborepo, pnpm, publishing packages to npm
- Dock, snap-to-slot, overlay chrome, kanban DnD, reopen-closed
- Changing persist key `workshell.layout.v1` or layout `version: 2`
- Idle `requestAnimationFrame`, `pointerrawupdate`, or a game loop
- Moving `engine.ts` ownership off the coordinating session

Later specs: Angular on the same `boot()` door; more packages under `packages/themes/*`.

## Stack

- npm workspaces (`package-lock.json` stays)
- Private packages, TypeScript **source** exports (`workspace:*`). Vite in the demo resolves TS. No `dist` build step required for workspace packages in this spec.
- Vite + TypeScript + Vitest + happy-dom, as today
- Tailwind stays on **shell-demo** Vite only. Compositor and desktop-shell are vanilla CSS.
- `engine.ts` remains owned by the coordinating session. Do not parallelize implementers on it.

Root scripts:

| Script | Runs |
|---|---|
| `npm run dev` | `npm run dev -w @workshell/shell-demo` |
| `npm test` | workspace tests (re-homed current suite + host/boot tests) |
| `npm run build` | `npm run build -w @workshell/shell-demo` |

Workspaces glob: `["packages/*", "packages/themes/*", "apps/*"]`.

## Architecture

Four packages. Runtime depends inward only: demo → desktop-shell → compositor. Theme CSS is imported by the **app**, not by compositor. Desktop-shell **re-exports** compositor public types (`LayoutState`, `WorkspaceEngine`, …) so the demo does not import `@workshell/compositor` (compositor tests still do).

```
apps/shell-demo
  imports @workshell/desktop-shell
  imports @workshell/theme-aetheris (CSS)
  owns seed content (kanban, TASK-104 body, seedLayout)

packages/desktop-shell
  imports @workshell/compositor
  owns layer tree, panel chrome, WorkshellHost

packages/compositor
  owns WorkspaceEngine, types, persist, mount(), two clocks, mechanical CSS

packages/themes/aetheris
  CSS tokens + wallpaper paint + glass + type
  no TypeScript behavior
```

`apps/spa` is not created. When it exists, it is another app that calls the same `createDesktop` / `boot()` API.

### Package responsibilities

**`@workshell/compositor`**

- `WorkspaceEngine`, `mount()`, persist, layout types
- Two clocks: commit vs gesture. Gesture writes inline `translate3d` and `--w`/`--h` only
- Mechanical CSS: overflow lock, rest float `transform: translate3d(var(--x), var(--y), 0)`, `.panel.is-dragging` / `will-change`
- `EngineHosts` type (the engine’s host contract; previously declared in `chrome.ts`)
- Does **not**: wallpaper, taskbar look, widgets, fonts, blur, Tailwind, known panel ids

**`@workshell/desktop-shell`**

- Layer tree: wallpaper **host**, `#widget-layer`, `#float-layer`, taskbar, overlay hosts
- Panel chrome: titlebar, traffic lights, empty `.panel-body`, resize handle
- `WorkshellHost` (`createDesktop`, `boot`, `setTheme`)
- Structural CSS for layers, titlebar, taskbar geometry (not glass)
- Does **not**: kanban markup, inspector HTML, `seedLayout`, engine internals, wallpaper URL

**`@workshell/theme-aetheris`**

- Tokens (`:root` / `[data-theme="aetheris"]`), glass, type, wallpaper paint
- `#wallpaper` is an empty host in the shell; Aetheris paints it (URL leaves `chrome.ts`)
- No TypeScript

**`@workshell/shell-demo`**

- Today’s `index.html` + Vite + the running product
- `seedLayout` / known ids / `PANEL_META` equivalent
- `fillWidgetLayer` → kanban
- `fillPanelBody` → TASK-104 inspector (and GPU-preview placeholder if such a panel is ever seeded)
- Kanban + inspector CSS that uses theme tokens, not hardcoded glass copies
- `window.workshell = engine` for the acceptance console (demo only, not package API)

## Host API

The only chrome import an app needs is `createDesktop` (plus re-exported types). Apps do not construct `WorkspaceEngine` against raw layers. `host.engine` is valid only after `boot`; reading it before `boot` throws.

```ts
export type FillWidgetLayer = (host: HTMLElement) => void;
export type FillPanelBody = (id: string, host: HTMLElement) => void;

export type BootOptions = {
  theme: string;
  seed: () => LayoutState;
  fillWidgetLayer: FillWidgetLayer;
  fillPanelBody: FillPanelBody;
  storage?: Storage; // default localStorage; tests inject
};

export type WorkshellHost = {
  readonly workspace: HTMLElement;
  readonly engine: WorkspaceEngine; // after boot
  boot(opts: BootOptions): WorkspaceEngine;
  setTheme(name: string): void;
};

export function createDesktop(root: HTMLElement): WorkshellHost;
```

Demo `main.ts` shape:

```ts
const host = createDesktop(app);
const engine = host.boot({
  theme: "aetheris",
  seed: seedLayout,
  fillWidgetLayer: mountKanban,
  fillPanelBody(id, el) {
    if (id === "task-104") fillTask104(el);
  },
});
Object.assign(window, { workshell: engine });
```

### Rules

- `createDesktop(root)` builds the layer tree. Empty widget layer. No panels. Throws if `root` is missing.
- `boot(opts)` runs once. Missing `fillWidgetLayer` / `fillPanelBody` / `seed` / `theme` throws. Second `boot` throws.
- `boot` constructs `WorkspaceEngine`, restores persist (or `opts.seed()`), stamps chrome for each live panel, calls `fillPanelBody(id, bodyEl)` per created panel, then `fillWidgetLayer(widgetLayer)`, then `setTheme(opts.theme)`.
- `fillPanelBody` runs **only when a panel node is created**, not on reparent. Same node, same body, for the life of the window.
- Unknown panel id → empty `.panel-body`, no throw.
- If a fill callback throws, do not swallow. Chrome may already exist.
- `setTheme(name)` writes `data-theme` on `#workspace`. It does **not** load CSS. The app imports theme CSS. Spec 1 has no switcher UI; the method is the door.
- Engine `boot(createPanel)` stays. Desktop-shell is the `createPanel` closure. Apps never pass a factory into the engine.
- Title comes from `PanelState.title`. Shell does not import `PANEL_META`.

## Persist

- Key stays `workshell.layout.v1`. Version stays `2`.
- `loadLayout(storage, seed: () => LayoutState)`.
- Allowlist is `Object.keys(seed().panels)`. Unknown ids dropped as today. TASK-104 stays known because the **demo seed** lists it, not because compositor has `KNOWN_IDS`.
- `KNOWN_IDS`, `PANEL_META`, and `seedLayout` leave compositor and live in `apps/shell-demo/src/seed.ts`.
- Missing key / corrupt JSON / version ≠ 2 → `seed()` (today’s behavior).

## Move map

Today’s repo-root `src/` goes away as product code.

| Today | Tomorrow |
|---|---|
| `src/layout/engine.ts` + test | `packages/compositor/src/engine.ts` |
| `src/layout/persist.ts` + test | `packages/compositor/src/persist.ts` |
| `src/layout/types.ts` + test | `packages/compositor/src/types.ts` (no seed / known ids) |
| `EngineHosts` in `chrome.ts` | compositor |
| `src/layout/chrome.ts` + test | `packages/desktop-shell/src/chrome.ts` (no kanban, no wallpaper URL) |
| `createPanel` chrome | `packages/desktop-shell/src/panel-chrome.ts` |
| boot glue | `packages/desktop-shell/src/host.ts` |
| `src/desktop/kanban.ts` + test | `apps/shell-demo/src/widgets/kanban.ts` |
| `bodyFor("task-104")` | `apps/shell-demo/src/windows/task-104.ts` |
| `seedLayout` / `KNOWN_IDS` / `PANEL_META` | `apps/shell-demo/src/seed.ts` |
| `src/main.ts` | `apps/shell-demo/src/main.ts` |
| `index.html`, `vite.config.ts`, `src/vite-env.d.ts` | `apps/shell-demo/` |

`src/style.css` is deleted after split:

| Destination | Contents |
|---|---|
| compositor CSS | overflow lock, rest `translate3d(var(--x), var(--y))`, `.is-dragging` / `will-change`, geometry the engine writes |
| desktop-shell CSS | layer tree, taskbar slot, titlebar/lights/handle structure |
| `@workshell/theme-aetheris` | tokens, wallpaper, glass, type |
| shell-demo CSS | `#kanban`, `.inspector` — seed widget layout, using theme tokens |

`docs/` and `archive/` stay at repo root.

Unused dock slot helpers in `chrome.ts` stay in desktop-shell, unused this pass (same as desktop-shell spec).

## Runtime writes

| Clock | Who | May write |
|---|---|---|
| Gesture (`pointermove`) | compositor only | inline `translate3d`, `--w` / `--h` |
| Commit (`pointerup`, boot, maximize / hide / close / focus) | compositor | CSS vars, persist, `mount()`, mode attrs |
| Boot fills | app callbacks | children of `#widget-layer` and `.panel-body` only |
| Theme | app CSS import + `setTheme` | `data-theme` on `#workspace` |

Content (demo now, Angular later) never writes `transform`, layout, or persist on `pointermove`.

## Tests

Re-home the current suite. Do not drop coverage. Add host/boot tests.

| Package | Proves |
|---|---|
| compositor | engine gestures, `mount()`, persist with a **fixture seed** (not TASK-104). Unknown ids dropped against `Object.keys(seed().panels)`. |
| desktop-shell | `buildWorkspace` layers; panel chrome has empty body; `boot` calls fills once per live panel; `boot` twice throws; `setTheme` writes `data-theme`. |
| shell-demo | kanban is not a panel; TASK-104 fill paints the inspector; `seedLayout` still one floating TASK-104. |

Persist tests must not import the demo. `types.test` seed cases move to demo. `panels.test` splits: chrome vs inspector.

Acceptance (unchanged): wallpaper, four lanes, taskbar, one TASK-104, drag / max / hide / close, `isConnected` + stable `uid`.

## Errors

- Missing `#app` / `createDesktop` root → throw (today).
- `boot` twice, or missing required `BootOptions` fields → throw.
- Persist missing / corrupt / not version 2 → `seed()`.
- `fillPanelBody` for unknown id → empty body, no throw.
- Fill callbacks that throw → surface.
- `setTheme` always writes `data-theme`; missing CSS is the app’s problem.
- Gesture path still must not persist, reparent, or churn classes.

## Relationship to earlier specs

Keep `WorkspaceEngine` as the only owner of window layout. One `mount()`, two clocks, reparent-only nodes. Hide = minimize. Close = remove. Maximize = usable desktop above the taskbar. `pointerup` does not snap-dock. Overlay/dock APIs stay unused in the seed.

The desktop-shell spec’s kanban-as-widget and TASK-104 inspector still hold; they move from `src/desktop` / `panels.ts` into **shell-demo**, not into `desktop-shell`.

## Implementation notes

- Parent session owns `packages/compositor/src/engine.ts` (today `src/layout/engine.ts`).
- Shallower quality reviews (spec still, parent-only quality), same as the desktop-shell pass.
- Do not restart José’s Vite unless asked.
- Confirm before starting Angular, extra themes, slots, tiling, kanban DnD, overlay chrome, or snap-dock.
