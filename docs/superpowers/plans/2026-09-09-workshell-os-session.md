# OS Session Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the demo session with a kernel (`@workshell/session`), an opinionated desktop DE (`@workshell/desktop`), and an empty `apps/session` entry that boots wallpaper + bar + empty menu with no guests.

**Architecture:** Kernel owns prefs, theme stamp, app registry, layout-storage allowlist, and `boot`. Desktop owns chrome, panel factory, menu slot, and `createDesktop(root, session, { seed })`. Kernel does not import desktop. Entry imports both plus theme CSS and registers nothing. `apps/shell-demo` is deleted.

**Tech Stack:** npm workspaces, TypeScript, Vitest + happy-dom, vanilla CSS. No Tailwind in kernel, desktop, or the session entry. No kit/navigator in the entry.

**Spec:** `docs/superpowers/specs/2026-09-09-workshell-os-session-design.md`

**Worktree:** Create via `using-git-worktrees` at execution time. Run `npm test` / `npx tsc --noEmit` from the worktree. Do not kill José's Vite. Do not push. Do not force-push.

**Pointer-path rules:** no `getBoundingClientRect` / `offsetWidth` / `clientWidth` / `localStorage` / class toggles on `pointermove`.

**Do not:** add Settings, Probe, kanban, TASK-104, a theme catalog, widget registry, glass-effect API, start columns, Tailwind, kit/navigator imports in the entry, compositor `sanitizeLayout` changes, or a prefs field other than `{ version: 1, theme }`.

**Order:** Tasks 1–4 (session) sequential. Task 5 (taskbar split) can follow 1. Tasks 6–7 need session + split chrome. Task 8 deletes the demo last so tests stay green until the new entry exists. Do not parallelize later tasks onto an unfinished kernel.

---

## File map

| File | Responsibility |
|---|---|
| `packages/session/package.json` | `@workshell/session`; depends on compositor |
| `packages/session/tsconfig.json` | extends repo base |
| `packages/session/src/mem.ts` | **test-only? no — do not export mem from the package.** Duplicate `mem()` in tests. |
| `packages/session/src/prefs.ts` | `PREFS_KEY`, `PrefsV1`, `readPrefs` |
| `packages/session/src/prefs.test.ts` | missing / garbage / write |
| `packages/session/src/registry.ts` | register / list / mount |
| `packages/session/src/registry.test.ts` | duplicate, unknown mount |
| `packages/session/src/layout-storage.ts` | wrap `Storage` for `STORAGE_KEY` allowlist |
| `packages/session/src/layout-storage.test.ts` | drop unregistered ids |
| `packages/session/src/empty.ts` | `emptyLayout()` |
| `packages/session/src/session.ts` | `createSession`, `boot`, `setTheme` |
| `packages/session/src/session.test.ts` | boot order, no first-write, leftover panels |
| `packages/session/src/index.ts` | public exports |
| `packages/desktop-shell/src/chrome.ts` | `#taskbar` menu + pills slots; `hosts.taskbar` = pills |
| `packages/desktop-shell/src/chrome.test.ts` | amend taskbar assertions |
| `packages/desktop-shell/src/menu.ts` | `mountMenu` |
| `packages/desktop-shell/src/menu.test.ts` | empty list; click open; survive `open()` |
| `packages/desktop-shell/src/host.ts` | `createDesktop(root, session, { seed })` |
| `packages/desktop-shell/src/host.test.ts` | rewrite for new door |
| `packages/desktop-shell/src/index.ts` | drop `BootOptions` / `WorkshellHost.setTheme` |
| `packages/desktop-shell/src/shell.css` | pills flex + menu button |
| `packages/desktop-shell/package.json` | add session dep; later rename |
| `packages/desktop/` | git mv of `packages/desktop-shell`; name `@workshell/desktop` |
| `apps/session/` | Vite entry `@workshell/session-app` |
| `apps/shell-demo/` | **delete entire tree** |
| `package.json` | `dev`/`build` → session-app |
| `README.md` | empty-session acceptance |

---

### Task 1: `@workshell/session` prefs

**Files:**
- Create: `packages/session/package.json`
- Create: `packages/session/tsconfig.json`
- Create: `packages/session/src/prefs.ts`
- Create: `packages/session/src/prefs.test.ts`
- Create: `packages/session/src/index.ts`

- [ ] **Step 1: Scaffold package**

`packages/session/package.json`:

```json
{
  "name": "@workshell/session",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "dependencies": { "@workshell/compositor": "*" }
}
```

`packages/session/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "noEmit": true },
  "include": ["src"]
}
```

Run: `npm install` at repo root so the workspace links.

- [ ] **Step 2: Write failing prefs tests**

```ts
import { describe, expect, it } from "vitest";
import { PREFS_KEY, readPrefs } from "./prefs";

function mem(): Storage {
  const m = new Map<string, string>();
  return {
    get length() {
      return m.size;
    },
    clear: () => m.clear(),
    getItem: (k: string) => m.get(k) ?? null,
    key: (i: number) => [...m.keys()][i] ?? null,
    removeItem: (k: string) => {
      m.delete(k);
    },
    setItem: (k: string, v: string) => {
      m.set(k, v);
    },
  };
}

describe("readPrefs", () => {
  it("returns null when missing", () => {
    expect(readPrefs(mem())).toBeNull();
  });

  it("returns null on bad JSON", () => {
    const s = mem();
    s.setItem(PREFS_KEY, "{");
    expect(readPrefs(s)).toBeNull();
  });

  it("returns null on bad version", () => {
    const s = mem();
    s.setItem(PREFS_KEY, JSON.stringify({ version: 2, theme: "aetheris-prism" }));
    expect(readPrefs(s)).toBeNull();
  });

  it("returns null on empty theme", () => {
    const s = mem();
    s.setItem(PREFS_KEY, JSON.stringify({ version: 1, theme: "" }));
    expect(readPrefs(s)).toBeNull();
  });

  it("returns v1 theme", () => {
    const s = mem();
    s.setItem(PREFS_KEY, JSON.stringify({ version: 1, theme: "aetheris-prism" }));
    expect(readPrefs(s)).toEqual({ version: 1, theme: "aetheris-prism" });
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run packages/session/src/prefs.test.ts`

Expected: FAIL (module not found or `readPrefs` missing).

- [ ] **Step 4: Implement prefs**

```ts
export const PREFS_KEY = "workshell.prefs.v1";

export type PrefsV1 = { version: 1; theme: string };

export function readPrefs(storage: Storage): PrefsV1 | null {
  const raw = storage.getItem(PREFS_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { version?: unknown; theme?: unknown };
    if (parsed?.version !== 1) return null;
    if (typeof parsed.theme !== "string" || !parsed.theme) return null;
    return { version: 1, theme: parsed.theme };
  } catch {
    return null;
  }
}

export function writePrefs(storage: Storage, theme: string): void {
  storage.setItem(PREFS_KEY, JSON.stringify({ version: 1, theme }));
}
```

`packages/session/src/index.ts`:

```ts
export { PREFS_KEY, readPrefs, writePrefs } from "./prefs";
export type { PrefsV1 } from "./prefs";
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run packages/session/src/prefs.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/session package-lock.json package.json
git commit -m "$(cat <<'EOF'
feat: add session prefs key reader

EOF
)"
```

---

### Task 2: App registry

**Files:**
- Create: `packages/session/src/registry.ts`
- Create: `packages/session/src/registry.test.ts`
- Modify: `packages/session/src/index.ts`

- [ ] **Step 1: Write failing registry tests**

```ts
import { describe, expect, it } from "vitest";
import { AppRegistry } from "./registry";

describe("AppRegistry", () => {
  it("lists in registration order", () => {
    const r = new AppRegistry();
    r.register({ id: "a", title: "A", mount: () => {} });
    r.register({ id: "b", title: "B", mount: () => {} });
    expect(r.list()).toEqual([
      { id: "a", title: "A" },
      { id: "b", title: "B" },
    ]);
  });

  it("duplicate id throws", () => {
    const r = new AppRegistry();
    r.register({ id: "a", title: "A", mount: () => {} });
    expect(() => r.register({ id: "a", title: "A2", mount: () => {} })).toThrow(/already registered/);
  });

  it("empty id throws", () => {
    const r = new AppRegistry();
    expect(() => r.register({ id: "", title: "A", mount: () => {} })).toThrow(/id/);
  });

  it("mount unknown is a no-op", () => {
    const r = new AppRegistry();
    const el = document.createElement("div");
    expect(() => r.mount("nope", el)).not.toThrow();
    expect(el.childNodes.length).toBe(0);
  });

  it("mount calls the app", () => {
    const r = new AppRegistry();
    const seen: HTMLElement[] = [];
    r.register({
      id: "a",
      title: "A",
      mount(el) {
        seen.push(el);
      },
    });
    const el = document.createElement("div");
    r.mount("a", el);
    expect(seen).toEqual([el]);
  });

  it("ids() is the allowlist", () => {
    const r = new AppRegistry();
    r.register({ id: "a", title: "A", mount: () => {} });
    expect([...r.ids()]).toEqual(["a"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run packages/session/src/registry.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement registry**

```ts
export type AppRegistration = {
  id: string;
  title: string;
  mount: (el: HTMLElement) => void;
};

export class AppRegistry {
  private apps = new Map<string, AppRegistration>();

  register(app: AppRegistration): void {
    if (!app.id) throw new Error("id required");
    if (!app.title) throw new Error("title required");
    if (typeof app.mount !== "function") throw new Error("mount required");
    if (this.apps.has(app.id)) throw new Error("already registered");
    this.apps.set(app.id, app);
  }

  list(): Array<{ id: string; title: string }> {
    return [...this.apps.values()].map(({ id, title }) => ({ id, title }));
  }

  ids(): Set<string> {
    return new Set(this.apps.keys());
  }

  title(id: string): string | undefined {
    return this.apps.get(id)?.title;
  }

  mount(id: string, el: HTMLElement): void {
    this.apps.get(id)?.mount(el);
  }
}
```

Export `AppRegistration` from `index.ts`.

- [ ] **Step 4: Run tests**

Run: `npx vitest run packages/session/src/registry.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/session/src
git commit -m "$(cat <<'EOF'
feat: add session app registry

EOF
)"
```

---

### Task 3: Layout storage wrapper

**Files:**
- Create: `packages/session/src/layout-storage.ts`
- Create: `packages/session/src/layout-storage.test.ts`

`STORAGE_KEY` is `workshell.layout.v1` from `@workshell/compositor`. Wrapper must **not** call `loadLayout`.

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from "vitest";
import { STORAGE_KEY } from "@workshell/compositor";
import { wrapLayoutStorage } from "./layout-storage";
import { PREFS_KEY } from "./prefs";

function mem(): Storage {
  const m = new Map<string, string>();
  return {
    get length() {
      return m.size;
    },
    clear: () => m.clear(),
    getItem: (k: string) => m.get(k) ?? null,
    key: (i: number) => [...m.keys()][i] ?? null,
    removeItem: (k: string) => {
      m.delete(k);
    },
    setItem: (k: string, v: string) => {
      m.set(k, v);
    },
  };
}

const leftover = {
  version: 2,
  slots: {
    left: { width: 320, order: ["probe"], activeId: "probe" },
    center: { width: 0, order: [], activeId: null },
    right: { width: 360, order: ["task-104"], activeId: "task-104" },
  },
  panels: {
    probe: {
      id: "probe",
      uid: "",
      title: "Probe",
      mode: "float",
      x: 1,
      y: 1,
      w: 100,
      h: 100,
      z: 1,
    },
    fake: {
      id: "fake",
      uid: "",
      title: "Fake",
      mode: "float",
      x: 2,
      y: 2,
      w: 100,
      h: 100,
      z: 2,
    },
  },
  overlay: { id: "probe", restore: { mode: "float" as const } },
  closed: ["task-104", "fake"],
  nextZ: 4,
};

describe("wrapLayoutStorage", () => {
  it("drops ids not in the allowlist on getItem(STORAGE_KEY)", () => {
    const inner = mem();
    inner.setItem(STORAGE_KEY, JSON.stringify(leftover));
    const wrapped = wrapLayoutStorage(inner, () => new Set(["fake"]));
    const parsed = JSON.parse(wrapped.getItem(STORAGE_KEY)!);
    expect(Object.keys(parsed.panels)).toEqual(["fake"]);
    expect(parsed.closed).toEqual(["fake"]);
    expect(parsed.overlay).toBeNull();
    expect(parsed.slots.left.order).toEqual([]);
    expect(parsed.slots.left.activeId).toBeNull();
    expect(parsed.slots.right.order).toEqual([]);
  });

  it("empty allowlist drops all panels", () => {
    const inner = mem();
    inner.setItem(STORAGE_KEY, JSON.stringify(leftover));
    const wrapped = wrapLayoutStorage(inner, () => new Set());
    const parsed = JSON.parse(wrapped.getItem(STORAGE_KEY)!);
    expect(parsed.panels).toEqual({});
    expect(parsed.closed).toEqual([]);
  });

  it("passes PREFS_KEY through", () => {
    const inner = mem();
    inner.setItem(PREFS_KEY, "keep");
    const wrapped = wrapLayoutStorage(inner, () => new Set());
    expect(wrapped.getItem(PREFS_KEY)).toBe("keep");
    wrapped.setItem(PREFS_KEY, "x");
    expect(inner.getItem(PREFS_KEY)).toBe("x");
  });

  it("returns raw on bad JSON", () => {
    const inner = mem();
    inner.setItem(STORAGE_KEY, "{");
    const wrapped = wrapLayoutStorage(inner, () => new Set());
    expect(wrapped.getItem(STORAGE_KEY)).toBe("{");
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npx vitest run packages/session/src/layout-storage.test.ts`

- [ ] **Step 3: Implement**

Filter `panels`, `closed`, `overlay`, and each slot `order` / `activeId`. Keep `version` and `nextZ`. `setItem` / `removeItem` / `clear` / `key` / `length` delegate to inner.

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add packages/session/src/layout-storage.ts packages/session/src/layout-storage.test.ts
git commit -m "$(cat <<'EOF'
feat: filter layout persist to registered app ids

EOF
)"
```

---

### Task 4: `createSession` + `boot`

**Files:**
- Create: `packages/session/src/empty.ts`
- Create: `packages/session/src/session.ts`
- Create: `packages/session/src/session.test.ts`
- Modify: `packages/session/src/index.ts`

`emptyLayout()` uses compositor `DEFAULT_LEFT_W` / `DEFAULT_RIGHT_W`, `panels: {}`, `nextZ: 1`.

Minimal hosts for tests (do **not** import `@workshell/desktop`):

```ts
function fakeHosts() {
  const workspace = document.createElement("div");
  workspace.id = "workspace";
  const taskbar = document.createElement("div");
  const overlayDim = document.createElement("div");
  const overlayHost = document.createElement("div");
  const floatLayer = document.createElement("div");
  const snapPreview = document.createElement("div");
  floatLayer.append(snapPreview);
  return {
    workspace,
    wallpaper: document.createElement("div"),
    widgetLayer: document.createElement("div"),
    floatLayer,
    overlayHost,
    overlayDim,
    snapPreview,
    taskbar,
  };
}

function createPanel(id: string, title: string): HTMLElement {
  const el = document.createElement("section");
  el.dataset.id = id;
  el.dataset.uid = id;
  el.innerHTML = `<div class="panel-title">${title}</div><div class="panel-body"></div>`;
  return el;
}
```

- [ ] **Step 1: Write failing session tests**

Cover:

1. Missing `defaultTheme` throws.
2. `boot` stamps `defaultTheme` when prefs missing and does **not** `setItem(PREFS_KEY)`.
3. Prefs `{ version: 1, theme: "aetheris-prism" }` → stamp prism, do not rewrite key (compare serialized string unchanged).
4. `setTheme(workspace, "aetheris-prism")` stamps **and** writes `{ version: 1, theme: "aetheris-prism" }`.
5. `getTheme(workspace)` reads `dataset.theme`.
6. Leftover `probe` in `STORAGE_KEY`, empty registry, `emptyLayout` seed → after `boot`, `engine.state.panels` has no `probe`.
7. Register `{ id: "fake" }` before boot; leftover contains `fake` + `probe` → keep `fake`, drop `probe`.
8. `boot` twice throws `/already/`.
9. Register after construction, `list()` live.
10. Stamp happens even with empty seed (workspace `data-theme` set).

`boot` must construct `WorkspaceEngine` with **wrapped** storage.

- [ ] **Step 2: Run — expect FAIL**

Run: `npx vitest run packages/session/src/session.test.ts`

- [ ] **Step 3: Implement `createSession`**

Shape (lock these names):

```ts
export type SessionOptions = {
  defaultTheme: string;
  storage?: Storage;
};

export type SessionBoot = {
  hosts: EngineHosts;
  workspace: HTMLElement;
  seed: () => LayoutState;
  createPanel: (id: string, title: string) => HTMLElement;
};

export type WorkshellSession = {
  readonly storage: Storage;
  register(app: AppRegistration): void;
  list(): Array<{ id: string; title: string }>;
  mount(id: string, el: HTMLElement): void;
  setTheme(workspace: HTMLElement, name: string): void;
  getTheme(workspace: HTMLElement): string | undefined;
  boot(opts: SessionBoot): WorkspaceEngine;
};
```

`boot` order: wrap storage → read prefs → stamp `workspace.dataset.theme` without write if null → `new WorkspaceEngine(hosts, wrapped, seed)` → `engine.boot` that `createPanel`s then `mount`s `.panel-body`. Missing `.panel-body` throws `/panel-body/`.

- [ ] **Step 4: Export from index:** `createSession`, `emptyLayout`, `PREFS_KEY`, types, `AppRegistration`.

- [ ] **Step 5: Run** `npx vitest run packages/session` — all PASS. `npx tsc --noEmit`.

- [ ] **Step 6: Commit**

```bash
git add packages/session
git commit -m "$(cat <<'EOF'
feat: session boot applies prefs and registry allowlist

EOF
)"
```

---

### Task 5: Split `#taskbar` into menu + pills

**Files:**
- Modify: `packages/desktop-shell/src/chrome.ts`
- Modify: `packages/desktop-shell/src/chrome.test.ts`
- Modify: `packages/desktop-shell/src/shell.css`

Do this **before** renaming the package so chrome tests stay on the current path.

- [ ] **Step 1: Rewrite chrome test**

Keep: workspace child ids still `wallpaper`, `widget-layer`, `float-layer`, `taskbar`, `overlay-dim`, `overlay-host`.

Change:

```ts
expect(hosts.workspace.querySelector("#taskbar")?.tagName).toBe("NAV");
expect(hosts.taskbar.getAttribute("data-slot")).toBe("pills");
expect(hosts.taskbar.id).toBe("taskbar-pills");
expect(hosts.workspace.querySelector("#taskbar [data-slot='menu']")).toBeTruthy();
expect(hosts.taskbar.parentElement?.id).toBe("taskbar");
```

`hosts.taskbar.id === "taskbar"` must **fail** until chrome changes.

- [ ] **Step 2: Run** `npx vitest run packages/desktop-shell/src/chrome.test.ts` — FAIL on taskbar id.

- [ ] **Step 3: Implement `buildWorkspace` taskbar**

```ts
const taskbar = document.createElement("nav");
taskbar.id = "taskbar";
const menuSlot = document.createElement("div");
menuSlot.dataset.slot = "menu";
const pills = document.createElement("div");
pills.id = "taskbar-pills";
pills.dataset.slot = "pills";
taskbar.append(menuSlot, pills);
```

Return `taskbar: pills` in `EngineHosts` (not the nav).

Add CSS:

```css
#taskbar [data-slot="pills"] {
  display: flex;
  align-items: center;
  gap: 8px;
}
#taskbar [data-slot="menu"] {
  display: flex;
  align-items: center;
}
```

- [ ] **Step 4: Run** `npx vitest run packages/desktop-shell packages/compositor` — PASS (engine still `replaceChildren` on whatever `hosts.taskbar` is).

- [ ] **Step 5: Commit**

```bash
git add packages/desktop-shell/src/chrome.ts packages/desktop-shell/src/chrome.test.ts packages/desktop-shell/src/shell.css
git commit -m "$(cat <<'EOF'
fix: compositor pills host is not the whole taskbar

EOF
)"
```

---

### Task 6: New `createDesktop` + Menu

**Files:**
- Create: `packages/desktop-shell/src/menu.ts`
- Create: `packages/desktop-shell/src/menu.test.ts`
- Modify: `packages/desktop-shell/src/host.ts`
- Modify: `packages/desktop-shell/src/host.test.ts`
- Modify: `packages/desktop-shell/src/index.ts`
- Modify: `packages/desktop-shell/package.json` (dependency `@workshell/session`)
- Modify: `packages/desktop-shell/src/shell.css` (menu button)

`createDesktop` **boots immediately**. `WorkshellHost.boot` / `setTheme` / `BootOptions` / `fillWidgetLayer` **die**.

```ts
export function createDesktop(
  root: HTMLElement,
  session: WorkshellSession,
  opts: { seed: () => LayoutState },
): { workspace: HTMLElement; engine: WorkspaceEngine };
```

Implementation:

1. Throw if `!(root instanceof HTMLElement)` (`/#app missing/`).
2. `hosts = buildWorkspace(root)`.
3. `engine = session.boot({ hosts, workspace: hosts.workspace, seed: opts.seed, createPanel: createPanelChrome })`.
4. `mountMenu(hosts.workspace.querySelector("[data-slot=menu]")!, session, engine)`.
5. Do **not** fill widget-layer.
6. Return `{ workspace: hosts.workspace, engine }`.

Menu:

- Button `aria-label="Menu"`, `aria-expanded`.
- Sibling list, `hidden` when closed.
- On open, `replaceChildren` from **live** `session.list()`.
- Row click → `engine.open(id, { title })`, close list.
- Empty list: zero rows, no placeholder.

- [ ] **Step 1: `npm install` after adding session dep.**

- [ ] **Step 2: Failing host + menu tests** (replace `host.test.ts` entirely)

Use `createSession({ defaultTheme: "aetheris-glass", storage: mem() })` + `emptyLayout` from session.

Tests:

1. `createDesktop` stamps glass; prefs key absent.
2. Widget-layer child count 0.
3. Menu button exists in `[data-slot="menu"]`; opening it with empty registry → 0 rows.
4. Register `{ id: "fake", title: "Fake", mount(el) { el.textContent = "ok"; } }` **before** `createDesktop`; click Fake → `engine.state.panels.fake` exists; `.panel-body` text `ok`.
5. After that `open()`, `workspace.querySelector("[data-slot=menu] [aria-label=Menu]")` still exists; `#taskbar-pills` contains a `.task-pill`.
6. Second `createDesktop` with the **same** session throws `/already/`.
7. Leftover `probe` in storage + empty registry → no `probe` panel node.

- [ ] **Step 3: Run — FAIL** (old `createDesktop(root)` API).

- [ ] **Step 4: Implement host + menu. Update `index.ts`:**

```ts
export { buildWorkspace, slot } from "./chrome";
export { createPanelChrome } from "./panel-chrome";
export { createDesktop } from "./host";
export { mountMenu } from "./menu";
```

Drop `BootOptions`, `FillPanelBody`, `FillWidgetLayer`, `WorkshellHost`. Keep compositor re-exports (`STORAGE_KEY`, `DEFAULT_*`, `WorkspaceEngine`, …).

- [ ] **Step 5: Run** `npx vitest run packages/desktop-shell packages/session packages/compositor` — PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/desktop-shell packages/session
git commit -m "$(cat <<'EOF'
feat: createDesktop takes a session and mounts Menu

EOF
)"
```

---

### Task 7: Rename `@workshell/desktop-shell` → `@workshell/desktop`

**Files:**
- `git mv packages/desktop-shell packages/desktop`
- Modify: `packages/desktop/package.json` name to `@workshell/desktop`
- Modify: any remaining imports of `@workshell/desktop-shell` **in packages/** (not docs/plans)

- [ ] **Step 1:** `git mv packages/desktop-shell packages/desktop`

- [ ] **Step 2:** Set `"name": "@workshell/desktop"`. `exports` stay `"."` and `"./shell.css"`.

- [ ] **Step 3:** `rg '@workshell/desktop-shell' --glob '!docs/**' --glob '!package-lock.json'`. Replace in code. Demo still has the old name until Task 8 — **leave demo for Task 8** or it will not typecheck. Prefer Task 7+8 same sitting if `tsc` includes demo: **delete or stop importing in the same commit as the rename if `tsc` walks apps/shell-demo.**

Law: after rename, `npx tsc --noEmit` must not see `@workshell/desktop-shell`. If demo still exists, its imports break. **Do Task 8 immediately after the mv in the same worktree sitting** (separate commits still OK if demo is deleted first).

Safer order inside this task: **do not mv until Task 8 starts.** If you already rewrote host, keep folder name `desktop-shell` until delete+entry, then mv + rename in one commit with the entry.

**Revised:** keep path `packages/desktop-shell` until Task 8. This task is a no-op if 6 landed there. Skip empty commit.

---

### Task 8: Entry, delete demo, rename desktop, README

**Files:**
- Create: `apps/session/package.json` name `@workshell/session-app`
- Create: `apps/session/tsconfig.json`
- Create: `apps/session/index.html` (copy fonts from demo; keep `#app`)
- Create: `apps/session/vite.config.ts` — **no Tailwind plugin**

```ts
import { defineConfig } from "vite";
export default defineConfig({
  server: { fs: { allow: ["../.."] } },
});
```

- Create: `apps/session/src/main.ts`
- Create: `apps/session/src/vite-env.d.ts` (`/// <reference types="vite/client" />`)
- Delete: `apps/shell-demo/` (entire tree)
- `git mv packages/desktop-shell packages/desktop` if not done; name `@workshell/desktop`
- Modify: root `package.json` scripts
- Modify: `README.md`
- `npm install`

`apps/session/package.json`:

```json
{
  "name": "@workshell/session-app",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@workshell/compositor": "*",
    "@workshell/desktop": "*",
    "@workshell/session": "*",
    "@workshell/theme-aetheris-glass": "*",
    "@workshell/theme-aetheris-prism": "*"
  },
  "devDependencies": {
    "typescript": "^5.9.2",
    "vite": "^7.1.5"
  }
}
```

**No** kit, navigator, tailwind.

`apps/session/src/main.ts`:

```ts
import { createSession, emptyLayout } from "@workshell/session";
import { createDesktop } from "@workshell/desktop";
import "@workshell/compositor/compositor.css";
import "@workshell/desktop/shell.css";
import "@workshell/theme-aetheris-glass/tokens.css";
import "@workshell/theme-aetheris-prism/tokens.css";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("#app missing");

const session = createSession({ defaultTheme: "aetheris-glass" });
const { engine, workspace } = createDesktop(app, session, { seed: emptyLayout });
Object.assign(window, { workshell: engine, session, workspace });
```

(`workspace` on `window` is a console convenience; `setTheme` arity is still `(workspace, name)`.)

Root scripts:

```json
"dev": "npm run dev -w @workshell/session-app",
"build": "npm run build -w @workshell/session-app"
```

README replace packages line and acceptance:

- Packages: compositor, **session**, **desktop**, kit, navigator, both themes. App: `@workshell/session-app`.
- Run: empty desktop, Menu, no windows. Layout key same. Prefs key `workshell.prefs.v1` appears only after `session.setTheme`.
- Clear **both** keys to restore empty seed + glass.
- Delete Probe / kanban / TASK-104 / Glass-Prism bar bullets.
- Keep drag/maximize/hide/close bullets **only if a window exists** — they are untestable on empty seed. Replace with: Menu empty; console `session.setTheme(workspace, "aetheris-prism")` restyles and survives reload; leftover demo layout ids do not reappear.

- [ ] **Step 1:** Create `apps/session`, delete `apps/shell-demo`, mv/rename desktop, `npm install`.

- [ ] **Step 2:** `npx vitest run` — no shell-demo tests; session + desktop + compositor + kit + navigator + themes PASS. Count: demo tests gone; kit/navigator stay.

- [ ] **Step 3:** `npx tsc --noEmit` exit 0. `rg '@workshell/desktop-shell|shell-demo|mountProbe|mountKanban|mountThemeSwitch' --glob '!docs/**' --glob '!package-lock.json'` empty in code.

- [ ] **Step 4:** Commit (one or two commits: `feat: empty session app` + `chore: remove shell-demo`).

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat: boot empty OS session; remove shell-demo

EOF
)"
```

---

## Self-review

| Spec requirement | Task |
|---|---|
| `@workshell/session` prefs + sanitizer envelope | 1 |
| Registry register/list/mount | 2 |
| Layout wrapper, no `loadLayout` recursion | 3 |
| boot stamp-before-engine, no first-write | 4 |
| leftover demo ids dropped | 4, 6 |
| Kernel ↛ desktop | 4 tests use fake hosts |
| Pills vs menu | 5 |
| Menu survives `open()` | 6 |
| `createDesktop(root, session, { seed })` | 6 |
| Empty widget-layer | 6 |
| Rename desktop | 8 |
| `apps/session`, no Tailwind, no kit CSS | 8 |
| Delete demo | 8 |
| Same Storage for prefs + layout | 4 |
| `setTheme(workspace, name)` | 4, 8 |
| `#workspace` one surface | unchanged id in chrome |
| No Settings / Probe / catalog | all |

No TBD. Types: `WorkshellSession`, `SessionBoot`, `AppRegistration`, `PREFS_KEY`, `emptyLayout` — same names in tasks 4, 6, 8.
