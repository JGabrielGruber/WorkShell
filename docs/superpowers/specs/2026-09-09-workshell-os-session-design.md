# Workshell OS Session Design

Date: 2026-09-09
Status: Approved in conversation (José: approach 2; names A; demo deleted; monolith frontend; `#workspace` is the one desktop surface — spatial desktops share the stamp; write the plan)
Project: workshell (test prototype)

Depends on: window manager (`2026-09-07-workshell-window-manager-design.md`), desktop shell (`2026-09-07-workshell-desktop-shell-design.md`), package carve (`2026-09-07-workshell-package-carve-design.md`), theme contract (`2026-09-08-workshell-theme-contract-design.md`), OS vision (`2026-09-08-workshell-os-vision.md`), surface contract (`2026-09-09-workshell-surface-contract-design.md`).

This spec **does** change the boot door, the coordinating session, theme persist, and **where** `EngineHosts.taskbar` points (pills host, not the whole bar). It does **not** change layout key `workshell.layout.v1`, layout `version: 2`, the 180 Hz pointer path, `WorkspaceEngine.open()` semantics, compositor `sanitizeLayout` rules, or the closed theme token list. `renderTaskbar()` still `replaceChildren()` on **its host**; that host is no longer `#taskbar`.

It is the **OS session**: kernel + one desktop DE + an empty entry. It is not Settings. It is not ProjThread. It deletes the demo.

## Goal

Workshell boots as a **frontend OS**, not as a demo that happens to own `createDesktop`.

Success:

1. Load `apps/session`: wallpaper, taskbar, **empty menu**, **no panels**. No kanban, no TASK-104, no Probe, no Glass/Prism taskbar switcher.
2. Reload: still empty, still Glass. Geometry persist still `workshell.layout.v1`. Theme persist is a **new** key (see Prefs). Until a guest calls `session.setTheme`, reload is Glass because no user setting exists.
3. Kernel does not import the desktop package. Desktop is a **choice** the entry loads. A later kiosk/narrow DE is another choice on the same kernel — not this spec.
4. An app `register`s on the session **before** boot; it appears on the desktop **menu**; menu click is `engine.open(id, { title })`. This spec registers **nothing**. Tests register one fake app to prove the door.
5. Leftover demo layout (`probe`, `task-104` in existing `workshell.layout.v1`) does not come back as windows. Registry is the allowlist.

## Non-goals (this spec)

- Settings guest (`settings:` URLs, Appearance, kit/navigator in the entry)
- Widget registry (desktop widgets, bar widgets, kanban as a contribution)
- Glass as an independent compositor effect API (Appearance later switches **skins** via `setTheme`, not this)
- Start columns (pins + search). Menu is an app list, not a start surface
- Narrow / kiosk / mobile DE
- Auth, users, multi-seat, backend, Postgres, HTTP API
- Redirect into or out of another app (named: that app lives elsewhere and may open this session later)
- Per-user prefs (prefs are one seat on this origin)
- Theme catalog API (entry imports both `tokens.css`; names are not a session list until Settings)
- Overlay kit, tear-out, spatial desktops 1–4, slot docking as product chrome
- New theme tokens, daisyUI / Tailwind in kernel, desktop, or the session **entry** (do not copy the demo’s Tailwind Vite plugin into `apps/session`)
- Probe (deleted with the demo)
- Angular `apps/spa`
- Pointer-path work

## Product locks

- This repo is a **monolith frontend**. Backend and multi-user live in another app. That app may redirect **into** `apps/session`; this spec does not implement redirect or login.
- The compositor is not an application. The desktop DE is not the registry. Settings (later) is not the registry. Apps register **into the session**.
- Geometry is not a skin. Glass is still an optional **effect** in the vision; this spec does not add the effect switch. `aetheris-glass` / `aetheris-prism` remain two skins.
- A slot, widget kind, or API appears when something real has nowhere to land. The session exists because guests, prefs, and a menu had nowhere to live except `apps/shell-demo`.
- Interactive **session first** (replaces “shell-demo first”). Kit and navigator stay libraries; they have no guest in this spec.
- `engine.open` remains the only reopen. Menu is the legal caller for registered ids. Reopen-closed UI besides the menu is still later.
- **`#workspace` is this DE’s one surface root** (the node `buildWorkspace` appends to `#app`). Theme stamp is session-scoped and applied to that root. A later **spatial desktop** switcher (1, 2, 3…) is extra views of the same root — same skin, not extra `data-theme` nodes. A **product workspace** is an application object; it inherits. A second surface (kiosk, another monitor) is a later attached root, not this spec. Do not rename `#workspace` here.

## Key decisions

| Decision | Rationale |
|---|---|
| Delete `apps/shell-demo` | Demo was an excuse session. Kanban, TASK-104, Probe, theme-switch, `demo.css` go with it. |
| `@workshell/session` kernel | Boot, prefs, stamp, app registry. Not chrome. |
| Rename `@workshell/desktop-shell` → `@workshell/desktop` | Opinionated **desktop** DE: wallpaper, bar, menu, panel chrome. |
| `apps/session` entry | HTML/Vite. Imports kernel + desktop + both theme CSS. Registers nothing. |
| Registry module **inside** session | Empty list. No `@workshell/registry` package until a second contribution kind (widgets) exists. |
| Menu is a desktop bar slot | Launch path. Not a compositor panel kind. Not seed-only. |
| `#taskbar` splits menu vs pills | Compositor `renderTaskbar()` wipes its host. `EngineHosts.taskbar` is `[data-slot="pills"]`; Menu lives in `[data-slot="menu"]`. |
| Prefs on the **same `Storage` as layout** | `BootOptions.storage` / session `storage`. Do not nail prefs to implicit `window.localStorage` while layout takes a door. |
| `setTheme` stamps **and** writes; `boot` stamps **without** write if key missing | Default Glass is not a user setting. First-boot must not materialize prefs. |
| Kernel does not import `@workshell/desktop` | Desktop is a choice. DEs depend on the session; the session does not depend on a DE. |
| Compositor `sanitizeLayout` **unchanged** | Session wraps `Storage` so `getItem(STORAGE_KEY)` drops panel ids not in the registry. Compositor does not learn “installed apps.” |
| Empty seed is legal | `panels: {}`. Default session needs no guest. |
| No kit/navigator in the entry | Those libraries wait for the Settings spec (first registrant). |

## Relationship (amendments)

| Document | What this spec amends |
|---|---|
| Theme contract | “Reload returns to glass; no prefs key” — **replaced** by `workshell.prefs.v1`. Reload returns last **user** `setTheme`, else Glass. Token list still closed. Session-only switcher UI on the taskbar **dies**. |
| OS vision dogfood ladder | Step 2 was “Settings.” The missing organ was the **session**. This spec is that organ (minimal **app** registry + empty desktop). Settings remains the next spec: first **registrant**, not the OS. Widget registry remains later. |
| Surface contract | “Interactive shell-demo first”; Probe seed; kanban/TASK-* stay; desktop-shell does not import kit/navigator (still true of kernel **and** desktop). Probe guest **deleted**. Kit/navigator **packages and their unit tests stay**. Demo probe tests go with the demo. |
| Desktop shell design | Success was “kanban + TASK-104 + archive spatial lie.” Seed content **deleted**. Layer tree (wallpaper, widget-layer, float-layer, taskbar) **kept**. Widget-layer stays a place; fill is empty. |
| Package carve | Coordinating session was `apps/shell-demo`. Coordinating session is `apps/session`. `createDesktop` / `boot` **shape changes** (below). |
| Window manager | `open()` semantics, persist key, `version: 2`, pointer path, reopen-closed **UI** — unchanged. Menu uses `open()`. `EngineHosts.taskbar` becomes the **pills** node inside `#taskbar`, not `#taskbar` itself (see Menu). |

## Architecture

```
apps/session
  imports @workshell/session, @workshell/desktop, both theme tokens.css
  compositor.css + desktop shell.css (no kit.css, no navigator.css)
  createSession({ defaultTheme: "aetheris-glass" })
  createDesktop(root, session, { seed: emptySeed })
  registers nothing

@workshell/session          kernel (NEW)
  prefs, setTheme/getTheme, register/list/mount, boot, layout Storage wrapper
  depends on @workshell/compositor
  does not import @workshell/desktop, kit, navigator, themes

@workshell/desktop          DE choice (RENAME of desktop-shell)
  buildWorkspace, createPanelChrome, menu slot, createDesktop(root, session, { seed })
  depends on compositor + session
  does not import kit, navigator, themes

@workshell/compositor       unchanged persist rules, open(), pointer path

@workshell/kit | navigator  libraries; unused by the entry this spec
@workshell/theme-*          CSS imported only by the entry
```

Import graph: **session ↛ desktop**. Entry → both.

## Names and files

| Role | Path |
|---|---|
| Kernel | `packages/session/` (`@workshell/session`) |
| Desktop DE | `packages/desktop/` (`@workshell/desktop`) — git mv `packages/desktop-shell` |
| Entry | `apps/session/` (`@workshell/session-app` or workspace name `@workshell/os-session` — **package name `apps/session`, Vite workspace `@workshell/session-app`** so it does not collide with the kernel) |
| Deleted | `apps/shell-demo/` entire tree |

Root `package.json` scripts `dev` / `build` target the session app, not shell-demo.

Workspace `apps/*` already matches.

## Session API

```ts
export const PREFS_KEY = "workshell.prefs.v1";

export type PrefsV1 = { version: 1; theme: string };

export type AppRegistration = {
  id: string;
  title: string;
  mount: (el: HTMLElement) => void;
};

export type SessionOptions = {
  defaultTheme: string;
  storage?: Storage;
};

export type WorkshellSession = {
  readonly storage: Storage;
  register(app: AppRegistration): void;
  list(): ReadonlyArray<{ id: string; title: string }>;
  mount(id: string, el: HTMLElement): void;
  setTheme(workspace: HTMLElement, name: string): void;
  getTheme(workspace: HTMLElement): string | undefined;
  boot(opts: SessionBoot): WorkspaceEngine;
};

export type SessionBoot = {
  hosts: EngineHosts;
  workspace: HTMLElement;
  seed: () => LayoutState;
  createPanel: (id: string, title: string) => HTMLElement;
};
```

`createSession(opts)`:

- `storage = opts.storage ?? localStorage`
- `defaultTheme` required, non-empty
- Internal registry `Map<id, AppRegistration>`
- `this.storage` used for **both** prefs and the layout wrapper passed to `WorkspaceEngine`

### Registry

- `register`: empty `id` throws `/id/`; duplicate `id` throws `/already registered/`; `title` and `mount` required
- `list()`: `{ id, title }[]` in registration order (menu order)
- `mount(id, el)`: if registered, `app.mount(el)`; if not, **no-op** (do not throw). Body stays empty
- No unregister this spec
- No scheme field — that is navigator (Settings spec). Session ids are compositor panel ids

Register **before** `boot` so the layout wrapper allowlist includes them. Register after boot: `list()` updates; menu must refresh; already-loaded layout will not retro-materialize a new id until `open`. This spec registers only in tests, before boot.

### Prefs

Key: `workshell.prefs.v1`. Value: `{ version: 1, theme: string }`.

`readPrefs(storage)` (internal, tested):

- missing → `null`
- JSON throw → `null`
- `version !== 1` → `null`
- `theme` missing / not a non-empty string → `null`

No allowlist of theme **names** in the kernel (kernel does not import theme packages). Invalid names still stamp (today’s `setTheme("other")` behavior) **if** a user/API wrote them. `boot` only applies `null → defaultTheme`. A garbage name that survived sanitize as a string can still blank the desktop; **Settings spec** may add a catalog. This spec: corrupt envelope → default; well-typed unknown name → stamp as stored (named hole).

`setTheme(workspace, name)`:

- `workspace.dataset.theme = name`
- `storage.setItem(PREFS_KEY, JSON.stringify({ version: 1, theme: name }))`
- Whole-object write of `{ version, theme }` only. Do not invent other prefs fields. Next product key is a **new spec** (merge policy), not a silent extra field that `setTheme` would clobber

`getTheme(workspace)`: `workspace.dataset.theme` (may be `undefined` before boot stamp)

`boot` theme path:

1. `prefs = readPrefs(storage)`
2. `theme = prefs?.theme ?? opts.defaultTheme`
3. Stamp `workspace.dataset.theme = theme` **without** `setItem` when `prefs === null`
4. If `prefs` was present, do **not** rewrite the key on boot

### Layout storage wrapper

`WorkspaceEngine` still calls compositor `loadLayout` / `saveLayout`. Session passes a wrapper:

- `getItem(STORAGE_KEY)`: read raw → `JSON.parse` → **drop** `panels[id]`, slot `order`/`activeId`, `closed`, and `overlay` whose id is **not** in `registry` ids → `JSON.stringify`. Do **not** call compositor `loadLayout` inside the wrapper (`WorkspaceEngine` already does; that would recurse). If parse fails, return the raw string unchanged and let compositor seed. If registry is empty, persisted demo ids vanish.
- `setItem` / other keys: pass through (`PREFS_KEY` must round-trip on the same object)
- `getItem(PREFS_KEY)`: pass through (engine should not read it)

Do **not** bump layout `version` to wipe geometry.

Empty seed (entry):

```ts
{
  version: 2,
  slots: {
    left: { width: DEFAULT_LEFT_W, order: [], activeId: null },
    center: { width: 0, order: [], activeId: null },
    right: { width: DEFAULT_RIGHT_W, order: [], activeId: null },
  },
  panels: {},
  overlay: null,
  closed: [],
  nextZ: 1,
}
```

### `boot`

Order (required):

1. Wrap storage
2. Stamp theme (read prefs, no write if null)
3. `engine = new WorkspaceEngine(hosts, wrappedStorage, seed)`
4. `engine.boot((id) => { const title = engine.state.panels[id]?.title ?? registry title ?? id; return createPanel(id, title); })` then `session.mount(id, body)`
5. **No** `fillWidgetLayer` on the kernel. Desktop owns whether the widget-layer is filled (this spec: empty)
6. Return `engine`

Stamp **before** materialize so a future guest sees `data-theme` at mount.

## Desktop API

Rename package `@workshell/desktop-shell` → `@workshell/desktop`. CSS export stays `shell.css` (file name may remain `shell.css`; it is desktop place CSS).

```ts
export function createDesktop(
  root: HTMLElement,
  session: WorkshellSession,
  opts: { seed: () => LayoutState },
): { workspace: HTMLElement; engine: WorkspaceEngine };
```

Replaces `createDesktop(root)` + `host.boot({ theme, seed, fillWidgetLayer, fillPanelBody, storage })`.

`WorkshellHost.setTheme` **dies**. Callers use `session.setTheme`. Tests that stamped via host move to session tests.

`createDesktop`:

1. `buildWorkspace(root)` — layer tree kept, **`#taskbar` gains internal slots** (below)
2. `session.boot({ hosts, workspace: hosts.workspace, seed: opts.seed, createPanel: createPanelChrome })` — desktop supplies chrome factory; session mounts registry into `.panel-body`
3. Widget-layer: leave empty (no fill callback)
4. `mountMenu` on the **menu** slot (not on `hosts.taskbar`)
5. Return `{ workspace, engine }`

### `#taskbar` structure (required)

Today `renderTaskbar()` does `this.hosts.taskbar.replaceChildren()` and the demo prepends widgets onto `#taskbar`; the next `open()` wipes them. Menu cannot live on the same node the compositor paints.

`buildWorkspace` creates:

```
nav#taskbar
  [data-slot="menu"]      /* desktop mounts Menu; compositor never replaceChildren this */
  [data-slot="pills"]     /* EngineHosts.taskbar POINTS HERE */
```

- `#taskbar` remains the bar (`id="taskbar"`). Chrome tests that the **nav** is still a child of `#workspace` named `taskbar`.
- `EngineHosts.taskbar` is the **pills** node (`id` may be `taskbar-pills`). `renderTaskbar()` keeps wiping **that** node. `open()` semantics unchanged.
- `chrome.test.ts` today asserts `hosts.taskbar.id === "taskbar"` — **amend** it: `workspace.querySelector("#taskbar")` exists; `hosts.taskbar` is the pills child, not the nav.
- Trailing bar cluster is **not** this spec (no clock, no tray).

### Menu

A **bar control** in `[data-slot="menu"]`. Not a compositor panel. Not a child of the pills host.

- Idle: a button. Accessible name `Menu`
- Empty `list()`: button exists; opening it shows an empty list (no fake rows, no Settings placeholder)
- Non-empty: one row per `{ id, title }`; click → `engine.open(id, { title })` and close the list
- `open` of an already-live id focuses (existing engine behavior); closed id rematerializes (existing engine behavior)
- Menu chrome uses existing shell tokens (`--color-base-*`, `--glass*` as the desktop already does). **No kit import.** No overlay kit
- Implementation may be `<button>` + a sibling list (`hidden` / `aria-expanded`). Not a new package

Menu render: at `createDesktop` time. If tests `register` before `createDesktop`, rows exist. Live register-after-boot is not required this spec; if `register` after boot happens in a test, either refresh the list or document “register before boot” as law (prefer **register before boot** as law; list is a snapshot at menu mount, plus click handler reads `session.list()` live on open so a late register appears next open)

**Law:** `register` before `boot`/`createDesktop` for panels that must restore. Menu **open** reads `list()` live.

## Entry (`apps/session`)

`main.ts`:

```ts
const session = createSession({ defaultTheme: "aetheris-glass" });
const app = document.querySelector("#app");
const { engine } = createDesktop(app, session, { seed: emptySeed });
Object.assign(window, { workshell: engine, session });
```

CSS import order: compositor, desktop `shell.css`, both theme `tokens.css`. No `kit.css`, no `navigator.css`, no `demo.css`.

No `fillPanelBody` switch. No theme-switch widget.

## Deleted with the demo

- `apps/shell-demo/**`
- Kanban widget, TASK-104 pages, Probe guest, `theme-switch.ts`, `demo.css`, demo seed `KNOWN_IDS`
- Root scripts pointing at `@workshell/shell-demo`
- Surface-contract **demo** acceptance (Probe window, taskbar Prism). Kit/navigator unit tests remain the spine proof
- README demo/kanban/Probe acceptance bullets — replace with empty-session acceptance

Do not keep Probe as a registered sample.

## Tests

Kernel (happy-dom, `mem()` storage — **not** implicit jsdom localStorage alone):

- `readPrefs`: missing / bad JSON / bad version / empty theme → treat as null; boot stamps `defaultTheme` and does **not** `setItem(PREFS_KEY)`
- `setTheme` stamps `data-theme` and writes `{ version: 1, theme }`
- Reload path: storage has prism prefs → boot stamps prism without rewriting if the object is already valid
- Layout wrapper: storage has `workshell.layout.v1` with `probe` + `task-104`; empty registry; after boot, `engine.state.panels` has neither
- Layout wrapper: register `{ id: "fake" }` before boot; persisted `fake` panel is kept; `probe` still dropped
- `register` duplicate throws; `mount` unknown no-op
- `list()` order is registration order
- Prefs and layout share the **same** `mem()` object (`PREFS_KEY` and `STORAGE_KEY`)

Desktop:

- `createDesktop` builds layer tree; `#widget-layer` has no kanban
- Menu button present in `[data-slot="menu"]`; with empty registry, list has zero rows
- Register one app, `createDesktop`, open menu, click row → `engine.state.panels[id]` exists and `.panel-body` received `mount`
- **After that `open()`,** `[data-slot="menu"]` still contains the Menu button (pills `replaceChildren` must not wipe it)
- `hosts.taskbar` is the pills node; `#taskbar` is the parent nav

Entry / smoke: existing compositor and desktop chrome tests still green after rename. **Delete** demo tests (kanban, task-104, probe mount, theme-switch, seed). Theme `CONTRACT_VARS` unchanged.

`npx tsc --noEmit` clean. `npm test` without `@workshell/shell-demo`.

## Acceptance

1. `npm run dev` serves `apps/session`. Fresh origin (or cleared `workshell.layout.v1` **and** `workshell.prefs.v1`): wallpaper, bar, Menu, no windows, no kanban.
2. Reload: same. `data-theme` is `aetheris-glass`. Prefs key **absent**.
3. Console `session.setTheme(document.querySelector("#workspace"), "aetheris-prism")`: desktop restyles; reload stays Prism; layout key still geometry-only. (`window.session` is the kernel; `setTheme` still takes the workspace node — do not change that arity.)
4. Old demo layout in storage: load does **not** show Probe or TASK-104.
5. No Glass/Prism buttons on the bar.

José judges visually; tests cover prefs/wrapper/menu door.

## What this spec does not achieve (named)

- A second DE (narrow/kiosk). Architecture allows it; entry only chooses desktop.
- Settings as a window. Menu is empty in production until the next spec registers it.
- Widget enablement / widget registry.
- Theme name sanitizer against loaded CSS (unknown string still stamps).
- Per-user prefs and the redirect-to-backend app.
- Start search, pins, spatial desktops.
- Live guests using kit/navigator.
- Merging extra fields into `workshell.prefs.v1` without clobber.

## Proof holes (named so later specs see them)

| Claim | Unproven here | Who trips |
|---|---|---|
| Unknown but well-typed theme name | No catalog; stamp can blank tokens | Settings Appearance |
| Menu chrome a11y / keyboard | Tests click; no focus trap spec | Settings on the menu |
| Register-after-boot restore | Law is register-before-boot | Hot-load guests |
| Two apps on the same origin sharing keys | Demo deleted; spa not here | Second host later |
| `demo.css` kanban hardcoded blur | Demo **deleted**; gone, not fixed | — |
| Surface-contract Probe acceptance | Deleted with demo; kit unit tests remain | Anyone citing Probe in README |

## Open questions

None on the decisions above (José: approach 2; names A; demo deleted; monolith frontend; backend/users elsewhere; `#workspace` is the one desktop surface; write the plan). Settings is the next spec: first `register`, Appearance via injected `{ themes, current, setTheme: session.setTheme }`, taskbar skin switch already gone.
