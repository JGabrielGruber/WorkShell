# Workshell Settings + Theme Engine Design

Date: 2026-09-09
Status: Draft (locks from conversation; awaiting José review)
Project: workshell (test prototype)

Depends on: OS session (`2026-09-09-workshell-os-session-design.md`), theme contract (`2026-09-08-workshell-theme-contract-design.md`), surface contract (`2026-09-09-workshell-surface-contract-design.md`), OS vision (`docs/vision/os.md`).

Skin source: `archive/light-contrast/DESIGN.md` **prose** (Win32 / GetSysColor). YAML Material palette in that file is **not** law. Do not paste archive HTML.

This spec **does** add the first guest (Settings), `@workshell/theme` (engine + builtin `base` + catalog), a JS theme module (import = paint), and a **new closed token list**. It **rewrites** chrome/kit/navigator CSS to standard `var(--*)` names. It does **not** redo aetheris-glass / aetheris-prism. It does **not** change layout key `workshell.layout.v1`, layout `version: 2`, the pointer path, `WorkspaceEngine.open()`, or compositor `sanitizeLayout`.

Windows analogue (law for the split):

| Windows | Workshell |
|---|---|
| `uxtheme` / `GetSysColor` | `@workshell/theme` — apply, catalog, builtin Classic |
| Windows Classic | `base` **inside** `@workshell/theme` |
| `HKCU\Control Panel\Colors` + `\Themes` | session prefs `workshell.prefs.v1` |
| Display → Appearance (CPL) | `@workshell/settings` |
| `.theme` files | extra skin packages registered on the engine |
| Regedit | **not this spec** (raw hive editor) |

## Goal

The empty OS session gets a **real app** and a **real theme system**.

Success:

1. Load `apps/session`: teal desktop, classic chrome (no photo, no blur), Menu contains **Settings**.
2. Menu → Settings window: navigator at `settings:/appearance`. Appearance lists **`session.theme.list()`** (this spec: one row, Base). Choose a row → `session.setTheme(id)`; reload keeps it.
3. `data-theme="base"` on `#workspace`. Prefs key absent until the user (or a test) calls `setTheme`.
4. No `import "*.css"` and no `import "…/tokens.css"` in `apps/session`. Paint arrives because packages import `@workshell/theme` and their own CSS from JS.
5. Change `base` tokens inside `@workshell/theme` → compositor, desktop, kit, navigator, Settings all follow. `theme.apply` swaps `data-theme` and the same variables restyle the DE.

## Non-goals (this spec)

- Redo `@workshell/theme-aetheris-glass` / `theme-aetheris-prism` (stay in the tree, **unregistered**, not in the entry)
- Glass switch, extra Settings pages, search, start columns
- Widget registry; other apps contributing Settings panes
- Webfont / Arimo (system stack only)
- Theme editor, overlay/customization UI, CSSOM mutation API
- A raw prefs / token inspector (regedit)
- New geometry tokens (`--taskbar-h` stays shell)
- Unregister theme; `theme.register` after boot
- `mount(el, ctx)` on session apps
- Push, force-push, kill Vite

## Product locks

- Settings is the first **session** registrant (`AppRegistry`). Skins are **not** apps.
- Theme **logic** lives in `@workshell/theme`: closed list, `apply`, catalog, builtin `base`. Session does not own a second catalog.
- `base` ships **inside** `@workshell/theme`. There is **no** `@workshell/theme-base` package.
- A skin is a **JS module**. Importing it loads its CSS. `theme.register` makes the id legal. Nobody lists `tokens.css` in the app.
- Session owns **one** `Theme` instance (`session.theme`). Boot and `setTheme` persist in the hive and call `theme.apply`. `session.registerTheme` / `session.themes()` **die**.
- Token **names** are wide CSS/DaisyUI/Tailwind practice (`--color-base-100`, `--shadow`, `--blur`). Token **values** on `base` are Win32 prose. Not `--bevel-*`, not `--glass-*`, not `--color-face`.
- Cover the dump below **in the first contract**. Unused values still exist so a later skin can fill them.
- Package CSS is structure + `var(--token)`. Hex, chisel recipes, caption gradient, teal desktop live in `@workshell/theme` base CSS.
- Catalog is **law** for `apply` / `setTheme`. Unknown names do not stamp.
- `register` (apps) and `theme.register` (skins) before `boot` / `createDesktop`.
- Monolith frontend. Kernel still does not import desktop, kit, navigator, or Settings. Kernel **does** import `@workshell/theme`.

## Key decisions

| Decision | Rationale |
|---|---|
| `@workshell/theme` = engine + `base` + catalog | Theme logic is not a session organ. Classic ships with the engine. |
| No `@workshell/theme-base` | A separate skin package for the builtin is a fake split. |
| `session.theme` + hive persist | Windows: engine applies; HKCU remembers. |
| `session.setTheme` / `getTheme` stay | Settings is the CPL; it writes the hive through session. |
| `session.registerTheme` / `themes()` die | One catalog API, on the engine. |
| `ThemeRegistration` includes `description` | Identity prose belongs to the skin. |
| `@workshell/settings` + `createSettings(session)` | First guest is a package, not `apps/session/src`. |
| Navigator + `settings:` + Appearance only | Proves spine in a real panel. Not a Settings product. |
| Appearance = `listView` of `session.theme.list()` | Dynamic catalog, not hardcoded Glass/Prism. |
| `setTheme(name)` / `getTheme()` | Session remembers workspace at boot. OS-session arity **dies**. |
| Catalog allowlist | Closes the “unknown name blanks the desktop” hole. |
| `defaultTheme` defaults to `"base"` | Builtin is the first skin everything must survive. |
| Packages import `@workshell/theme` + own CSS | Entry is not a stylesheet manifest. |
| New closed list; retire `--glass*` | Base is opaque + `box-shadow`. Glass is a later skin, not the vocabulary. |
| Harvest DESIGN.md prose | Classic, no photo, no effects. YAML Material ignored. |
| Overlay / customization later | `apply` is the only writer now, so overlays can merge later without soup in Settings. |

## Relationship (amendments)

| Document | What this spec amends |
|---|---|
| OS session | Settings **is** this spec. `setTheme(workspace, name)` **dies**. `defaultTheme` optional, default `"base"`. Session **owns** a `Theme`; it does not implement the catalog. Entry no longer imports theme CSS. Kernel **does** import `@workshell/theme`. Injected `{ themes, current, setTheme }` bag **rejected**. |
| Theme contract | Closed list **replaced** (below). `--glass*` **retired**. Contract tests assert **`@workshell/theme` base** only. Glass/prism packages are not required to pass the new list until they are redone. Harvest protocol (DESIGN.md → tokens, no archive HTML) **kept**. |
| Surface contract | Kit/navigator now have a live guest. Entry **may** import those packages (via Settings). Desktop/kernel still do not. |
| OS vision | Settings is the first registrant; Appearance switches skins via `session.setTheme` → `theme.apply`. Glass as an independent effect API still later. Customization is overlay-on-engine later, not CSS edits in Settings. |

## Architecture

```
apps/session
  JS only: session, desktop, settings
  createSession()                          // createTheme() inside; base already registered
  register(createSettings(session))
  createDesktop(...)
  no *.css imports, no tokens.css, no aetheris
  extra skin later: import glass; session.theme.register(glass)

@workshell/settings
  createSettings(session) → session AppRegistration { id: "settings", title: "Settings" }
  mount: Navigator(initialUrl: "settings:/appearance") + scheme "settings"
  Appearance: session.theme.list(); session.setTheme(id); session.getTheme()
  depends on session, kit, navigator
  does not import desktop, compositor, or @workshell/theme directly

@workshell/session
  AppRegistry + prefs hive
  createSession → createTheme(); session.theme is that instance
  boot / setTheme → theme.apply(workspace, id) + prefs write rules
  depends on compositor + @workshell/theme
  does not import desktop, kit, navigator, settings, aetheris

@workshell/theme
  createTheme(): catalog + apply + auto-register base
  src/base/tokens.css: [data-theme="base"] { closed list + hatches }
  index.ts: import "./base/tokens.css"; export { createTheme, baseTheme }

@workshell/compositor | desktop | kit | navigator
  JS index: import "@workshell/theme"; import "./own.css"
  own.css: structure + var(--token) only
```

Import graph: **session ↛ desktop ↛ settings**. **session → theme**. Extra skins later: entry `import { x } from "@workshell/theme-…"` then `session.theme.register(x)` — still no raw CSS import.

Vite dedupes `@workshell/theme` CSS if several packages import it.

`theme.apply` is the **only** writer of `data-theme` (and, later, of overlay custom properties). Chrome CSS never calls `setProperty` for skin tokens.

## Names and files

| Role | Path |
|---|---|
| Theme engine + builtin `base` | `packages/theme/` (`@workshell/theme`) |
| Extra skins (unchanged, unregistered) | `packages/themes/*` (`@workshell/theme-aetheris-glass`, …) |
| Settings guest | `packages/settings/` (`@workshell/settings`) |
| Entry | `apps/session/` — register Settings; drop theme CSS and Google Fonts `<link>`s |

Root `workspaces` is already `packages/*` + `packages/themes/*` + `apps/*`. `packages/theme` is covered by `packages/*`. Do **not** put the engine under `packages/themes/` (that glob is extra skins).

## Theme engine

```ts
export type ThemeRegistration = {
  id: string;
  title: string;
  description: string;
};

export const baseTheme: ThemeRegistration = {
  id: "base",
  title: "Base",
  description: "Opaque classic chrome. No photo, no blur.",
};

export type Theme = {
  register(theme: ThemeRegistration): void;
  list(): ThemeRegistration[];
  apply(el: HTMLElement, id: string): void;
};

export function createTheme(): Theme;
```

`packages/theme/src/index.ts` imports `./base/tokens.css` so any JS import of `@workshell/theme` loads base paint. `exports["."]` points at that JS. Keep `./tokens.css` (or `./base/tokens.css`) as a subpath for `contract.test.ts` `readFileSync`.

`createTheme()`:

1. Empty catalog, then `register(baseTheme)`.
2. `base` is always first in `list()`.

`register(theme)`:

- Empty `id`, `title`, or `description` → throw.
- Duplicate `id` → throw `/already registered/`.
- Order = registration order. No unregister this spec.

`list()`: full `ThemeRegistration[]` (id, title, description).

`apply(el, id)`:

- `id` not in catalog → throw `/theme/`. Do not stamp.
- Else `el.dataset.theme = id`. **No prefs I/O.** Theme does not know about storage.

A later skin is the same `ThemeRegistration` shape plus its own `import "./tokens.css"` in **that** package. Registering `{ id, title, description }` by hand without importing a module is a hole (tests may do it under happy-dom; production extra skins must import the module so CSS loads).

This spec does **not** put a JS token map on `ThemeRegistration`. Paint stays CSS. Overlays later merge in `apply`, not by duplicating the closed list in TypeScript now.

## Session (hive + process)

Duplicate type names: session `AppRegistration` vs navigator `AppRegistration` — Settings code uses both; do not merge them.

```ts
type SessionOptions = {
  defaultTheme?: string;
  storage?: Storage;
  theme?: Theme; // tests; default createTheme()
};

type WorkshellSession = {
  storage: Storage;
  theme: Theme;
  register(app: AppRegistration): void;
  list(): Array<{ id: string; title: string }>;
  mount(id: string, el: HTMLElement): void;
  setTheme(name: string): void;
  getTheme(): string | undefined;
  boot(opts: SessionBoot): WorkspaceEngine;
};
```

`createSession`:

1. `storage` default `localStorage`. `defaultTheme` default `"base"`.
2. `theme` default `createTheme()` (base already registered).
3. Empty `defaultTheme` string still throws.
4. **No** `registerTheme` / `themes()` on the session object.

`boot`:

1. If `defaultTheme` is not in `theme.list()` ids → throw `/defaultTheme/`.
2. Remember `workspace`.
3. `prefs = readPrefs`. If `prefs?.theme` is in the catalog, use it; else `defaultTheme`.
4. `theme.apply(workspace, name)`. **No prefs write** on missing key **and** on fallback from an unknown stored name.
5. Wrap layout storage, `WorkspaceEngine`, mount `.panel-body` — unchanged.

`setTheme(name)`:

- Before boot → throw `/boot/`.
- `theme.apply(workspace, name)` (throws `/theme/` if unknown — no stamp, therefore no write).
- Then `writePrefs` whole object `{ version: 1, theme: name }`. No extra prefs fields this spec.

`getTheme()`: `dataset.theme` on remembered workspace; `undefined` before boot. Does not consult prefs.

`setTheme(workspace, name)` / `getTheme(workspace)` **die**. Tests, README, `window.session` use the new arity.

Console later: extra skin is `session.theme.register(glassTheme)` then `session.setTheme("aetheris-glass")` — not `session.registerTheme`.

## Closed token list (replaces theme-contract `CONTRACT_VARS`)

Every name below is **required** on `[data-theme="base"]`. Geometry names remain forbidden in theme CSS.

### Color

DaisyUI direction: `--color-base-100` is the **lightest** surface. 3DLIGHT / 3DHILIGHT exist only inside `--shadow*` values in base CSS.

| Token | Base value |
|---|---|
| `--color-base-100` | `#ffffff` (COLOR_WINDOW paper) |
| `--color-base-200` | `#c0c0c0` (3DFACE chrome) |
| `--color-base-300` | `#808080` (3DSHADOW) |
| `--color-base-content` | `#000000` |
| `--color-primary` / `-content` | `#000080` / `#ffffff` (active caption) |
| `--color-secondary` / `-content` | `#1084d0` / `#ffffff` (caption gradient end) |
| `--color-accent` / `-content` | `#008080` / `#ffffff` (desktop teal) |
| `--color-neutral` / `-content` | `#c0c0c0` / `#000000` |
| `--color-info` / `-content` | `#000080` / `#ffffff` |
| `--color-success` / `-content` | `#008000` / `#ffffff` |
| `--color-warning` / `-content` | `#808000` / `#000000` |
| `--color-error` / `-content` | `#800000` / `#ffffff` |
| `--color-muted` | `#808080` (disabled text) |

### Type

| Token | Base value |
|---|---|
| `--font-sans` | `Tahoma, "MS Sans Serif", Arial, sans-serif` |
| `--font-display` | same as sans |
| `--font-mono` | `Consolas, "Courier New", monospace` |
| `--font-serif` | `"Times New Roman", Times, serif` |
| `--text-xs` / `--text-sm` / `--text-md` / `--text-lg` / `--text-xl` | `9px` / `11px` / `12px` / `13px` / `16px` |
| `--leading` | `1.2` |
| `--tracking` | `0` |

### Shape

| Token | Base value |
|---|---|
| `--radius-box` / `--radius-field` / `--radius-selector` | `0` |
| `--border` | `1px` |

### Depth (`box-shadow`, not “bevel”)

| Token | Base value (DESIGN.md recipes) |
|---|---|
| `--shadow-sm` | thin groove: `inset 1px 1px #808080, inset -1px -1px #ffffff` |
| `--shadow` | 2px raised: `inset -1px -1px #000000, inset 1px 1px #ffffff, inset -2px -2px #808080, inset 2px 2px #dfdfdf` |
| `--shadow-inner` | 2px sunken: `inset 1px 1px #808080, inset -1px -1px #ffffff, inset 2px 2px #000000, inset -2px -2px #dfdfdf` |
| `--shadow-md` | 3px window frame: `inset -1px -1px #000000, inset 1px 1px #ffffff, inset -3px -3px #808080, inset 3px 3px #dfdfdf` |
| `--shadow-lg` | modal / menu: `--shadow` plus outer drop `1px 1px 0 #000000` (exact: `inset -1px -1px #000000, inset 1px 1px #ffffff, inset -2px -2px #808080, inset 2px 2px #dfdfdf, 1px 1px 0 #000000`) |

Zero blur radius in these shadows.

### Filter

| Token | Base value |
|---|---|
| `--blur` / `--blur-sm` | `0px` |

### Desktop

| Token | Base value |
|---|---|
| `--wallpaper` | `none` |

`#wallpaper` in **desktop** CSS:

```css
background-color: var(--color-accent);
background-image: var(--wallpaper);
background-size: cover;
background-position: center;
```

No photo. `#wallpaper::after` veil is empty on base (a `[data-theme="base"]` hatch may zero it).

### Space (skin rhythm, not taskbar geometry)

`--space-2` `2px`, `--space-4` `4px`, `--space-6` `6px`, `--space-8` `8px`, `--space-12` `12px`, `--space-16` `16px`, `--space-24` `24px`.

### Also required on the `[data-theme]` block

`color-scheme: light`. No `:root`.

### Retired (must not appear in compositor / desktop / kit / navigator CSS)

`--glass`, `--glass-card`, `--glass-border`, `--glass-blur`, `--surface`, `--surface-card`, `--surface-border`, `--surface-blur`.

Aetheris packages may still contain `--glass*` until redone; they are not in the boot graph.

### Chrome mapping (law)

| Surface | CSS |
|---|---|
| Desktop `#wallpaper` | `background-color: var(--color-accent); background-image: var(--wallpaper)` |
| Panel, taskbar, menu, kit page, buttons | `background: var(--color-base-200); color: var(--color-base-content); box-shadow: var(--shadow); border-radius: var(--radius-box)` |
| Fields, list boxes, paper | `background: var(--color-base-100); color: var(--color-base-content); box-shadow: var(--shadow-inner)` |
| Active titlebar | base hatch: `linear-gradient(to right, var(--color-primary), var(--color-secondary)); color: var(--color-primary-content)` |
| Disabled text | `color: var(--color-muted)` |
| Borders (when not using shadow) | `border: var(--border) solid var(--color-base-300)` |

Hex is allowed **only** in `@workshell/theme` base CSS (token values and `[data-theme="base"]` hatches).

`CONTRACT_VARS` (contract test must contain each as a substring in base `tokens.css`):

`--color-base-100`, `--color-base-200`, `--color-base-300`, `--color-base-content`, `--color-primary`, `--color-primary-content`, `--color-secondary`, `--color-secondary-content`, `--color-accent`, `--color-accent-content`, `--color-neutral`, `--color-neutral-content`, `--color-info`, `--color-info-content`, `--color-success`, `--color-success-content`, `--color-warning`, `--color-warning-content`, `--color-error`, `--color-error-content`, `--color-muted`, `--font-sans`, `--font-display`, `--font-mono`, `--font-serif`, `--text-xs`, `--text-sm`, `--text-md`, `--text-lg`, `--text-xl`, `--leading`, `--tracking`, `--radius-box`, `--radius-field`, `--radius-selector`, `--border`, `--shadow-sm`, `--shadow`, `--shadow-md`, `--shadow-lg`, `--shadow-inner`, `--blur`, `--blur-sm`, `--wallpaper`, `--space-2`, `--space-4`, `--space-6`, `--space-8`, `--space-12`, `--space-16`, `--space-24`.

## CSS graph

Each CSS-owning package's **JS index**:

```ts
import "@workshell/theme";
import "./<own>.css";
```

| Package | Own CSS |
|---|---|
| compositor | `compositor.css` |
| desktop | `shell.css` |
| kit | `kit.css` |
| navigator | `navigator.css` |
| theme | `base/tokens.css` (via engine index) |
| session | none (imports `@workshell/theme` via `createTheme`) |
| settings | none (kit + navigator pull CSS) |

`exports` may keep `./compositor.css` subpaths for tests that `readFileSync` CSS; production consumers import the JS.

`apps/session/src/main.ts` and `index.html`: **no stylesheet imports**. Drop Google Fonts links (system stack).

Hex in compositor/desktop/kit/navigator CSS: **forbidden** for color/radius/blur/shadow/wallpaper/font. `currentColor` ok. `transparent` ok.

`backdrop-filter: blur(var(--blur))` is ok; on base `--blur: 0px` it is a no-op.

Titlebar gradient (primary → secondary), menu highlight: **`[data-theme="base"]` hatches** in `@workshell/theme` targeting existing class names (same pattern as old `#wallpaper::after`). Caption buttons are Classic gray mini push buttons in `shell.css` (`--color-base-200`, `--shadow`; not status fills). Do not put navy hex in `shell.css`.

## Settings guest

```ts
export function createSettings(session: WorkshellSession): AppRegistration {
  return {
    id: "settings",
    title: "Settings",
    mount(el) {
      const nav = new Navigator(el, { initialUrl: "settings:/appearance" });
      nav.register({
        scheme: "settings",
        views: { appearance: (ctx) => appearanceView(ctx, session) },
        rules: [{ path: "/", docks: { center: "appearance" } }],
      });
    },
  };
}
```

- One navigator app. Leading/trailing docks empty.
- Unknown `settings:` href: existing navigator no-op.
- `appearanceView`: kit `page` titled Appearance + `listView` of `session.theme.list()` (`id` / `title`; `description` as the row’s supporting text if `listView` has a subtitle slot, else title-only is legal). `selectedId` is `session.getTheme()`. `onSelect` calls `session.setTheme(id)` then updates `aria-selected` (rebuild the list or set attributes) so the current row is visible without remounting the navigator.
- No glass switch. No extra prefs keys. No kit `specimen()` this spec (the live Settings chrome *is* the preview while only `base` is registered).

## Entry

```ts
import { createSession, emptyLayout } from "@workshell/session";
import { createDesktop } from "@workshell/desktop";
import { createSettings } from "@workshell/settings";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("#app missing");

const session = createSession();
session.register(createSettings(session));
const { engine, workspace } = createDesktop(app, session, { seed: emptyLayout });
Object.assign(window, { workshell: engine, session, workspace });
```

`apps/session` `package.json` depends on `@workshell/settings` + session + desktop. Kit/navigator are not required on the app if settings pulls them (Vite follows settings → kit).

Menu shows Settings. Click → `engine.open("settings", { title: "Settings" })`.

## Errors

| Case | Behavior |
|---|---|
| `theme.register` empty id/title/description | throw |
| duplicate theme id | `/already registered/` |
| `theme.apply` unknown id | `/theme/` — no stamp |
| `boot` `defaultTheme` not in catalog | `/defaultTheme/` |
| `setTheme` before boot | `/boot/` |
| `setTheme` unknown id | `apply` throws `/theme/` — no stamp, no write |
| missing `.panel-body` | existing `/panel-body/` |
| unknown navigator href | existing no-op |

## Tests (TDD, Vitest, happy-dom)

**Theme engine**

- `createTheme().list()` is `[{ id: "base", title: "Base", description: <non-empty> }]`.
- `apply(el, "base")` sets `el.dataset.theme` to `"base"`.
- `apply(el, "nope")` throws `/theme/`; dataset unchanged.
- Duplicate `register(baseTheme)` throws `/already registered/`.
- `register({ id: "prism", title: "Prism", description: "x" })` then `list()` is base then prism; `apply(el, "prism")` stamps `prism`.

**Session**

- `createSession().theme.list()[0].id === "base"`.
- `setTheme("base")` after boot stamps via apply + writes prefs.
- `setTheme("nope")` throws `/theme/`; dataset unchanged; no write.
- Prefs `theme: "ghost"` → boot stamps `base`, does not write prefs.
- Missing prefs → stamp `base`, no write.
- `setTheme` / `getTheme` have **one** argument (name) / zero; TypeScript and tests must not pass a workspace node.
- `createSession({ defaultTheme: "prism" })` boot throws `/defaultTheme/` until `session.theme.register({ id: "prism", title: "Prism", description: "x" })`.
- Session object has no `registerTheme` / `themes` own properties.

**Theme contract / base CSS**

- Base `tokens.css` defines `[data-theme="base"]`, `color-scheme: light`, every new `CONTRACT_VARS` name.
- `--wallpaper` is `none` (no `url(`).
- `--radius-*` are `0`. `--blur` is `0px`.
- No geometry names. No `--glass`.
- Glass/prism **not** asserted this spec (leave files; drop or skip their contract tests so `npm test` is green).

**CSS graph**

- compositor/desktop/kit/navigator JS (or a small test) contains `@workshell/theme` import; their CSS does not contain `--glass`.
- `apps/session/src/main.ts` does not match `\\.css`.

**Settings**

- `createSettings(session).id === "settings"`.
- After `register` + `boot`/`createDesktop` + `engine.open("settings")`: `.panel-body` has `.nav`; address is `settings:/appearance`.
- List rows = `session.theme.list()` titles; click `base` calls `setTheme` (dataset `base`, prefs written).

**Desktop**

- Menu open lists Settings; click opens panel `settings`.
- After open, `[data-slot="menu"]` still has the Menu button.

`npx tsc --noEmit` clean. `npm test` green.

## Acceptance

1. `npm run dev` on this tree. Clear `workshell.layout.v1` **and** `workshell.prefs.v1` if leftover. Teal desktop, chiseled chrome, no photo, no blur. Menu → Settings.
2. Appearance shows **Base**. Reload: still base, prefs still **absent** until a `setTheme` (selecting the already-current row may write — **law:** `setTheme("base")` **does** write even if already base, so a first click materializes prefs; idle boot does not).
3. Console `session.setTheme("nope")` throws; desktop unchanged.
4. Console `session.setTheme("base")` writes prefs; reload stays base.
5. No Glass/Prism in the menu or Appearance until those modules are `session.theme.register`’d later.

José judges the classic look; tests cover catalog/API/guest door.

## What this spec does not achieve (named)

- Beautiful aetheris skins (intentionally stale until redone).
- Multi-page Settings.
- Keyboard-complete Menu / Appearance.
- Hot-load themes after boot.
- Overlay / per-token customization (engine door is `apply`; UI is later).
- A second DE.

## Proof holes

| Claim | Unproven here | Who trips |
|---|---|---|
| Menu / Appearance keyboard and a11y | Tests click | Next Settings pass |
| Register-after-boot theme or app | Law is before boot | Hot-load |
| Glass/prism vs new contract | Unregistered, tests skipped | Redo-skins spec |
| Overlay merge in `apply` | No overlay this spec | Customization spec |

## Open questions

None on the decisions above (José: catalog A then moved onto `@workshell/theme`; allowlist B; navigator B; package B; factory 1; Win32 prose A; engine + builtin `base` inside `@workshell/theme`; hive persist on session; token **names** standard dump; token **values** classic; `--glass*` retired; no bevel token names).
