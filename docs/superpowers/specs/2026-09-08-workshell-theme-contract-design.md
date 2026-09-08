# Workshell Theme Contract Design

Date: 2026-09-08
Status: Approved in conversation (José: contract probe; family names; session-only; DaisyUI-shaped roles; status roles only; traffic lights follow status)
Project: workshell (test prototype)

Depends on: package door in `2026-09-07-workshell-package-carve-design.md`, desktop chrome in `2026-09-07-workshell-desktop-shell-design.md`. Card-open windows (`2026-09-08-workshell-card-open-windows-design.md`) stay unchanged.

This spec does **not** change window modes, persist key `workshell.layout.v1`, layout `version: 2`, the 180 Hz pointer path, `createDesktop` / `boot()` shape, or `WorkspaceEngine.open()`. It replaces `@workshell/theme-aetheris` with two family-named skins and a closed token contract so `setTheme` is honest.

## Goal

Prove a DaisyUI-shaped theme contract on **shell-demo**. Two skins. One `setTheme`. Chrome and widgets actually change. Pattern only — do not add the daisyUI package to compositor or desktop-shell.

Success: boot is glass; the demo taskbar switches to prism without reload; wallpaper, panels, taskbar, traffic lights, kanban, inspector, and body font all follow the new `data-theme`. Reload returns to glass.

## Non-goals

- Angular `apps/spa`
- Persisting the chosen theme
- Hue crayon box (`--color-green`, `--color-red`, …) — status roles only for now
- Cloning archive HTML / prism top bar / extra OS chrome
- Kanban drag-and-drop
- Overlay / dock titlebar chrome
- Changing persist key or `version: 2`
- Pointer-path work (`getBoundingClientRect` / persist / class toggles on `pointermove` stay forbidden)
- Adding daisyUI or making compositor/shell depend on Tailwind

## Product locks (still in force)

- Interactive **shell-demo first**, not the PWA.
- Later spa is **A — Angular `apps/spa` on `createDesktop` / `boot()`**.
- Board stays a widget: cards carry `data-task-id`; engine only sees `open(id, { title })`.
- Stitch / archive HTML is a **skin source**, not shell structure.

## Architecture

DaisyUI model, vanilla CSS:

1. Theme package = CSS variables + `color-scheme` + `--wallpaper` URL. No `:root`.
2. Shell / compositor / demo consume those variables once.
3. Escape hatch `[data-theme="…"] .foo` only when a recipe cannot be a variable (wallpaper veil, prism specular `box-shadow`).
4. Geometry is not a skin.

```
demo imports both tokens.css
boot({ theme: "aetheris-glass" })
  → setTheme stamps #workspace[data-theme]
taskbar Glass / Prism
  → host.setTheme("aetheris-glass" | "aetheris-prism")
```

`setTheme` still only stamps the attribute. Unknown names still stamp (current API). They just have no CSS block. Both CSS files are imported up front.

## Packages / `data-theme`

Replace `@workshell/theme-aetheris` (`data-theme="aetheris"`).

| Package | `data-theme` | Asset |
|---|---|---|
| `@workshell/theme-aetheris-glass` | `aetheris-glass` | `glass.webp` (from `archive/aetheris-glass/`) |
| `@workshell/theme-aetheris-prism` | `aetheris-prism` | `abstract.webp` (from `archive/aetheris-prism/`) |

Sources: `archive/aetheris-glass/` and `archive/aetheris-prism/` (`DESIGN.md` + local `webp`). Archive `code.html` is reference, not copied.

## Boot / session

- `boot({ theme: "aetheris-glass" })` every time.
- Switcher is live only. Reload returns to glass.
- Layout persist unchanged. No new `localStorage` key.

## Switcher

Demo-only. Two buttons on the existing `#taskbar`, **prepended** (left of window pills). Not a `.task-pill`. Labels **Glass** / **Prism**. `role="group"` / `aria-pressed`. Click calls `host.setTheme`. No extra host API. Demo finds the taskbar via `host.workspace.querySelector("#taskbar")`.

## Closed token list

Both packages implement every name. Nothing else is a theme API.

### Surfaces

- `--color-base-100` / `--color-base-200` / `--color-base-300`
- `--color-base-content` — ink on those surfaces. Muted text is this color at lower opacity (`color-mix` / alpha), not a extra role.

### Brand

- `--color-primary` + `--color-primary-content`
- `--color-secondary` + `--color-secondary-content`
- `--color-accent` + `--color-accent-content`
- `--color-neutral` + `--color-neutral-content`

### Status (the green / red / amber for now)

- `--color-info` + `--color-info-content`
- `--color-success` + `--color-success-content` — max traffic light
- `--color-warning` + `--color-warning-content` — hide traffic light
- `--color-error` + `--color-error-content` — close traffic light

No `--color-green` / `--color-red` / `--color-amber` this pass.

### Glass recipe

- `--surface`
- `--surface-card`
- `--surface-border`
- `--surface-blur`

### Type

- `--font-sans` — Glass: Plus Jakarta Sans · Prism: Inter
- `--font-display` — Space Grotesk both
- `--font-mono` — JetBrains Mono both

### Shape

- `--radius-box` — panels, taskbar, cards
- `--radius-field` — buttons, inputs
- `--radius-selector` — chips. Traffic-light dots stay `border-radius: 50%` (circles).
- `--border` — hairline width

### Desktop

- `--wallpaper` — `url("./….webp")` in-package
- `color-scheme: dark | light`

### Not a skin (shell `:root` / `#workspace`)

- `--taskbar-h`, `--taskbar-gap`, `--left-w`, `--right-w`

`chrome.ts` already sets `--taskbar-h` / `--taskbar-gap` inline on `#workspace`. Shell CSS provides the same defaults plus `--left-w: 320px` and `--right-w: 360px` (match `DEFAULT_LEFT_W` / `DEFAULT_RIGHT_W`).

### Retired

- `--cyan`, `--cyan-dim`, `--violet`, `--green`, `--bg`, `--bg-panel`, `--text`, `--muted`, `--line`, `--focus`
- Theme tokens on `:root`
- Remote wallpaper URL

## Mapping (archive → tokens)

Hexes come from each `DESIGN.md`. Prism warning is not named there; use `#F59E0B` (amber that reads on white glass).

| Token | Glass | Prism |
|---|---|---|
| `--color-base-100` | `#0B0E14` | `#F7F9FB` |
| `--color-base-content` | `#F0F4FA` | `#1E293B` |
| `--color-primary` | `#00F0FF` | `#0284C7` |
| `--color-secondary` | `#8A3FFC` | `#7DD3FC` |
| `--color-accent` | `#00FF85` | `#C084FC` |
| `--color-success` | `#27C93F` | `#10B981` |
| `--color-warning` | `#FFBD2E` | `#F59E0B` |
| `--color-error` | `#FF5F56` | `#BA1A1A` |
| `--font-sans` | Plus Jakarta Sans | Inter |
| `--wallpaper` | `./glass.webp` | `./abstract.webp` |
| `color-scheme` | `dark` | `light` |

Category chips in the demo (e.g. “Arquitetura”) use `--color-accent`, not a hue token.

## File ownership

```
packages/themes/aetheris-glass/   tokens.css + glass.webp
packages/themes/aetheris-prism/   tokens.css + abstract.webp
```

Each `tokens.css` is `[data-theme="…"] { closed list; color-scheme; --wallpaper }`. Escape-hatch rules may follow in the same file.

**Delete** `packages/themes/aetheris`.

**`shell.css`** owns:

- Geometry vars on `#workspace`
- `#workspace` background / color / font from tokens
- `#wallpaper { background-image: var(--wallpaper); }` plus a `::after` overlay *structure*
- `#taskbar`, `.task-pill`, `.panel` paint via tokens
- `.tl-close` / `.tl-hide` / `.tl-max` → error / warning / success
- `.panel.is-dragging` drops `backdrop-filter` and uses solid `--color-base-100` (pointer path)

**`compositor.css`** stays mechanical (overflow, `translate3d`, mode geometry, drag `will-change`). May use `--radius-box` / `--taskbar-h`. No pigment.

**`demo.css`** uses only the closed list. No cyan/violet/glass literals.

**`apps/shell-demo`**

- Depends on both theme packages; imports both CSS files
- `index.html` loads Inter as well as Jakarta / Grotesk / Mono
- Taskbar switcher in demo code
- `boot({ theme: "aetheris-glass" })`

Because tokens live on `#workspace`, not `:root`, `html` / `body` stay transparent. `#workspace` fills the viewport and carries the skin.

## Escape hatches (allowed)

- `#wallpaper::after` veil color per theme
- Prism (and glass if needed) `.panel` specular `box-shadow` that cannot be one variable
- Prefer a token first

## Pointer path

Unchanged. No `getBoundingClientRect` / `offsetWidth` / `clientWidth` / `localStorage` / Tailwind class toggles on `pointermove`. Dragging may disable `backdrop-filter` via the existing `.is-dragging` class (commit/start of gesture, not per-move).

## Tests

- Contract: both `tokens.css` files define every required custom property, set `color-scheme`, include `--wallpaper`, do not use `:root`, do not define geometry vars, do not use retired pigment names. Webp files exist.
- Host tests that pass `theme: "aetheris"` update to `"aetheris-glass"` (string only; `setTheme` API unchanged).
- Switcher: mount prepends two buttons; click calls `setTheme` with the family names and toggles `aria-pressed`.
- Existing compositor / open / kanban / persist tests stay green.

## Acceptance (demo, no reload)

1. Fresh load: glass look, `data-theme="aetheris-glass"`, seed TASK-104 only.
2. Click **Prism**: wallpaper (`abstract.webp`), taskbar, open panels, traffic lights, kanban, inspector, body font (Inter) all go light. `color-scheme: light`.
3. Click **Glass**: reverse, Jakarta, `glass.webp`.
4. Open TASK-112, then switch: that window follows; it is not a snapshot.
5. Hide / close / reopen via the card still matches the current theme.
6. Kanban cards still `data-task-id` → `open(id, { title })`.
7. Reload returns to glass. Layout persist still `workshell.layout.v1`.

README: one line in the acceptance list for the Glass / Prism switcher (this session only).

## Angular later

Same door: import both (or one) theme CSS, `boot({ theme })`, `host.setTheme`. Do not scrape computed styles. Do not add a second theme API.
