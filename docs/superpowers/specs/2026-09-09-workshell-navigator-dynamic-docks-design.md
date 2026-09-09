# Workshell Navigator Dynamic Docks Design

Date: 2026-09-09
Status: Approved / Implemented
Project: workshell (test prototype)

Depends on: OS vision (`2026-09-08-workshell-os-vision.md`), surface contract (`2026-09-09-workshell-surface-contract-design.md`), invariants (`docs/architecture/invariants.md`).

This spec does **not** change compositor window modes, persist key `workshell.layout.v1`, layout `version: 2`, the 180 Hz pointer-path law, or the closed theme token contract. It does not introduce tear-out (moving dock nodes to desktop panels), dock resize handles/splitters, or a bottom dock slot in this phase.

---

## Goal

Make [`@workshell/navigator`](file:///home/jgabrielgruber/Projects/Tests/workshell/packages/navigator) dynamic and responsive without violating the 180Hz pointer-path law or the closed token contract.

Success:

1. **Empty Dock Auto-Collapsing**: When a route rule does not specify a view for `leading` or `trailing`, the dock collapses cleanly, allowing `center` to claim the full width.
2. **Container-Queried Narrow Presentation**: Using CSS container queries on `.nav`, narrow host containers (e.g. mobile viewports, narrow panel sizes, or popped-out tabs) automatically adapt:
   - `leading` converts from a static column to an off-canvas **drawer**.
   - `trailing` converts from a column to an overlaid **detail sheet/modal**.
   - A drawer toggle button in the chrome becomes visible and toggles the drawer state via a data attribute (`data-open="true"`).
3. **Surface Keep-Alive & Reparenting**: Navigating between routes that share the same view in a dock does **not** destroy and recreate the view's DOM tree. The active DOM node is preserved and receives updated [`ViewContext`](file:///home/jgabrielgruber/Projects/Tests/workshell/packages/navigator/src/registry.ts#L3-L6), maintaining scroll position, form inputs, and tree selection.
4. **Enhanced ViewContext**: [`ViewContext`](file:///home/jgabrielgruber/Projects/Tests/workshell/packages/navigator/src/registry.ts#L3-L6) provides `back()`, `forward()`, `canGoBack`, `canGoForward`, and query parameters.

---

## Non-goals (this spec)

- Splitter/resize drag handles between docks (deferred to interactive resize spec).
- Tear-out (dragging a dock view out onto the desktop as a panel).
- Bottom dock slot (`"bottom"` dock).
- Tabbed multi-surface docks (multiple views sharing a single dock simultaneously).
- New theme tokens or ad-hoc CSS variables.

---

## Key Decisions

| Decision | Rationale |
|---|---|
| Auto-collapse via `data-empty="true"` attribute | Setting `data-empty="true"` on `.nav-dock` during route application allows deterministic CSS collapsing (`display: none`) without relying on `:empty` selector quirks with comments or whitespace. |
| Container Queries (`@container`) over Media Queries (`@media`) | Panels resize dynamically within the desktop shell. Breakpoints must respond to the **host panel's inline width**, not the OS window viewport. |
| Zero JS layout queries for responsive mode | Responsive layout switches occur purely in CSS via container queries. JS never reads `offsetWidth` or `getBoundingClientRect()`, preserving the 180Hz pointer-path law. |
| Cache DOM by `viewName` per Navigator instance | Instead of rebuilding all 3 docks on every route match, Navigator caches mounted `HTMLElement` instances. If the same view is assigned, the node is retained. |
| `SurfaceElement` update hook | A view factory can return an `HTMLElement` or optionally assign an `onUpdate?: (ctx: ViewContext) => void` property to receive subsequent navigation updates without DOM churn. |

---

## Architecture

### 1. DOM Structure

```
div.nav (container-type: inline-size)
├── div.nav-chrome
│   ├── button[data-nav="drawer-toggle"] (hidden in wide mode)
│   ├── button[data-nav="back"]
│   ├── button[data-nav="forward"]
│   └── div.ws-field (Address input)
└── div.nav-docks
    ├── div.nav-dock[data-dock="leading"][data-empty="true|false"][data-open="true|false"]
    ├── div.nav-dock[data-dock="center"][data-empty="true|false"]
    └── div.nav-dock[data-dock="trailing"][data-empty="true|false"][data-open="true|false"]
```

### 2. Auto-Collapsing Docks

In [`navigator.ts`](file:///home/jgabrielgruber/Projects/Tests/workshell/packages/navigator/src/navigator.ts):
```ts
for (const id of DOCKS) {
  const col = this.root.querySelector(`[data-dock="${id}"]`) as HTMLElement;
  const viewName = rule?.docks[id];
  if (app && viewName) {
    col.dataset.empty = "false";
    // mount or update cached surface
  } else {
    col.dataset.empty = "true";
    col.replaceChildren();
  }
}
```

In [`navigator.css`](file:///home/jgabrielgruber/Projects/Tests/workshell/packages/navigator/src/navigator.css):
```css
.nav-dock[data-empty="true"] {
  display: none;
}
```

When `trailing` is not specified by the active route (e.g. `probe:/`), it takes `0px` width, and `center` expands to the full remaining width.

---

### 3. Container Queries & Narrow Presentation

In [`navigator.css`](file:///home/jgabrielgruber/Projects/Tests/workshell/packages/navigator/src/navigator.css):
```css
.nav {
  container-type: inline-size;
  position: relative;
}

/* Default (wide mode) */
[data-nav="drawer-toggle"] {
  display: none;
}

/* Narrow Presentation: container width <= 600px */
@container (max-width: 600px) {
  [data-nav="drawer-toggle"] {
    display: inline-flex;
  }

  .nav-docks {
    position: relative;
    overflow: hidden;
  }

  /* Leading dock as an off-canvas drawer */
  .nav-dock[data-dock="leading"] {
    position: absolute;
    inset: 0 auto 0 0;
    width: min(80%, 280px);
    z-index: 20;
    background: var(--color-base-200);
    box-shadow: var(--shadow);
    transform: translateX(-100%);
    transition: transform 160ms cubic-bezier(0, 0, 0.2, 1);
  }

  .nav-dock[data-dock="leading"][data-open="true"] {
    transform: translateX(0);
  }

  /* Trailing dock as an overlay detail sheet */
  .nav-dock[data-dock="trailing"] {
    position: absolute;
    inset: 0 0 0 auto;
    width: 100%;
    z-index: 30;
    background: var(--color-base-100);
    transform: translateX(100%);
    transition: transform 160ms cubic-bezier(0, 0, 0.2, 1);
  }

  .nav-dock[data-dock="trailing"]:not([data-empty="true"]) {
    transform: translateX(0);
  }
}
```

---

### 4. Surface Keep-Alive & Reparenting Contract

#### Updated `ViewContext`
```ts
export type ViewContext = {
  url: URL;
  params: Record<string, string>;
  query: URLSearchParams;
  go: (href: string) => void;
  back: () => void;
  forward: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
};
```

#### Surface Lifecycle
Views may optionally implement `onUpdate` to handle route updates without DOM replacement:

```ts
export type SurfaceElement = HTMLElement & {
  onUpdate?: (ctx: ViewContext) => void;
};

export type ViewFactory = (ctx: ViewContext) => SurfaceElement;
```

#### Mounting Strategy in `Navigator.prototype.apply`
1. Maintain `private readonly surfaceCache = new Map<string, SurfaceElement>()`.
2. For each dock `id`:
   - If `viewName` matches the view currently residing in `col`:
     - Keep the node in place.
     - Call `surface.onUpdate?.(ctx)`.
   - If `viewName` is different:
     - Retrieve existing surface from `surfaceCache.get(viewName)` or invoke `app.views[viewName](ctx)` to create it and cache it.
     - `col.replaceChildren(surface)`.
     - Call `surface.onUpdate?.(ctx)`.
   - If no `viewName`:
     - Empty dock with `col.replaceChildren()`.
     - Mark `col.dataset.empty = "true"`.

---

## Verification Plan

### Automated Tests
1. **Empty Dock Auto-Collapsing**:
   - Mount Navigator at `probe:/`. Confirm `[data-dock="trailing"]` has `data-empty="true"`.
   - Navigate to `probe:/fields`. Confirm `data-empty="false"`.
   - CSS test confirming `data-empty="true"` has `display: none`.
2. **Container Query & Drawer Toggle**:
   - Verify `[data-nav="drawer-toggle"]` exists and toggles `data-open` on the leading dock.
   - Navigate: clicking a link inside the drawer sets `data-open="false"` to auto-dismiss on small screens.
3. **Surface Keep-Alive**:
   - Register a tree view in `leading`.
   - Navigate `/` -> `/fields` -> `/tabs`.
   - Assert `leading` DOM identity (`col.firstElementChild === cachedNode`) is preserved across all transitions.
   - Verify input focus or uncommitted form text in `leading` is not wiped out on navigation.
4. **ViewContext API**:
   - Test `ctx.back()`, `ctx.forward()`, and `ctx.query`.
