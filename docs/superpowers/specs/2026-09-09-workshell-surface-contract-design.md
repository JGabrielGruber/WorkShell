# Workshell Surface Contract Design

Date: 2026-09-09
Status: Approved in conversation (José: probe prefix; frozen tokens; self-style kit; write the plan)
Project: workshell (test prototype)

Depends on: window manager (`2026-09-07-workshell-window-manager-design.md`), desktop shell (`2026-09-07-workshell-desktop-shell-design.md`), package carve (`2026-09-07-workshell-package-carve-design.md`), card-open (`2026-09-08-workshell-card-open-windows-design.md`), theme contract (`2026-09-08-workshell-theme-contract-design.md`), OS vision (`2026-09-08-workshell-os-vision.md`).

This spec does **not** change window modes, persist key `workshell.layout.v1`, layout `version: 2`, the 180 Hz pointer path, `createDesktop` / `boot()` shape, `WorkspaceEngine.open()`, or `setTheme` (attribute stamp). It does not add Settings, a widget registry, narrow presentation as a mode, or daisyUI as a package.

It is dogfood **1** in the vision: the vertical spine. Horizontal organs (Settings, registry, product apps) hang off it later.

## Goal

A **closed form kit** and a **navigator** that hosts kit surfaces, painted only from the existing theme contract, proven by a throwaway **`probe:`** prefix — not Settings.

Success:

1. A kit page is a factory `() => HTMLElement`. The same factory fills a navigator trailing dock and, in tests, a second host node. The Probe **window** still reparents through compositor `mount()` without destroying the navigator root. This spec does **not** move a live dock node onto the desktop (tear-out).
2. Glass → Prism restyles kit and navigator chrome because they consume tokens, not because the probe has pigment.
3. A second prefix can `register()` without editing `@workshell/desktop-shell` or `@workshell/compositor`.
4. The probe looks like a system with **no probe-specific CSS file**.

## Non-goals (this spec)

- Settings (namespace, prefs, glass switch, widget enablement) — dogfood 2
- Widget registry as a product; today's `fillWidgetLayer` / `fillPanelBody` stay
- Overlay kit (alert / confirm / snackbar) and `#overlay-host` usage
- Narrow presentation as a runnable mode (phone, kiosk, popped-out tab)
- Tear-out (dock ↔ panel drag), follow/pin chrome, extra bars, bottom dock
- Navigator dock resize
- Theme persist, hue crayon box, daisyUI / Tailwind inside kit or navigator
- New theme tokens (kit recipes compose the closed list already shipping)
- Angular `apps/spa`, product URLs, conversations
- Changing persist key or `version: 2`
- Pointer-path work (`getBoundingClientRect` / persist / class toggles on `pointermove`)
- Replacing the kanban / TASK-* demo; they stay stand-ins

## Product locks (still in force)

- Interactive **shell-demo first**.
- Later spa is Angular `apps/spa` on `createDesktop` / `boot()`.
- Board stays a widget: cards `data-task-id` → `open(id, { title })`.
- Geometry is not a skin. Glass is an optional **effect**, not a theme name.
- A slot, widget kind, or API appears when something real has nowhere to land. This spec lands the spine because Settings has nowhere to put a page.

## Key decisions

| Decision | Rationale |
|---|---|
| One spec, three packages of law: tokens (existing), `@workshell/kit`, `@workshell/navigator` | Spine is one contract. Packages keep kit from knowing URLs and navigator from owning controls. |
| Probe prefix only (`probe:`) | Settings as guest would author the kit as a preferences UI. |
| Token list frozen | Necessary complexity is primitives, hosts, view rules — not a second crayon box. Recipes must work on Glass and Prism as they are. |
| Keep shipped `--glass*` names | Theme-contract **design** said `--surface*`; **code and tests** ship `--glass*`. Vision: glass is an effect. Do not churn shell.css in this spec. |
| Kit does not use `--glass` / `--glass-card` / `--glass-blur` | Probe sits *inside* an already-glassed panel. Nested blur is mud. Kit uses `--color-base-*`. `--glass-border` is also off-limits in kit (shell hairline, not a field role). Field chrome uses `--color-base-300` + `--border`. |
| Navigator docks ≠ compositor `dock()` / `slot()` | Window-manager left/center/right stay unused by production chrome. Navigator docks are DOM columns inside a panel body. |
| Desktop-shell does not import kit or navigator | Proof that a second prefix does not edit the OS. Demo (later: Settings app) imports them. |
| `dialogFrame` is chrome, not an overlay service | Overlay kit is a later organ. |
| Demo seed gains a `probe` panel | Acceptance is a load, not a hidden gesture. TASK-104 and kanban remain. |

## Architecture

```
apps/shell-demo
  imports desktop-shell, both theme CSS, kit, navigator
  fillPanelBody("probe") → Navigator + register(probeApp)
  fillPanelBody(other)   → existing TASK-* windows
  fillWidgetLayer        → kanban (unchanged)

@workshell/navigator
  address, history, view rules, three docks
  chrome CSS (layout + tokens)
  does not create tree/field/tab nodes itself

@workshell/kit
  primitives + kit.css recipes
  no URLs, no history, no theme packages

@workshell/theme-aetheris-glass | prism
  closed token list — unchanged names

@workshell/desktop-shell
  places: wallpaper, bar, panel chrome, boot()
  ignorant of probe: and of kit class names

@workshell/compositor
  windows, persist, mount(), open()
  ignorant of URLs
```

Runtime depends inward:

```
demo → navigator → (DOM hosts only)
demo → kit
demo → desktop-shell → compositor
demo → theme CSS
```

Navigator may import kit **only** for its address field and back/forward buttons (those *are* kit controls). It must not import a probe module. Probe lives in the demo.

### Naming

| Word | Meaning here |
|---|---|
| kit | form primitives + recipes |
| page | one kit form (title + body) |
| navigator | address, history, view rules, docks |
| dock | navigator column: `leading` \| `center` \| `trailing` |
| slot | compositor window-manager slot (`left` \| `center` \| `right`) — not this spec's docks |
| surface | a DOM node a dock or a panel body can hold |
| probe | throwaway guest scheme `probe:` |
| glass | compositor/shell effect tokens `--glass*` |

Do not call navigator docks “slots” in code or tests.

## Theme contract (delta)

The closed list in `packages/themes/contract.test.ts` **does not grow**. Both skins already define every name. Kit and navigator consume it.

Shipped names (law):

- Surfaces: `--color-base-100` / `200` / `300` / `--color-base-content`
- Brand + status pairs as today
- Effect: `--glass`, `--glass-card`, `--glass-border`, `--glass-blur`
- Type: `--font-sans`, `--font-display`, `--font-mono`
- Shape: `--radius-box`, `--radius-field`, `--radius-selector`, `--border`
- `--wallpaper`, `color-scheme`

Muted ink remains `color-mix` / alpha on `--color-base-content`, not a new role.

### Kit recipes (the self-style)

All in `packages/kit/src/kit.css`. No hex, no `rgb()`, no `hsl()` except `transparent`. No `--taskbar-*`, `--left-w`, `--right-w`. No `--glass*`.

| Role | Recipe |
|---|---|
| Page / tree / list ground | `background: var(--color-base-200)`; `color: var(--color-base-content)`; `font-family: var(--font-sans)` |
| Page title | `font-family: var(--font-display)` |
| Field fill | `background: var(--color-base-100)`; `border: var(--border) solid var(--color-base-300)`; `border-radius: var(--radius-field)` |
| Tree/list row hover | `background: var(--color-base-300)` |
| Selected row | `background: color-mix(in srgb, var(--color-primary) 35%, var(--color-base-200))`; ink `--color-base-content` |
| Focus visible | `outline: 2px solid var(--color-primary)`; `outline-offset: 2px` |
| Disabled | `opacity: 0.45`; `pointer-events: none` |
| Primary button | `background: var(--color-primary)`; `color: var(--color-primary-content)`; `border-radius: var(--radius-field)` |
| Neutral button | `background: var(--color-base-300)`; `color: var(--color-base-content)` |
| Danger button | `background: var(--color-error)`; `color: var(--color-error-content)` |
| Tabs | `--radius-selector` on the list; active tab `background: var(--color-base-100)` |
| Dialog frame | `--radius-box`; ground `--color-base-100`; titlebar ink as page title |
| Icon tile | `--radius-box`; `--color-base-100` fill |

Navigator chrome (`.nav-chrome`, docks) uses the same base/content/border recipes in `navigator.css`. Address field **is** a kit `field()`, not a one-off input.

`setTheme` stays: stamp `#workspace[data-theme]`. Kit/navigator CSS is descendant of that. No per-control `data-theme`.

## Package `@workshell/kit`

```
packages/kit/
  package.json          @workshell/kit, private, source export
  src/kit.css
  src/index.ts
  src/button.ts
  src/field.ts
  src/tree.ts
  src/list.ts
  src/icons.ts
  src/tabs.ts
  src/page.ts
  src/dialog.ts
  src/*.test.ts
  tsconfig.json
```

`package.json` exports:

- `"."` → `./src/index.ts`
- `"./kit.css"` → `./src/kit.css`

Vanilla TypeScript + CSS. No Tailwind. No dependency on desktop-shell, compositor, navigator, or theme packages.

Each primitive: create DOM, return the root `HTMLElement`. Callers append or `mount()`. Destroy is “drop the node” unless a later spec adds teardown.

Class prefix: `ws-`. Roles via `role` / `aria-*`, not a second class language.

### Closed primitive set

#### `button`

```ts
type ButtonKind = "primary" | "neutral" | "danger";
type ButtonOpts = {
  label: string;
  kind?: ButtonKind; // default "neutral"
  disabled?: boolean;
  onClick?: () => void;
};
function button(opts: ButtonOpts): HTMLButtonElement;
```

`type="button"`. Class `ws-btn` + `ws-btn-primary` \| `ws-btn-neutral` \| `ws-btn-danger`.

#### `field`

```ts
type FieldOpts = {
  name: string;
  label: string;
  kind?: "text" | "checkbox"; // default "text"
  value?: string | boolean;
  disabled?: boolean;
  onChange?: (value: string | boolean) => void;
};
function field(opts: FieldOpts): HTMLElement; // wrapper .ws-field
```

Label associated with the control (`htmlFor` / `id`). Text uses `<input type="text">`. Checkbox uses `<input type="checkbox">`. No select, textarea, radio, or file in this spec.

Always a visible label. No `bare` flag. Navigator address is `field({ name: "address", label: "Address", value })` sitting in `.nav-chrome` as a flex/grid child beside the history buttons.

#### `tree`

```ts
type TreeNode = { id: string; label: string; children?: TreeNode[] };
type TreeOpts = {
  nodes: TreeNode[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
};
function tree(opts: TreeOpts): HTMLElement;
```

`role="tree"` / `treeitem`, `aria-selected`. Click selects and calls `onSelect`. No expand/collapse persistence; if `children` exist, they render expanded. Nested depth is visual indent only.

#### `listView`

```ts
type ListItem = { id: string; label: string };
type ListOpts = {
  items: ListItem[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
};
function listView(opts: ListOpts): HTMLElement;
```

`role="listbox"` / `option`. Single select.

#### `iconView`

```ts
type IconItem = { id: string; label: string; group?: string };
type IconOpts = {
  items: IconItem[];
  onSelect?: (id: string) => void;
};
function iconView(opts: IconOpts): HTMLElement;
```

Grouped tiles. Group header is text (`font-display` or sans at smaller size). No image assets; a CSS tile is enough. `role="list"` / `listitem`.

#### `tabs`

```ts
type Tab = { id: string; label: string; panel: HTMLElement };
type TabsOpts = { tabs: Tab[]; activeId?: string };
function tabs(opts: TabsOpts): HTMLElement;
```

`role="tablist"` / `tab` / `tabpanel`. Switching tabs does not touch URLs. The caller owns any URL mapping.

#### `page`

```ts
type PageOpts = { title: string; body: HTMLElement };
function page(opts: PageOpts): HTMLElement; // .ws-page
```

Title + body. This is the form chrome a trailing dock or a panel body holds.

#### `dialogFrame`

```ts
type DialogOpts = { title: string; body: HTMLElement; actions?: HTMLElement };
function dialogFrame(opts: DialogOpts): HTMLElement; // .ws-dialog
```

Looks like a dialog. It is **not** `showModal()`, not focused-trap, not `#overlay-host`. It is a kit surface so Settings-later can `mount()` the same node into overlay or a dock without a second frame.

### Kit tests

- `kit.css` contains no `#` hex, no `rgb(`, no `hsl(` except as inside `color-mix` / `transparent`. Every pigment is `var(--…)`.
- `kit.css` does not contain `--glass`, `--taskbar-h`, `--left-w`, `--right-w`, `--wallpaper`.
- Each factory returns a node with the documented `role` / class.
- `field` associates label; disabled field has `disabled` on the control.
- `tree` / `listView` call `onSelect` with the id.
- `tabs` shows only the active panel (`hidden` on inactive `tabpanel`).

## Package `@workshell/navigator`

```
packages/navigator/
  package.json          @workshell/navigator
  src/navigator.css
  src/index.ts
  src/history.ts
  src/registry.ts
  src/navigator.ts
  src/*.test.ts
  tsconfig.json
```

Exports `"."` → `./src/index.ts`, `"./navigator.css"` → `./src/navigator.css`.

Depends on `@workshell/kit` (address field, back/forward `button()`s). Does not depend on desktop-shell or compositor.

### DOM

`new Navigator(host, { initialUrl })` replaces `host` children with:

```
.nav
  .nav-chrome
    [back button]
    [forward button]
    [kit field: Address]
  .nav-docks
    .nav-dock[data-dock="leading"]
    .nav-dock[data-dock="center"]
    .nav-dock[data-dock="trailing"]
```

Back/forward: kit `button({ kind: "neutral" })`, `aria-label` Back / Forward, `disabled` at history ends.

Docks are a horizontal flex row. Leading flex `0 0 220px`, trailing `0 0 280px`, center `1 1 auto`. These lengths live in `navigator.css` on `.nav`, **not** in theme packages and **not** as `--left-w` (compositor). No resize handle this spec.

Empty dock: no children, still occupies its column (trailing empty at `probe:/`). Do not `display: none` the trailing column — the spine is three hosts. (Narrow presentation may hide columns later; not here.)

### URL and history

Hrefs are absolute with scheme, e.g. `probe:/fields`. Parse with `new URL(href)`. Invalid URL: `go` returns without changing state.

```ts
class UrlHistory {
  readonly entries: string[];
  index: number;
  push(href: string): void; // truncate forward stack
  back(): string | null;
  forward(): string | null;
}
```

`go(href)`:

- Normalize via `url.href` (or `protocol + pathname` if search/hash unused — **drop search and hash this spec**; probe has none).
- If equal to current, no-op (do not push).
- Else push and apply view rules.

`back` / `forward` apply rules, do not push.

### Registry and view rules

```ts
type DockId = "leading" | "center" | "trailing";

type ViewContext = {
  url: URL;
  go: (href: string) => void;
};

type ViewFactory = (ctx: ViewContext) => HTMLElement;

type ViewRule = {
  /** pathname prefix, longest match wins. "/" matches everything under the scheme. */
  path: string;
  docks: Partial<Record<DockId, string>>;
};

type AppRegistration = {
  scheme: string; // "probe" — no colon
  views: Record<string, ViewFactory>;
  rules: ViewRule[];
};

class Navigator {
  readonly root: HTMLElement;
  constructor(host: HTMLElement, opts: { initialUrl: string });
  register(app: AppRegistration): void;
  go(href: string): void;
  back(): void;
  forward(): void;
  get url(): URL;
}
```

Constructor builds chrome, sets history to `[initialUrl]`, docks empty. It does not apply views until the matching scheme is registered.

`register`:

- `scheme` empty throws `/scheme/`.
- Duplicate `scheme` throws `/already registered/`.
- Unknown view name in a rule throws `/unknown view/` at register time, not at `go`.
- Sort that app's rules by `path.length` descending so array order is not load-bearing.
- If `url.protocol === scheme + ":"`, apply the current href (do not push).

`go` / apply:

- Scheme with no registration: no-op (history also not pushed).
- Path match: `pathname === path || pathname.startsWith(path + "/")`. Longest matching `path` wins. `/fields` does not match `/fieldsx`. `path: "/"` matches every pathname.
- For each dock, if the rule names a view: `replaceChildren` with `views[name](ctx)`. If the rule omits the dock: `replaceChildren()` (empty).
- Rebuild docks on every apply. Factories are cheap. Do **not** invent a keep-alive cache this spec. Host-agnostic proof is calling the page factory twice in tests, not moving a live dock node.

Address field: after apply, set the input value to a display href `probe:/fields` (scheme + pathname). Enter reads the input and `go()`.

### Navigator tests

- `register` + `go("probe:/")` fills leading+center, empties trailing, per a fixture app.
- `go("probe:/fields")` fills trailing with the named view.
- Longest prefix wins; `/fields` does not match `/fieldsx`.
- `back` / `forward` restore href and docks; buttons `disabled` at ends.
- Duplicate scheme throws.
- Unknown scheme `go` is a no-op; url unchanged.
- Invalid href no-op.
- `navigator.css` same pigment rule as kit: no hex, no `--glass*`.

## Probe guest (demo only)

Scheme `probe`. Not a package. Lives under `apps/shell-demo/src/probe/`.

### Graph (in-memory)

```
/                 Probe
  /fields         Fields
  /tabs           Tabs
  /list           List
  /dialog         Dialog
```

Tree `id`s are pathnames (`/`, `/fields`, …). `onSelect` → `ctx.go("probe:" + id)` with `id` already starting `/`.

### Views

| View name | Factory | Built from |
|---|---|---|
| `probe-tree` | tree of the graph, `selectedId = url.pathname` | `tree` |
| `probe-icons` | icon tiles of the **root children** (Fields, Tabs, List, Dialog), one group `"Kit"`; `onSelect` → `ctx.go("probe:" + id)` | `iconView` |
| `probe-fields` | `page({ title: "Fields", body })` with text, checkbox, disabled text, a primary button that does not navigate | `page`, `field`, `button` |
| `probe-tabs` | `page` whose body is `tabs` with two panels (plain text nodes are allowed inside tab panels) | `page`, `tabs` |
| `probe-list` | `page` whose body is `listView` of four dummy rows | `page`, `listView` |
| `probe-dialog` | `page` whose body is `dialogFrame` with a neutral and a primary action (actions need not close anything) | `page`, `dialogFrame`, `button` |

### Rules

```ts
const probeApp: AppRegistration = {
  scheme: "probe",
  views: { /* names above */ },
  rules: [
    { path: "/fields", docks: { leading: "probe-tree", center: "probe-icons", trailing: "probe-fields" } },
    { path: "/tabs",   docks: { leading: "probe-tree", center: "probe-icons", trailing: "probe-tabs" } },
    { path: "/list",   docks: { leading: "probe-tree", center: "probe-icons", trailing: "probe-list" } },
    { path: "/dialog", docks: { leading: "probe-tree", center: "probe-icons", trailing: "probe-dialog" } },
    { path: "/",       docks: { leading: "probe-tree", center: "probe-icons" } },
  ],
};
```

Rule array order in the demo need not be sorted; `register` sorts by path length.

### Seed and `fillPanelBody`

Demo `seedLayout` adds panel `probe`:

- `title: "Probe"`
- `mode: "float"`
- rect = `DEFAULT_FLOAT` offset by `CASCADE_PX` on x and y (so it does not sit on TASK-104)
- `z` above TASK-104; bump `nextZ`

`KNOWN_IDS` / `PANEL_META` in demo include `probe`. Compositor persist already accepts unknown ids; no persist change.

CSS load order (demo `main.ts`, once): compositor, shell, both theme tokens, `kit.css`, `navigator.css`, `demo.css`. Neither kit nor navigator `@import`s the other. An app that uses them must import both.

`fillPanelBody(id, el)`:

- `id === "probe"` → `new Navigator(el, { initialUrl: "probe:/" })` → `register(probeApp)`
- else existing TASK-* fill

Kanban unchanged. Theme switcher unchanged.

Do **not** add `apps/shell-demo/src/probe/probe.css`.

### Host-agnostic proof (test, not a second seed window)

A kit test (or demo test) calls `fieldsPage()` (the trailing factory body, extracted so it is `() => HTMLElement` without needing `ViewContext` for the page itself).

Probe view factories that need `go` close over `ctx`. Page factories that do not navigate take **no** `ctx`:

```ts
function fieldsPage(): HTMLElement { /* page(...) */ }

const views = {
  "probe-fields": () => fieldsPage(),
  // ...
};
```

Test: append `fieldsPage()` to `div#a` and to `div#b`. Both have `.ws-page`. Ancestor `[data-theme]` restyles both. That is the second host. A floating “Fields” window is **not** required in the demo this spec.

## File ownership (CSS)

| File | Owns |
|---|---|
| `themes/*/tokens.css` | Closed variables only (unchanged) |
| `desktop-shell/shell.css` | Desktop places, panel chrome, bar; may use `--glass*` |
| `compositor/compositor.css` | Mechanical window geometry |
| `kit/kit.css` | Primitive recipes |
| `navigator/navigator.css` | `.nav` layout + chrome recipes (no `--glass*`) |
| `demo.css` | Kanban / TASK-* only; **no** `.ws-*` or `.nav-*` overrides |

## Pointer path

Unchanged. Kit and navigator do not read layout geometry on `pointermove`. Tab/tree clicks are commit-clock.

## Boot / persist

Unchanged APIs. Existing `localStorage` without a `probe` panel keeps TASK-104 only until the user clears seed (README already says clear to restore). New loads get both windows. Do not migrate old layouts.

## Tests (workspace)

- Existing compositor / persist / chrome / theme contract / kanban / open tests stay green.
- New kit + navigator unit tests as above (happy-dom).
- Demo: `fillPanelBody("probe")` produces `.nav` with three `[data-dock]` and a tree. Clicking a tree item with id `/fields` (simulate) results in `.ws-page` in trailing (may be a demo test with a mounted navigator).
- Theme contract test still lists the same `CONTRACT_VARS`. No wallpaper file-existence assertion required (images are local-only / gitignored).

## Acceptance (demo)

1. Fresh load (clear `workshell.layout.v1`): wallpaper, kanban, TASK-104, **Probe** window with navigator chrome, tree, icon tiles, empty trailing.
2. Click **Fields** in the tree or icon view: trailing shows the Fields page (text, checkbox, disabled field, primary button). Address reads `probe:/fields`. Back returns to empty trailing.
3. Tabs / List / Dialog similarly. Tabs switch panels without changing the URL unless we click tree — URL stays `/tabs` while inner tabs move.
4. Taskbar **Prism**: probe tree, fields, buttons, navigator chrome, and TASK-104 all follow. **Glass** reverses. Reload returns to glass; layout persist still `workshell.layout.v1`.
5. Kanban card still `open`s TASK-* windows. Probe is not a card.
6. Drag / maximize / hide Probe as any panel; body is still the same navigator node (`uid` stable while live).

README: one acceptance bullet for the Probe window and Glass/Prism restyle of kit.

## What this spec does not achieve (named)

These stay vision “later” or dogfood 2+. Do not sneak them into the PR that implements this document.

| Organ | Why not now |
|---|---|
| Settings | First real guest; must consume this spine, not define it |
| View keep-alive / `mount()` of a dock node into a panel | Tear-out; factories rebuild per `go` |
| Overlay kit | Fourth layer |
| Narrow presentation | Host-agnostic factories are the principle; the mode is later |
| Follow / pin | Binding chrome |
| Extra bars, bottom dock, dock resize | Places we do not have a need for |
| Token growth, theme persist | Contract stays closed |
| Widget registry | Fills remain demo callbacks |
| Second registered scheme in the demo | The **API** allows it; the demo does not ship one |

## Proof holes (after dogfood 1)

Landed on `feat/surface-contract` (2026-09-09). The spine is in the tree; these rows are **claimed by this spec and not locked by tests**. They are not new organs and not open questions. A later session without this chat should read this table before writing Settings (or any second guest). Do not “fix” them by growing tokens, editing desktop-shell/compositor, or adding `probe.css`.

| Claim (this spec) | Unproven | Who trips |
|---|---|---|
| Field fill recipe (`--color-base-100` + `--border` + `--color-base-300` + `--radius-field`) | CSS only styles `input[type="text"]`. Checkbox is UA chrome. | Settings boolean fields |
| Icon group header is `font-display` or smaller sans | `.ws-icon-group` has no type rule | Settings icon dock labels |
| Navigator chrome / docks use base/content/**border** recipes | `.nav-chrome` and `.nav-dock` are layout-only (no hairline) | Settings docks share one ground |
| Click selects (`aria-selected` moves) | Tree/list call `onSelect` only; paint is construct-time `selectedId`. Consumer must rebuild. | A Settings tree that keeps the same node |
| Path match `startsWith(path + "/")` | Tests cover `/fields` vs `/fieldsx` vs `/`, not `/fields/x` | Nested Settings pages |
| Address Enter → `go()`; Back/Forward restore href **and docks** | Navigator tests call `nav.go` / `nav.back`; probe `mount.test` never presses Enter or Back | Settings address bar and history buttons |
| `ViewContext.go` is Navigator `go` | Fixture views ignore `ctx` | A Settings tree that navigates via `ctx.go` |
| Drop search/hash; equal-current `go` is no-op | `canonical` exists; untested | Settings `?tab=` / `#hash` |
| `fieldsPage` host-agnostic **and** restyles from `[data-theme]` | Two parent nodes get `.ws-page`; neither is under `#workspace[data-theme]`. Glass→Prism of kit is acceptance-only. | Settings page in a themed host |
| Field `id` is `ws-field-${name}` | Two live `fieldsPage()` (or two Address fields) collide in one document | A second host of the same factory |
| `fillPanelBody("probe")` on boot; tree **and** icons; Back after Fields | `mountProbe(div)` only: tree present, first `[data-id="/fields"]` (leading), no icons assert, no Back, no `createDesktop` fill | Dropping the `probe` branch in `main.ts` would not fail these tests |
| Empty trailing still occupies 280px | CSS has no `display: none`; test does not forbid it | Two-dock Settings still owes a trailing column |
| Kit/navigator under `.panel-body:not(:has(.inspector))` | `.nav { height: 100% }` never mounted in panel chrome in tests | Settings in a real panel (padding + overflow vs 100% height) |
| Existing `workshell.layout.v1` without `probe` | Seed test calls `seedLayout()` in memory only | A Settings window will not appear until persist is cleared (same rule as Probe; untested) |

Rebuild-per-`go` and “demo ships only `probe:`” stay in **What this spec does not achieve**. Do not promote them into this table.

## Relationship to existing specs

| Spec | Still the law for |
|---|---|
| Window manager | modes, persist, clocks, `mount()`, no pointer-path layout work |
| Desktop shell | layer tree, bar island, panel chrome, `boot()` |
| Package carve | compositor / desktop-shell / themes / demo; demo owns content; Angular later on the same door |
| Card-open windows | `open(id, { title })`; board is a widget |
| Theme contract | two skins, closed tokens, session-only switcher, no daisyUI package |
| OS vision | aim; this document **is** the next spec it pointed at |

This document does not supersede them. It adds kit + navigator + probe, and freezes `--glass*` as the shipped effect names.

## Open questions

None on the decisions (probe prefix, frozen tokens, self-style kit, Settings is the next organ). Proof holes after landing are named above — not reopened choices.
