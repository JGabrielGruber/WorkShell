# Workshell Settings Resource Spec Design

Date: 2026-09-10
Status: Approved in conversation (José: node spec is the truth; Appearance is a section; inspect only; write the spec)
Project: workshell (test prototype)

Depends on: OS vision (`docs/vision/os.md`), Settings + theme engine (`2026-09-09-workshell-settings-design.md`), navigator dynamic docks (`2026-09-09-workshell-navigator-dynamic-docks-design.md`), surface contract (`2026-09-09-workshell-surface-contract-design.md`).

This spec does **not** change compositor window modes, persist key `workshell.layout.v1`, layout `version: 2`, the 180 Hz pointer path, closed token **names**, hive key `workshell.prefs.v1`, `session.setTheme` / `getTheme` / `theme.apply` as APIs, kernel imports, or the `probe:` prefix. It does **not** ship tear-out, Desktop sub-section, color editing, create/duplicate themes, or “use this theme.”

---

## Goal

Settings stops painting an Appearance page. It contributes a **node spec** on `settings:`. Navigator **resolves** the URL to a node, **spawns** surfaces by **role**, and the **host** (three-dock navigator vs a window) decides which roles to mount. Appearance is a **section** with a Theme **sub-section**; catalog instances are dynamic children; selecting a theme shows **inspect** properties (Colors lists that theme’s pigment tokens). `setTheme` is not this form.

Success:

1. Menu → Settings still opens a navigator at `settings:/appearance`. Leading tree shows Appearance and Theme. Center is kit **icon view** of Theme’s sibling (this spec: Theme only under Appearance). Trailing is **empty**.
2. Open Theme: center lists `session.theme.list()` as default icons (title). Trailing still empty. Clicking an icon **navigates** to `settings:/appearance/theme/{id}` — it does **not** call `session.setTheme`.
3. At `settings:/appearance/theme/base` (and `.../base/colors`): center **stays** the catalog; trailing is a **tab host** whose only tab is Colors. Colors lists that theme’s `--color-*` tokens (name + value), read-only. `setTheme` / `theme.apply` are not invoked by this guest.
4. `spawn(url, host: "window")` at `.../base/colors` returns the Colors surface **only** (no tree, no catalog). Same node spec; different host.
5. Unknown `{id}` is not-found for detail; catalog listing still mounts. `theme.inspect` of an unknown id fails without applying a theme.

---

## Non-goals (this spec)

- Tear-out / dock ↔ panel drag
- Custom Theme icon renderer (specimens); node **may** override later
- Apply / Cancel, draft, preview-on-desktop
- `setTheme` / “use this theme” from Settings
- Editing token values; create / duplicate themes
- Desktop (or other) sub-sections under Appearance
- Field-hash focus (`#primary-color` is address law; Colors does not implement field chrome yet)
- Tabbed **rules** (multiple `ViewRule` names in one dock)
- Bottom dock, dock splitters
- Other apps contributing Settings nodes
- New CSS token names
- Push, force-push, kill Vite

---

## Product locks

- Pointer path, closed tokens, kernel isolation, no tribute names — still law.
- **URL names the node. Node spec is the truth. Hosts interpret roles.** Docks, drawers, modals, windows are hosts. Nodes do not say “trailing.”
- Path = resource. Fragment = **field** (not a tab). Tabs are **sibling nodes**; tab host is the **parent**.
- Properties (detail) exist only when the node is a **theme instance** or a **detail under it**. Sections and sub-sections have no detail.
- Expanded navigator: listing **and** detail. Compact: existing container-query list **or** detail (trailing sheet). Window: the node’s **own** surface.
- Navigator **spawns** surfaces; hosts mount them. Settings does not author three-column chrome.
- `probe:` keeps `views` + `rules`. Settings uses **graph**, not named Appearance factories.
- Session `setTheme` / hive persist **stay**. This guest does not call them.
- System nodes (Appearance, Theme, Colors kind) may be declared in Settings. Catalog instances are `session.theme.list()`.
- Kit default icon view for Theme listing. Escape hatch for a custom listing factory is allowed on the node type; unused here.

---

## Key decisions

| Decision | Rationale |
|---|---|
| Node spec, not view factories | Catalog and graph are data. A Settings-painted tree/icons/form is still layout. |
| Roles, not docks | Adaptive analogue and window hosts must not be path regex. |
| Appearance is a section | It will hold Theme **and** Desktop. Children of Appearance are sub-sections, not catalog ids. |
| Catalog under Theme | `settings:/appearance/theme/{id}`. Select a theme, then inspect it. |
| Four kinds this spec | Root/section, Theme sub-section, instance, Colors detail. |
| Default icon view | Distinct Theme tiles later. Listing stays kit icons. |
| Inspect only | Cannot edit a theme yet. `setTheme` on click was the mistake. |
| `theme.inspect(id)` | Colors must list tokens for a theme **without** applying it. |
| Tab host = parent of sibling details | A tab can become a window because it already has a path. |
| Hash preserved, fields later | `canonical` must not drop `#primary-color`. Colors ignores unknown hash. |
| Graph XOR prefix rules per scheme | Probe stays. Settings does not pile `matchRule` docks. |
| Tree = declared system nodes | Catalog instances are listing children, not hardcoded tree rows. Colors is a tab, not a tree row. |
| `spawn` is public | Window and tests call it. Settings’ panel is still a Navigator. |

---

## Relationship (amendments)

| Document | What this spec amends |
|---|---|
| Settings + theme engine (2026-09-09) | **Guest UI:** Appearance as `listView` + click `setTheme` **dies**. Engine, `base`, hive persist, `session.setTheme` **stay**. Initial URL may remain `settings:/appearance`. |
| Navigator dynamic docks | Empty docks / container queries / keep-alive **stay**. Non-goal “tabbed multi-surface docks” is **amended**: trailing may hold **one** detail occupant that is a **tab host** of spawned sibling surfaces. Still not N `ViewRule` names in one dock. |
| Surface contract | Default navigator views (tree, icons, tab host, page) are kit factories. `mount(el, ctx)` / `onUpdate` / `unmount` unchanged. |
| OS vision | Settings contributes a **graph**, not “registers views” as the only mechanism. First Appearance is **inspect**, not Apply/Cancel. Aimed interior (tree / icons / trailing or empty) **stands**. |

---

## Address law

```
settings:/appearance                         section
settings:/appearance/theme                   sub-section (listing = catalog)
settings:/appearance/theme/base              instance (tab host parent)
settings:/appearance/theme/base/colors       Colors (detail, tab of instance)
settings:/appearance/theme/base/colors#primary-color   field (later)
```

| Part | Meaning | Can be a window? |
|---|---|---|
| Path | node (tree / icon / tab / window) | yes |
| Fragment | field on that node’s page | no |

`canonical(url)` is `protocol + pathname + search + hash` (hash omitted when empty). History stores that string. Today’s drop-hash behavior **dies**.

Tab click **navigates** to the sibling path (`ctx.go`). It does not only toggle kit `aria-selected` while leaving the URL on the parent.

---

## Architecture

```
@workshell/settings
  createSettings(session)
    Navigator({ initialUrl: "settings:/appearance" })
    nav.register({ scheme: "settings", graph, kinds })
  graph: declared Appearance → Theme; Theme.children = catalog instances
  kinds: { "theme-colors": { detail: colorsPage } }

@workshell/navigator
  resolve(url, graph) → node + listing node + tree model
  spawn(...) → surfaces by role
  host "navigator": leading=tree, center=listing, trailing=detail|empty
  host "window": main = node's own surface
  default views: kit tree, kit iconView, kit tabs (as host), kit page
  views+rules registration remains for probe

@workshell/theme
  list / register / apply unchanged
  inspect(id) → pigment tokens for that id, no apply

@workshell/kit
  unchanged primitives; tab host uses tabs() with navigator go()
```

Hosts:

| Host | Mounts |
|---|---|
| Navigator, expanded | tree + listing + detail (detail empty ⇒ `data-empty` on trailing) |
| Navigator, compact | existing CQ: listing or detail sheet |
| Window | `main` only: section/sub-section → listing; instance → tab host; `tabOfParent` detail → that page |

Settings’ panel **this spec** is still a Navigator. Window spawn is **proven in tests** so a later desktop open of a colors URL does not invent a second Colors view.

---

## Node spec

```ts
export type NodeSpec = {
  segment: string;
  title: string;
  /** Leading tree. Default false. */
  tree?: boolean;
  /**
   * children — listing is this node's children (static or function).
   * parent — keep ancestor listing (theme instance).
   * none — no listing role.
   */
  listing?: "children" | "parent" | "none";
  /**
   * none — no detail (sections).
   * tabs — tab host of children with tabOfParent.
   * page — this node's detail surface (kind or default page).
   */
  detail?: "none" | "tabs" | "page";
  tabOfParent?: boolean;
  kind?: string;
  children?: NodeSpec[] | (() => NodeSpec[]);
};

export type KindHandlers = Record<
  string,
  {
    listing?: ViewFactory;
    detail?: ViewFactory;
  }
>;

export type AppRegistration = {
  scheme: string;
  views?: Record<string, ViewFactory>;
  rules?: ViewRule[];
  graph?: NodeSpec;
  kinds?: KindHandlers;
};
```

Normalize:

- `scheme` required.
- Either `graph` **or** (`views` and `rules`). Both → throw `/graph/`.
- Neither → throw `/views/`.
- `graph` present: no dock-name check against `views`.
- Probe registrations unchanged.

Root `segment` is `""` (pathname `/`). Child path is join of segments. Dynamic `children()` is called on resolve (sync). Namespace root is **not** a tree row (`tree` false). User nodes this spec: Appearance, Theme, `{id}`, Colors.

### Settings graph (this spec)

```
"" (scheme root: tree false, listing children, detail none)
  Appearance (appearance, tree, listing children, detail none)
    Theme (theme, tree, listing children, detail none)
      {id} from session.theme.list()  (listing parent, detail tabs, tree false)
        Colors (colors, tabOfParent, listing none, detail page, kind "theme-colors")
```

Instance `title` is `ThemeRegistration.title`. `segment` is `id`.

Tree model: walk nodes with `tree: true` (Appearance, Theme). Highlight the ancestor chain of the URL node. Catalog instances and Colors are **not** tree rows.

### Resolve

1. Parse href. Unknown scheme → no app (existing).
2. Walk `graph` by pathname segments. Missing instance segment → `node` is a **hole** under Theme (listing still Theme; detail is not-found).
3. `listingNode`: walk from node up until `listing === "children"` (skip `"parent"` and `"none"`).
4. `detailKind`:
   - section/sub-section (`detail` none) → no detail
   - instance (`tabs`) → tab host of `tabOfParent` children
   - `page` → kind handler `detail`, else empty kit page
   - hole → not-found page

### Spawn

`spawn(href | URL, opts: { host: "navigator" | "window"; graph; kinds; go; ... })` is exported from `@workshell/navigator`. Navigator docks call it with `host: "navigator"`. Tests (and a later window) call it with `host: "window"`.

Default factories (navigator, not Settings):

| Role | Factory |
|---|---|
| tree | kit `tree` of `tree: true` nodes; select → `go` that href |
| listing | kind `listing` if any; else kit `iconView` of listingNode children; select → `go` child href |
| detail (tabs) | kit `tabs`; each tab panel is `spawn` of that child **page**; active tab from URL (instance URL → first tab); tab button → `go` child href |
| detail (page) | kind `detail` or default `page` |
| not-found | kit `page` titled Not found |

Keep-alive: cache by **role + factory identity + listingNode/node id**, not by old view-name strings. `onUpdate` when the same surface stays.

Icon select and tree select only `go()`. No session theme writes.

---

## Theme inspect

`Theme` gains:

```ts
inspect(id: string): { colors: { token: string; value: string }[] };
```

Law:

- `id` must be in `list()`; else throw `/theme/`.
- Return the closed pigment list: every contract token whose name starts with `--color-`, in contract order.
- Values are the serialized CSS values for `[data-theme=id]` (for `base`, the literals in `packages/theme/src/base/tokens.css`).
- Must **not** call `apply` and must **not** change `data-theme` on `#workspace`.
- Extra skins later must satisfy the same inspect contract; this spec tests `base`.

Colors page (`kind: "theme-colors"`): kit `page` titled Colors; kit `listView` (or equivalent read-only rows) of `session.theme.inspect(id).colors` as `token` + `value`. `id` is the instance segment in the URL. No controls that write tokens. No Apply / Cancel.

---

## Guest change

`createSettings` **deletes** `appearanceView` as a center-only `listView` that calls `setTheme`.

```ts
nav.register({
  scheme: "settings",
  graph: settingsGraph(session),
  kinds: { "theme-colors": { detail: (ctx) => colorsPage(ctx, session) } },
});
```

`settingsGraph` closes over `session.theme.list` for instance children.

---

## Error handling

| Case | Behavior |
|---|---|
| Unknown theme id in path | Theme listing mounts; trailing/window detail is Not found. No throw out of `mount`. |
| `inspect` unknown id | throw `/theme/` (engine). Colors page is not called with a hole. |
| Theme with empty inspect colors | empty list, not a fake palette. |
| Unknown hash | keep in canonical; ignore for UI this spec. |
| Tab host with zero children | empty detail (should not happen: Colors is declared). |

---

## Testing

Navigator (graph):

- Register graph XOR rules; both throws `/graph/`.
- `settings:/appearance` and `.../theme`: spawn navigator → tree + listing, trailing empty (`data-empty`).
- `.../theme/base` and `.../theme/base/colors`: listing still catalog titles; trailing not empty; tab “Colors” present.
- Icon click / tab click push the instance or colors href; `setTheme` not called (spy).
- Window spawn at `.../theme/base/colors`: one surface, Colors list, no tree.
- Hole id: listing ok, not-found detail.
- `canonical` keeps `#primary-color`.

Theme:

- `inspect("base")` includes `--color-primary` (and the rest of `--color-*` contract names) with token file values.
- `inspect("base")` does not change an element’s `data-theme`.
- `inspect("nope")` throws `/theme/`.

Settings guest:

- `createSettings` register has `graph`, no `views.appearance`.
- Appearance tree labels include Appearance and Theme.
- Theme icons = `session.theme.list()` titles.
- Colors rows = `inspect` of that id.

No new compositor tests. Probe rules tests still pass.

---

## Out of this spec (explicit)

Desktop sub-section, custom Theme tiles, Apply/Cancel, `setTheme` from this guest, color write, create/duplicate, field-hash chrome, tear-out, other schemes using graph (allowed by the type; not built here).
