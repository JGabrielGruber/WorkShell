# Architectural Invariants & Performance Laws

These laws are non-negotiable invariants of the Workshell codebase. Any PR, spec, or agent action that violates them is rejected.

---

## 1. The 180Hz Pointer-Path Law

Dragging, resizing, and window interactions must run at the native display refresh rate (up to 180Hz) with zero DOM layout thrashing.

During `pointermove` or active drag/resize operations:
- **FORBIDDEN:** `getBoundingClientRect()`
- **FORBIDDEN:** `offsetWidth`, `offsetHeight`, `clientWidth`, `clientHeight`, `scrollWidth`
- **FORBIDDEN:** `window.getComputedStyle()`
- **FORBIDDEN:** Reading or writing `localStorage` / `sessionStorage`
- **FORBIDDEN:** Toggling CSS classes or modifying DOM structures
- **ALLOWED:** Updating cached arithmetic coordinates and writing hardware-accelerated inline styles (`transform: translate3d(...)` or direct layout box updates).

Persistence of window geometry to storage occurs **only on `pointerup`** after interaction concludes.

---

## 2. Layout Persistence Invariant

- Key: `localStorage["workshell.layout.v1"]` (format `version: 2`).
- Storage contents: **Geometry and window placement only** (positions, sizes, z-order, spatial desktop mapping).
- **FORBIDDEN:** Storing application domain state, UI DOM trees, or guest data inside the layout key.
- Sanitization: All restored layouts pass through `sanitizeLayout` on boot; invalid or malformed entries fall back to the initial seed without throwing.

---

## 3. Theme Engine and Pigment Law

- Theme engine (`@workshell/theme`) is the sole authority on theme tokens.
- **FORBIDDEN:** Inline hex codes in package CSS (enforced by tests like `shell.css.test.ts` and `tokens.test.ts`).
- **FORBIDDEN:** Re-introducing retired `--glass*` or `--bevel*` variables into core packages.
- **FORBIDDEN:** Importing CSS stylesheets from `apps/session` entrypoint. Packages import their own CSS from JS modules.

---

## 4. DOM Reparenting Stability

- Windows are reparented across DOM layers using `WorkspaceEngine.mount()`.
- An application mounted into a window must survive reparenting without dropping internal event listeners, resetting canvas/iframe/input states, or re-initializing state machines.
