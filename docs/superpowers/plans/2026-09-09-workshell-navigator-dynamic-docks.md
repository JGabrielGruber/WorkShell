# Dynamic Navigator Docks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement dynamic dock behavior in [`@workshell/navigator`](file:///home/jgabrielgruber/Projects/Tests/workshell/packages/navigator): automatic collapsing of empty docks, CSS container query responsive mode (drawer/detail presentation for narrow hosts), enhanced `ViewContext`, and surface keep-alive/caching across route transitions.

**Architecture:** Enhances [`@workshell/navigator`](file:///home/jgabrielgruber/Projects/Tests/workshell/packages/navigator) without breaking package boundaries. Pure CSS container queries on `.nav` (`container-type: inline-size`) guarantee zero layout querying in JavaScript, strictly preserving the 180Hz pointer-path law. Surface caching retains active DOM nodes between route updates.

**Tech Stack:** TypeScript, Vitest + happy-dom, vanilla CSS with semantic theme tokens from `@workshell/theme`.

**Spec:** [`docs/superpowers/specs/2026-09-09-workshell-navigator-dynamic-docks-design.md`](file:///home/jgabrielgruber/Projects/Tests/workshell/docs/superpowers/specs/2026-09-09-workshell-navigator-dynamic-docks-design.md)

---

## File Map

| File | Responsibility |
|---|---|
| `packages/navigator/src/registry.ts` | Updated `ViewContext` type (`back`, `forward`, `canGoBack`, `canGoForward`, `query`, `params`), `SurfaceElement` type |
| `packages/navigator/src/navigator.ts` | Dock `data-empty` stamping, drawer toggle button, surface caching map, `onUpdate` lifecycle invocation |
| `packages/navigator/src/navigator.css` | `.nav` container query, `.nav-dock[data-empty="true"]` collapsing, drawer and detail responsive overlays |
| `packages/navigator/src/navigator.test.ts` | Unit tests for empty dock collapsing, surface keep-alive, drawer toggle, and extended `ViewContext` |
| `packages/navigator/src/navigator.css.test.ts` | CSS invariant assertions: no hex/glass, verifies container query and `data-empty` rules |
| `docs/superpowers/STATUS.md` | Track active status |

---

### Task 1: Auto-Collapsing of Empty Docks

**Files:**
- Modify: `packages/navigator/src/navigator.ts`
- Modify: `packages/navigator/src/navigator.css`
- Modify: `packages/navigator/src/navigator.test.ts`
- Modify: `packages/navigator/src/navigator.css.test.ts`

- [x] **Step 1: Update `navigator.css` with auto-collapsing rules**
  Add:
  ```css
  .nav-dock[data-empty="true"] {
    display: none;
  }
  ```
- [x] **Step 2: Update `navigator.ts` to stamp `data-empty`**
  In `apply(href)`:
  For each dock column:
  If a view exists for the dock, set `col.dataset.empty = "false"`.
  Else set `col.dataset.empty = "true"` and `col.replaceChildren()`.
- [x] **Step 3: Add unit and CSS tests**
  Verify `data-empty="true"` on trailing dock when on route `/` (fixture where trailing is omitted).
  Verify `data-empty="false"` when navigating to `/fields`.
  Verify `navigator.css.test.ts` checks for `data-empty="true"`.
- [x] **Step 4: Run targeted Vitest suite**
  `npx vitest run packages/navigator`

---

### Task 2: CSS Container Queries & Narrow Presentation (Drawer/Modal)

**Files:**
- Modify: `packages/navigator/src/navigator.css`
- Modify: `packages/navigator/src/navigator.ts`
- Modify: `packages/navigator/src/navigator.test.ts`

- [x] **Step 1: Add container query styles in `navigator.css`**
  Set `container-type: inline-size` on `.nav`.
  Add `@container (max-width: 600px)` styles:
  - `[data-nav="drawer-toggle"]`: `display: inline-flex;`
  - `.nav-docks`: `position: relative; overflow: hidden;`
  - `.nav-dock[data-dock="leading"]`: off-canvas drawer with `position: absolute`, `transform: translateX(-100%)`.
  - `.nav-dock[data-dock="leading"][data-open="true"]`: `transform: translateX(0);`
  - `.nav-dock[data-dock="trailing"]:not([data-empty="true"])`: overlay detail sheet.
- [x] **Step 2: Add drawer toggle button in `navigator.ts` chrome**
  Add `drawerToggleBtn` in `.nav-chrome`:
  `button({ label: "Menu", kind: "neutral", onClick: () => this.toggleDrawer() })` with `data-nav="drawer-toggle"` and `aria-label="Toggle navigation menu"`.
  Toggling sets `col.dataset.open = col.dataset.open === "true" ? "false" : "true"` on the leading dock.
  On route navigation, auto-close drawer by setting `col.dataset.open = "false"`.
- [x] **Step 3: Unit test drawer toggle**
  Assert drawer button exists, clicking it toggles `data-open` on `[data-dock="leading"]`.
  Assert calling `go()` resets `data-open` to `"false"`.
- [x] **Step 4: Run targeted Vitest suite**
  `npx vitest run packages/navigator`

---

### Task 3: Enhanced `ViewContext` API

**Files:**
- Modify: `packages/navigator/src/registry.ts`
- Modify: `packages/navigator/src/navigator.ts`
- Modify: `packages/navigator/src/navigator.test.ts`

- [x] **Step 1: Update `ViewContext` type in `registry.ts`**
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
- [x] **Step 2: Provide full context in `navigator.ts`**
  Pass `canGoBack: this.history.index > 0`, `canGoForward: this.history.index < this.history.entries.length - 1`, `back: () => this.back()`, `forward: () => this.forward()`, and `query: url.searchParams` into `ctx`.
- [x] **Step 3: Unit test `ViewContext` properties**
  Test that views receive `canGoBack`, `canGoForward`, `back`, `forward`, and `query`.
- [x] **Step 4: Run targeted Vitest suite**
  `npx vitest run packages/navigator`

---

### Task 4: Surface Keep-Alive & View Reparenting

**Files:**
- Modify: `packages/navigator/src/registry.ts`
- Modify: `packages/navigator/src/navigator.ts`
- Modify: `packages/navigator/src/navigator.test.ts`

- [x] **Step 1: Define `SurfaceElement` in `registry.ts`**
  ```ts
  export type SurfaceElement = HTMLElement & {
    onUpdate?: (ctx: ViewContext) => void;
  };
  export type ViewFactory = (ctx: ViewContext) => SurfaceElement;
  ```
- [x] **Step 2: Implement view caching and `onUpdate` in `navigator.ts`**
  Maintain `private readonly surfaceCache = new Map<string, SurfaceElement>()`.
  In `apply(href)`:
  For each dock, if the required view is already mounted in the dock element:
  - Do NOT replace children.
  - Invoke `surface.onUpdate?.(ctx)`.
  If a different view is required:
  - Check `this.surfaceCache.get(viewName)` or instantiate via `app.views[viewName](ctx)`.
  - Cache the surface.
  - Mount via `col.replaceChildren(surface)`.
  - Invoke `surface.onUpdate?.(ctx)`.
- [x] **Step 3: Unit test surface keep-alive and `onUpdate`**
  Verify that when navigating between routes with the same `leading` view:
  - `col.firstElementChild` maintains reference equality (DOM node is not destroyed).
  - `onUpdate` is called with the new `ctx`.
  - Input field values in `leading` stay intact.
- [x] **Step 4: Run targeted Vitest suite**
  `npx vitest run packages/navigator`

---

### Task 5: Final Verification & STATUS Update

**Files:**
- Modify: `docs/superpowers/STATUS.md`

- [x] **Step 1: Run typecheck**
  `npm run typecheck`
- [x] **Step 2: Run full test suite**
  `npm test`
- [x] **Step 3: Update `docs/superpowers/STATUS.md`**
  Reflect completion of dynamic docks plan.
