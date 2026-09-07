# Workshell Package Carve Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Carve the current blob into npm workspaces (`@workshell/compositor`, `@workshell/desktop-shell`, `@workshell/theme-aetheris`, `@workshell/shell-demo`) with a `createDesktop` / `boot({ fillWidgetLayer, fillPanelBody, seed, theme })` door and no behavior change to the acceptance desktop.

**Architecture:** Compositor owns engine, persist, mechanical CSS, and `EngineHosts`. Desktop-shell owns layer tree, panel chrome, and `WorkshellHost`. Aetheris is CSS only. Shell-demo owns seed, kanban, TASK-104 body, Vite, and `window.workshell`. Demo → shell → compositor. Shell re-exports compositor types. Apps never construct `WorkspaceEngine` against raw layers.

**Tech Stack:** npm workspaces, Vite 7, TypeScript, Tailwind v4 on the demo only, Vitest + happy-dom. Private packages, TypeScript source exports. No Angular, no second theme, no Nx, no pnpm.

**Spec:** `docs/superpowers/specs/2026-09-07-workshell-package-carve-design.md`

**Ownership:** Coordinating session owns `packages/compositor/src/engine.ts` (Task 4). Do not parallelize implementers on that file. Other tasks may be delegated.

**Worktree:** Create via `using-git-worktrees` at execution time. Run `npm test` / `npx tsc` from the worktree, not the repo root. Do not kill José's Vite on `:5173`.

**Pointer-path rules (engine task):** no `getBoundingClientRect` / `offsetWidth` / `clientWidth` in `pointermove`; no `localStorage` in `pointermove`; no Tailwind class toggles on the moving panel during move. `will-change: transform` only while dragging.

---

## File map

| File | Responsibility |
|---|---|
| `package.json` (root) | workspaces, `dev`/`test`/`build` delegate |
| `tsconfig.base.json` | shared compiler options |
| `vitest.config.ts` | happy-dom; include `packages/**/*.test.ts` and `apps/**/*.test.ts` |
| `packages/compositor/package.json` | `@workshell/compositor` exports `.` and `./compositor.css` |
| `packages/compositor/src/types.ts` | layout types, constants; **no** `KNOWN_IDS` / `PANEL_META` / `seedLayout` |
| `packages/compositor/src/hosts.ts` | `EngineHosts` |
| `packages/compositor/src/persist.ts` | `loadLayout(storage, seed)` |
| `packages/compositor/src/engine.ts` | `WorkspaceEngine`; constructor takes `seed` |
| `packages/compositor/src/compositor.css` | overflow lock, rest `translate3d`, mode geometry, `.is-dragging` / `will-change` |
| `packages/compositor/src/index.ts` | public exports |
| `packages/compositor/src/fixture-seed.ts` | test-only seed (`alpha`); not exported from `index.ts` |
| `packages/desktop-shell/package.json` | depends on compositor |
| `packages/desktop-shell/src/chrome.ts` | layer tree; empty wallpaper; **no** kanban; **no** wallpaper URL |
| `packages/desktop-shell/src/panel-chrome.ts` | titlebar / lights / empty `.panel-body` |
| `packages/desktop-shell/src/host.ts` | `createDesktop` / `boot` / `setTheme` |
| `packages/desktop-shell/src/shell.css` | layer + chrome **structure** |
| `packages/desktop-shell/src/index.ts` | `createDesktop` + re-exports compositor types |
| `packages/themes/aetheris/package.json` | CSS export |
| `packages/themes/aetheris/tokens.css` | tokens, wallpaper paint, glass |
| `apps/shell-demo/package.json` | Vite app; depends on shell + theme |
| `apps/shell-demo/index.html` | moved from repo root |
| `apps/shell-demo/vite.config.ts` | Tailwind + Vite |
| `apps/shell-demo/src/main.ts` | `createDesktop` + fills + CSS imports |
| `apps/shell-demo/src/seed.ts` | `seedLayout` / `KNOWN_IDS` / `PANEL_META` |
| `apps/shell-demo/src/widgets/kanban.ts` | current kanban |
| `apps/shell-demo/src/windows/task-104.ts` | inspector body |
| `apps/shell-demo/src/demo.css` | kanban + inspector layout |
| `README.md` | workspace run commands |

Delete at the end: repo-root `src/`, `index.html`, old `vite.config.ts`, old `tsconfig.json` include of `src`.

---

### Task 1: npm workspaces scaffold

**Files:**
- Modify: `package.json`
- Create: `tsconfig.base.json`
- Create: `vitest.config.ts`
- Create: `packages/compositor/package.json`
- Create: `packages/desktop-shell/package.json`
- Create: `packages/themes/aetheris/package.json`
- Create: `apps/shell-demo/package.json`
- Modify: `tsconfig.json` (extend base; keep `include: ["src"]` until Task 10)

- [ ] **Step 1: Write root `package.json` workspaces**

Replace scripts and add workspaces. Keep existing `devDependencies`. Do not add Angular.

```json
{
  "name": "workshell",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "workspaces": ["packages/*", "packages/themes/*", "apps/*"],
  "scripts": {
    "dev": "npm run dev -w @workshell/shell-demo",
    "build": "npm run build -w @workshell/shell-demo",
    "test": "vitest run"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.1.13",
    "happy-dom": "^18.0.1",
    "tailwindcss": "^4.1.13",
    "typescript": "^5.9.2",
    "vite": "^7.1.5",
    "vitest": "^3.2.4"
  }
}
```

Until Task 9, `npm run dev` will fail (no demo package scripts yet). Leave a temporary root script if José's current Vite is already running — do not restart it. Add this extra script so the old blob still has a command:

```json
"dev:blob": "vite"
```

Keep the current `vite.config.ts` for `dev:blob` until Task 10.

- [ ] **Step 2: Create `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "moduleDetection": "force",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  }
}
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    passWithNoTests: true,
    include: ["src/**/*.test.ts", "packages/**/*.test.ts", "apps/**/*.test.ts"],
  },
});
```

Keep `src/**/*.test.ts` until Task 10 deletes `src/`.

- [ ] **Step 4: Create workspace `package.json` files**

`packages/compositor/package.json`:

```json
{
  "name": "@workshell/compositor",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./compositor.css": "./src/compositor.css"
  }
}
```

`packages/desktop-shell/package.json`:

```json
{
  "name": "@workshell/desktop-shell",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./shell.css": "./src/shell.css"
  },
  "dependencies": {
    "@workshell/compositor": "*"
  }
}
```

`packages/themes/aetheris/package.json`:

```json
{
  "name": "@workshell/theme-aetheris",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "exports": {
    ".": "./tokens.css",
    "./tokens.css": "./tokens.css"
  }
}
```

`apps/shell-demo/package.json`:

```json
{
  "name": "@workshell/shell-demo",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@workshell/desktop-shell": "*",
    "@workshell/theme-aetheris": "*"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.1.13",
    "tailwindcss": "^4.1.13",
    "typescript": "^5.9.2",
    "vite": "^7.1.5"
  }
}
```

- [ ] **Step 5: Point root `tsconfig.json` at the base**

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": { "noEmit": true },
  "include": ["src"]
}
```

- [ ] **Step 6: Install workspace links**

Run: `npm install`

Expected: `node_modules/@workshell/compositor` (and siblings) exist as symlinks. `package-lock.json` updates. Existing `npm test` still passes the current 34 tests (include still has `src/**/*.test.ts`).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json tsconfig.base.json tsconfig.json vitest.config.ts packages apps
git commit -m "chore: scaffold npm workspaces for package carve"
```

---

### Task 2: Compositor types and EngineHosts

**Files:**
- Create: `packages/compositor/src/types.ts`
- Create: `packages/compositor/src/hosts.ts`
- Create: `packages/compositor/src/types.test.ts`
- Create: `packages/compositor/src/index.ts`
- Create: `packages/compositor/tsconfig.json`

- [ ] **Step 1: Write `packages/compositor/src/types.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import * as types from "./types";

describe("compositor types", () => {
  it("keeps persist key and float defaults without a product seed", () => {
    expect(types.STORAGE_KEY).toBe("workshell.layout.v1");
    expect(types.DEFAULT_FLOAT).toEqual({ x: 96, y: 48, w: 720, h: 520 });
    expect(types.TASKBAR_H).toBe(64);
    expect(types.TASKBAR_GAP).toBe(12);
    expect("seedLayout" in types).toBe(false);
    expect("KNOWN_IDS" in types).toBe(false);
    expect("PANEL_META" in types).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npm test -- packages/compositor/src/types.test.ts`

Expected: FAIL — file `./types` not found (or `STORAGE_KEY` missing).

- [ ] **Step 3: Write types, hosts, index, tsconfig**

`packages/compositor/src/types.ts` — copy constants and types from `src/layout/types.ts` **except** delete `KNOWN_IDS`, `KnownId`, `PANEL_META`, and `seedLayout`. Keep `STORAGE_KEY`, snap/min/default constants, `PanelState`, `LayoutState`, `Mode` including `dock` | `overlay` | `maximized` | `hidden`.

`packages/compositor/src/hosts.ts`:

```ts
export type EngineHosts = {
  workspace: HTMLElement;
  wallpaper: HTMLElement;
  widgetLayer: HTMLElement;
  floatLayer: HTMLElement;
  overlayHost: HTMLElement;
  overlayDim: HTMLElement;
  snapPreview: HTMLElement;
  taskbar: HTMLElement;
  left?: HTMLElement;
  center?: HTMLElement;
  right?: HTMLElement;
  leftTabs?: HTMLElement;
  centerTabs?: HTMLElement;
  rightTabs?: HTMLElement;
  leftBody?: HTMLElement;
  centerBody?: HTMLElement;
  rightBody?: HTMLElement;
};
```

`packages/compositor/src/index.ts`:

```ts
export type { EngineHosts } from "./hosts";
export type {
  LayoutState,
  PanelState,
  Mode,
  SlotId,
  SlotState,
  OverlayState,
} from "./types";
export {
  STORAGE_KEY,
  SNAP_EDGE_PX,
  FLOAT_OUT_THRESHOLD_PX,
  MIN_FLOAT_W,
  MIN_FLOAT_H,
  DEFAULT_LEFT_W,
  DEFAULT_RIGHT_W,
  TASKBAR_H,
  TASKBAR_GAP,
  DEFAULT_FLOAT,
} from "./types";
```

`packages/compositor/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "noEmit": true },
  "include": ["src"]
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npm test -- packages/compositor/src/types.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/compositor
git commit -m "feat: compositor types without product seed"
```

---

### Task 3: Persist takes a seed

**Files:**
- Create: `packages/compositor/src/fixture-seed.ts`
- Create: `packages/compositor/src/persist.ts`
- Create: `packages/compositor/src/persist.test.ts`
- Modify: `packages/compositor/src/index.ts`

- [ ] **Step 1: Write `packages/compositor/src/persist.test.ts`**

Use fixture id `alpha`, never `task-104`.

```ts
import { describe, expect, it } from "vitest";
import { fixtureSeed } from "./fixture-seed";
import { loadLayout, saveLayout } from "./persist";
import { STORAGE_KEY } from "./types";

function mem(initial?: Record<string, string>): Storage {
  const m = new Map<string, string>(Object.entries(initial ?? {}));
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

describe("persist", () => {
  it("seeds when the key is missing", () => {
    const s = loadLayout(mem(), fixtureSeed);
    expect(s.version).toBe(2);
    expect(s.panels.alpha.mode).toBe("float");
    expect(s.slots.left.order).toEqual([]);
    expect(s.panels["task-104"]).toBeUndefined();
  });

  it("seeds when JSON is corrupt", () => {
    const storage = mem({ [STORAGE_KEY]: "{not json" });
    expect(loadLayout(storage, fixtureSeed).version).toBe(2);
    expect(loadLayout(storage, fixtureSeed).panels.alpha.title).toBe("Alpha");
  });

  it("seeds when version is not 2", () => {
    const storage = mem({ [STORAGE_KEY]: JSON.stringify({ version: 1, panels: {} }) });
    expect(loadLayout(storage, fixtureSeed).panels.alpha.id).toBe("alpha");
    expect(loadLayout(storage, fixtureSeed).slots.right.order).toEqual([]);
  });

  it("round-trips float rect, hidden restore, and closed ids", () => {
    const storage = mem();
    const state = fixtureSeed();
    state.closed = ["alpha"];
    delete state.panels.alpha;
    saveLayout(storage, state);
    const loaded = loadLayout(storage, fixtureSeed);
    expect(loaded.closed).toEqual(["alpha"]);
    expect(loaded.panels.alpha).toBeUndefined();
  });

  it("keeps hidden restore on a live panel", () => {
    const storage = mem();
    const state = fixtureSeed();
    state.panels.alpha.mode = "hidden";
    state.panels.alpha.restore = { mode: "maximized" };
    state.panels.alpha.x = 80;
    saveLayout(storage, state);
    const loaded = loadLayout(storage, fixtureSeed);
    expect(loaded.panels.alpha.mode).toBe("hidden");
    expect(loaded.panels.alpha.restore).toEqual({ mode: "maximized" });
    expect(loaded.panels.alpha.x).toBe(80);
  });

  it("drops unknown panel ids against the seed allowlist", () => {
    const storage = mem();
    const state = fixtureSeed() as ReturnType<typeof fixtureSeed> & {
      panels: Record<string, unknown>;
    };
    state.panels.ghost = {
      id: "ghost",
      uid: "x",
      title: "Ghost",
      mode: "float",
      x: 0,
      y: 0,
      w: 10,
      h: 10,
      z: 1,
    };
    state.slots.left.order = ["ghost", "alpha"];
    state.closed = ["nope"];
    saveLayout(storage, state as ReturnType<typeof fixtureSeed>);
    const loaded = loadLayout(storage, fixtureSeed);
    expect(loaded.panels.ghost).toBeUndefined();
    expect(loaded.slots.left.order).toEqual(["alpha"]);
    expect(loaded.closed).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npm test -- packages/compositor/src/persist.test.ts`

Expected: FAIL — `./persist` not found.

- [ ] **Step 3: Write fixture + persist**

`packages/compositor/src/fixture-seed.ts`:

```ts
import { DEFAULT_FLOAT, DEFAULT_LEFT_W, DEFAULT_RIGHT_W, type LayoutState } from "./types";

export function fixtureSeed(): LayoutState {
  const float = DEFAULT_FLOAT;
  return {
    version: 2,
    slots: {
      left: { width: DEFAULT_LEFT_W, order: [], activeId: null },
      center: { width: 0, order: [], activeId: null },
      right: { width: DEFAULT_RIGHT_W, order: [], activeId: null },
    },
    panels: {
      alpha: {
        id: "alpha",
        uid: "",
        title: "Alpha",
        mode: "float",
        x: float.x,
        y: float.y,
        w: float.w,
        h: float.h,
        z: 2,
      },
    },
    overlay: null,
    closed: [],
    nextZ: 3,
  };
}
```

`packages/compositor/src/persist.ts` — take `src/layout/persist.ts` and apply this contract:

- Remove imports of `KNOWN_IDS` and `seedLayout`.
- `sanitizeLayout(parsed, seed)`: if `!parsed.slots || !parsed.panels` return `seed()`.
- `const KNOWN = new Set(Object.keys(seed().panels));` inside `sanitizeLayout`.
- `loadLayout(storage, seed: () => LayoutState)`: missing / corrupt / `version !== 2` → `seed()`.
- `saveLayout` unchanged.

Export `loadLayout`, `saveLayout`, `sanitizeLayout` from `index.ts`. Do **not** export `fixtureSeed` from `index.ts`.

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npm test -- packages/compositor/src/persist.test.ts`

Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/compositor
git commit -m "feat: persist loadLayout takes a seed allowlist"
```

---

### Task 4: Move WorkspaceEngine (parent session only)

**Files:**
- Create: `packages/compositor/src/engine.ts` (copy of `src/layout/engine.ts` + patch)
- Create: `packages/compositor/src/engine.test.ts`
- Modify: `packages/compositor/src/index.ts`

Do **not** delegate this task. Coordinating session edits `engine.ts`.

- [ ] **Step 1: Write `packages/compositor/src/engine.test.ts`**

Stub hosts and stub panel chrome. Panel id is `alpha`. No import from desktop-shell or `src/`.

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { WorkspaceEngine, snapZone } from "./engine";
import { fixtureSeed } from "./fixture-seed";
import type { EngineHosts } from "./hosts";
import { STORAGE_KEY } from "./types";

function fakeHosts(): EngineHosts {
  const workspace = document.createElement("div");
  workspace.id = "workspace";
  const wallpaper = document.createElement("div");
  wallpaper.id = "wallpaper";
  const widgetLayer = document.createElement("div");
  widgetLayer.id = "widget-layer";
  const floatLayer = document.createElement("div");
  floatLayer.id = "float-layer";
  floatLayer.style.pointerEvents = "none";
  const snapPreview = document.createElement("div");
  snapPreview.id = "snap-preview";
  floatLayer.append(snapPreview);
  const overlayHost = document.createElement("div");
  overlayHost.id = "overlay-host";
  const overlayDim = document.createElement("div");
  overlayDim.id = "overlay-dim";
  const taskbar = document.createElement("nav");
  taskbar.id = "taskbar";
  workspace.append(wallpaper, widgetLayer, floatLayer, taskbar, overlayDim, overlayHost);
  document.body.append(workspace);
  return {
    workspace,
    wallpaper,
    widgetLayer,
    floatLayer,
    overlayHost,
    overlayDim,
    snapPreview,
    taskbar,
  };
}

function createTestPanel(id: string): HTMLElement {
  const el = document.createElement("section");
  el.className = "panel";
  el.dataset.id = id;
  el.dataset.uid = `uid-${id}`;
  el.innerHTML = `<div class="panel-titlebar"><span class="panel-title"></span></div><div class="panel-body"></div><div class="resize-handle" data-resize="1"></div>`;
  el.querySelector(".panel-title")!.textContent = id === "alpha" ? "Alpha" : id;
  return el;
}

function boot(storage: Storage = localStorage): {
  engine: WorkspaceEngine;
  hosts: EngineHosts;
} {
  localStorage.clear();
  const hosts = fakeHosts();
  const engine = new WorkspaceEngine(hosts, storage, fixtureSeed);
  engine.boot(createTestPanel);
  return { engine, hosts };
}

describe("snapZone", () => {
  it("uses 40px edges and the middle third for center", () => {
    expect(snapZone(10, 1800, 320, 360)).toBe("left");
    expect(snapZone(1790, 1800, 320, 360)).toBe("right");
    expect(snapZone(900, 1800, 320, 360)).toBe("center");
    expect(snapZone(80, 1800, 320, 360)).toBeNull();
  });
});

describe("WorkspaceEngine", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    localStorage.clear();
  });

  it("preserves the same node and uid across float", () => {
    const { engine, hosts } = boot();
    const before = engine.node("alpha");
    const uid = before.dataset.uid;
    expect(before.parentElement).toBe(hosts.floatLayer);
    engine.float("alpha", { x: 40, y: 50, w: 300, h: 220 });
    expect(before.isConnected).toBe(true);
    expect(before.dataset.uid).toBe(uid);
    expect(before.parentElement).toBe(hosts.floatLayer);
  });

  it("maximize does not rewrite stored rect; unmaximize restores it", () => {
    const { engine, hosts } = boot();
    engine.float("alpha", { x: 40, y: 50, w: 300, h: 220 });
    const el = engine.node("alpha");
    engine.maximize("alpha");
    expect(engine.state.panels.alpha.mode).toBe("maximized");
    expect(engine.state.panels.alpha.x).toBe(40);
    expect(engine.state.panels.alpha.w).toBe(300);
    expect(el.dataset.mode).toBe("maximized");
    expect(el.parentElement).toBe(hosts.floatLayer);
    engine.unmaximize("alpha");
    expect(engine.state.panels.alpha.mode).toBe("float");
    expect(engine.state.panels.alpha.x).toBe(40);
    expect(engine.state.panels.alpha.y).toBe(50);
    expect(engine.state.panels.alpha.w).toBe(300);
    expect(engine.state.panels.alpha.h).toBe(220);
  });

  it("hide keeps the node and show restores maximized", () => {
    const { engine, hosts } = boot();
    const el = engine.node("alpha");
    engine.maximize("alpha");
    engine.hide("alpha");
    expect(el.isConnected).toBe(true);
    expect(engine.state.closed).not.toContain("alpha");
    expect(engine.state.panels.alpha.mode).toBe("hidden");
    expect(engine.state.panels.alpha.restore).toEqual({ mode: "maximized" });
    expect(el.style.display).toBe("none");
    const pill = [...hosts.taskbar.querySelectorAll("button")].find((b) =>
      b.textContent?.includes("Alpha"),
    );
    expect(pill).toBeTruthy();
    pill!.click();
    expect(engine.state.panels.alpha.mode).toBe("maximized");
    expect(engine.state.panels.alpha.restore).toBeUndefined();
    expect(el.style.display).not.toBe("none");
  });

  it("close records closed and removes the pill", () => {
    const { engine, hosts } = boot();
    const el = engine.node("alpha");
    engine.close("alpha");
    expect(el.isConnected).toBe(false);
    expect(engine.state.closed).toContain("alpha");
    expect(engine.state.panels.alpha).toBeDefined();
    expect(hosts.taskbar.querySelector("button")).toBeNull();
  });
});

describe("gestures", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    localStorage.clear();
  });

  it("pointerup after a float drag does not dock", () => {
    const { engine, hosts } = boot();
    engine.float("alpha", { x: 100, y: 80, w: 300, h: 220 });
    const el = engine.node("alpha");
    const bar = el.querySelector(".panel-titlebar")!;
    bar.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, clientX: 120, clientY: 90, pointerId: 1 }),
    );
    document.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, clientX: 1790, clientY: 90, pointerId: 1 }),
    );
    const before = localStorage.getItem(STORAGE_KEY);
    document.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, clientX: 1800, clientY: 90, pointerId: 1 }),
    );
    expect(localStorage.getItem(STORAGE_KEY)).toBe(before);
    document.dispatchEvent(
      new PointerEvent("pointerup", { bubbles: true, clientX: 1790, clientY: 90, pointerId: 1 }),
    );
    expect(engine.state.panels.alpha.mode).toBe("float");
    expect(el.parentElement).toBe(hosts.floatLayer);
  });

  it("titlebar drag on maximized unmaximizes then floats", () => {
    const { engine } = boot();
    engine.float("alpha", { x: 100, y: 80, w: 300, h: 220 });
    engine.maximize("alpha");
    const el = engine.node("alpha");
    const bar = el.querySelector(".panel-titlebar")!;
    bar.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, clientX: 400, clientY: 20, pointerId: 1 }),
    );
    expect(engine.state.panels.alpha.mode).toBe("float");
    document.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, clientX: 430, clientY: 40, pointerId: 1 }),
    );
    expect(el.style.transform).toMatch(/translate3d/);
    document.dispatchEvent(
      new PointerEvent("pointerup", { bubbles: true, clientX: 430, clientY: 40, pointerId: 1 }),
    );
    expect(engine.state.panels.alpha.mode).toBe("float");
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npm test -- packages/compositor/src/engine.test.ts`

Expected: FAIL — `./engine` not found, or constructor arity.

- [ ] **Step 3: Copy and patch `engine.ts`**

```bash
cp src/layout/engine.ts packages/compositor/src/engine.ts
```

Apply **only** these edits:

1. Change the hosts import:

```ts
import type { EngineHosts } from "./hosts";
```

2. Replace the constructor:

```ts
  constructor(
    private hosts: EngineHosts,
    private storage: Storage,
    seed: () => LayoutState,
  ) {
    this.state = loadLayout(storage, seed);
  }
```

No other behavior changes. `boot(createPanel)` stays. Pointer path stays.

Export `WorkspaceEngine` and `snapZone` from `index.ts`.

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npm test -- packages/compositor/src/engine.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/compositor
git commit -m "feat: compositor engine loads layout from injected seed"
```

---

### Task 5: Desktop-shell chrome without content

**Files:**
- Create: `packages/desktop-shell/src/chrome.ts`
- Create: `packages/desktop-shell/src/chrome.test.ts`
- Create: `packages/desktop-shell/tsconfig.json`
- Create: `packages/desktop-shell/src/index.ts` (chrome export for now)

- [ ] **Step 1: Write `packages/desktop-shell/src/chrome.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { buildWorkspace } from "./chrome";

describe("buildWorkspace", () => {
  it("builds desktop layers with empty wallpaper and empty widget layer", () => {
    const root = document.createElement("div");
    const hosts = buildWorkspace(root);
    expect(hosts.workspace.id).toBe("workspace");
    expect(hosts.wallpaper.id).toBe("wallpaper");
    expect(hosts.wallpaper.querySelector("img")).toBeNull();
    expect(hosts.widgetLayer.id).toBe("widget-layer");
    expect(hosts.widgetLayer.children.length).toBe(0);
    expect(hosts.floatLayer.id).toBe("float-layer");
    expect(hosts.snapPreview.id).toBe("snap-preview");
    expect(hosts.overlayDim.id).toBe("overlay-dim");
    expect(hosts.overlayHost.id).toBe("overlay-host");
    expect(hosts.taskbar.id).toBe("taskbar");
    expect(root.querySelector("#dock-row")).toBeNull();
    expect(root.querySelector("#topbar")).toBeNull();
    const kids = [...hosts.workspace.children].map((el) => el.id);
    expect(kids).toEqual([
      "wallpaper",
      "widget-layer",
      "float-layer",
      "taskbar",
      "overlay-dim",
      "overlay-host",
    ]);
    const dimIndex = kids.indexOf("overlay-dim");
    const hostIndex = kids.indexOf("overlay-host");
    const barIndex = kids.indexOf("taskbar");
    expect(hostIndex).toBeGreaterThan(dimIndex);
    expect(barIndex).toBeLessThan(dimIndex);
    expect(hosts.floatLayer.style.pointerEvents).toBe("none");
    expect(hosts.left).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npm test -- packages/desktop-shell/src/chrome.test.ts`

Expected: FAIL — `./chrome` not found, or wallpaper still has `img` / kanban.

- [ ] **Step 3: Write `chrome.ts`**

Copy `src/layout/chrome.ts` and apply:

- Import `EngineHosts` from `@workshell/compositor` (type only).
- Delete `mountKanban` import and the `mountKanban(widgetLayer)` call.
- Delete `WALLPAPER_SRC`, `WALLPAPER_ALT`, and the `img` element. Wallpaper is an empty host (`id="wallpaper"`, `data-purpose="desktop-wallpaper"`, `pointer-events: none`). Do **not** add `.wallpaper-tint` in chrome (theme paints via CSS).
- Keep `slot()` unused helpers.
- Keep `--taskbar-h` / `--taskbar-gap` on `#workspace`.

`packages/desktop-shell/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "noEmit": true },
  "include": ["src"]
}
```

`packages/desktop-shell/src/index.ts` for now:

```ts
export { buildWorkspace, slot } from "./chrome";
export type {
  EngineHosts,
  LayoutState,
  Mode,
  OverlayState,
  PanelState,
  SlotId,
  SlotState,
} from "@workshell/compositor";
export {
  DEFAULT_FLOAT,
  STORAGE_KEY,
  TASKBAR_GAP,
  TASKBAR_H,
  WorkspaceEngine,
  snapZone,
} from "@workshell/compositor";
```

Task 4 must land first so the `WorkspaceEngine` value re-export resolves.

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npm test -- packages/desktop-shell/src/chrome.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/desktop-shell
git commit -m "feat: desktop-shell chrome with empty content hosts"
```

---

### Task 6: Panel chrome with empty body

**Files:**
- Create: `packages/desktop-shell/src/panel-chrome.ts`
- Create: `packages/desktop-shell/src/panel-chrome.test.ts`

- [ ] **Step 1: Write `packages/desktop-shell/src/panel-chrome.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { createPanelChrome } from "./panel-chrome";

describe("createPanelChrome", () => {
  it("builds traffic lights and an empty body", () => {
    const el = createPanelChrome("task-104", "TASK-104");
    expect(el.dataset.id).toBe("task-104");
    expect(el.dataset.uid).toBeTruthy();
    expect(el.querySelector("[data-action='close']")).toBeTruthy();
    expect(el.querySelector("[data-action='hide']")).toBeTruthy();
    expect(el.querySelector("[data-action='maximize']")).toBeTruthy();
    expect(el.querySelector("[data-action='dock']")).toBeNull();
    expect(el.querySelector("[data-action='float']")).toBeNull();
    expect(el.querySelector("[data-action='overlay']")).toBeNull();
    expect(el.querySelector("[data-pane='chat']")).toBeNull();
    expect(el.querySelector(".inspector")).toBeNull();
    expect(el.querySelector(".panel-body")?.childNodes.length).toBe(0);
    expect(el.querySelector(".panel-title")?.textContent).toBe("TASK-104");
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npm test -- packages/desktop-shell/src/panel-chrome.test.ts`

Expected: FAIL — module not found, or body still has inspector HTML.

- [ ] **Step 3: Write `createPanelChrome`**

```ts
function uid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createPanelChrome(id: string, title: string): HTMLElement {
  const el = document.createElement("section");
  el.className = "panel";
  el.dataset.id = id;
  el.dataset.uid = uid();
  el.innerHTML = `
    <div class="panel-titlebar">
      <div class="traffic">
        <button type="button" class="tl tl-close" data-action="close" aria-label="Close"></button>
        <button type="button" class="tl tl-hide" data-action="hide" aria-label="Hide"></button>
        <button type="button" class="tl tl-max" data-action="maximize" aria-label="Maximize"></button>
      </div>
      <span class="panel-title"></span>
    </div>
    <div class="panel-body"></div>
    <div class="resize-handle" data-resize="1"></div>
  `;
  el.querySelector(".panel-title")!.textContent = title;
  return el;
}
```

No `PANEL_META`. No `bodyFor`. Export from `index.ts`.

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npm test -- packages/desktop-shell/src/panel-chrome.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/desktop-shell
git commit -m "feat: panel chrome with empty body"
```

---

### Task 7: WorkshellHost boot door

**Files:**
- Create: `packages/desktop-shell/src/host.ts`
- Create: `packages/desktop-shell/src/host.test.ts`
- Modify: `packages/desktop-shell/src/index.ts`

- [ ] **Step 1: Write `packages/desktop-shell/src/host.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { DEFAULT_FLOAT, DEFAULT_LEFT_W, DEFAULT_RIGHT_W, type LayoutState } from "@workshell/compositor";
import { createDesktop } from "./host";

function seedLayout(): LayoutState {
  const float = DEFAULT_FLOAT;
  return {
    version: 2,
    slots: {
      left: { width: DEFAULT_LEFT_W, order: [], activeId: null },
      center: { width: 0, order: [], activeId: null },
      right: { width: DEFAULT_RIGHT_W, order: [], activeId: null },
    },
    panels: {
      "task-104": {
        id: "task-104",
        uid: "",
        title: "TASK-104",
        mode: "float",
        x: float.x,
        y: float.y,
        w: float.w,
        h: float.h,
        z: 2,
      },
    },
    overlay: null,
    closed: [],
    nextZ: 3,
  };
}

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

describe("createDesktop", () => {
  it("throws if engine is read before boot", () => {
    const root = document.createElement("div");
    const host = createDesktop(root);
    expect(() => host.engine).toThrow(/boot/);
  });

  it("boot twice throws", () => {
    const root = document.createElement("div");
    const host = createDesktop(root);
    const opts = {
      theme: "aetheris",
      seed: seedLayout,
      storage: mem(),
      fillWidgetLayer: () => {},
      fillPanelBody: () => {},
    };
    host.boot(opts);
    expect(() => host.boot(opts)).toThrow(/already/);
  });

  it("missing fills throw", () => {
    const root = document.createElement("div");
    const host = createDesktop(root);
    expect(() =>
      host.boot({
        theme: "aetheris",
        seed: seedLayout,
        storage: mem(),
        fillWidgetLayer: undefined as unknown as (el: HTMLElement) => void,
        fillPanelBody: () => {},
      }),
    ).toThrow();
  });

  it("calls fills once and sets data-theme", () => {
    const root = document.createElement("div");
    const host = createDesktop(root);
    const widgets: HTMLElement[] = [];
    const bodies: Array<{ id: string; el: HTMLElement }> = [];
    const engine = host.boot({
      theme: "aetheris",
      seed: seedLayout,
      storage: mem(),
      fillWidgetLayer(el) {
        widgets.push(el);
      },
      fillPanelBody(id, el) {
        bodies.push({ id, el });
      },
    });
    expect(widgets).toHaveLength(1);
    expect(widgets[0].id).toBe("widget-layer");
    expect(bodies).toEqual([{ id: "task-104", el: expect.any(HTMLElement) }]);
    expect(bodies[0].el.className).toBe("panel-body");
    expect(bodies[0].el.childNodes.length).toBe(0);
    expect(host.workspace.dataset.theme).toBe("aetheris");
    expect(host.engine).toBe(engine);
    expect(engine.node("task-104").querySelector(".inspector")).toBeNull();
    host.setTheme("other");
    expect(host.workspace.dataset.theme).toBe("other");
  });

  it("unknown panel body stays empty", () => {
    const root = document.createElement("div");
    const host = createDesktop(root);
    host.boot({
      theme: "aetheris",
      seed: seedLayout,
      storage: mem(),
      fillWidgetLayer() {},
      fillPanelBody() {},
    });
    const body = host.engine.node("task-104").querySelector(".panel-body");
    expect(body?.childNodes.length).toBe(0);
  });

  it("fill callback throw is not swallowed", () => {
    const root = document.createElement("div");
    const host = createDesktop(root);
    expect(() =>
      host.boot({
        theme: "aetheris",
        seed: seedLayout,
        storage: mem(),
        fillWidgetLayer() {},
        fillPanelBody() {
          throw new Error("fill failed");
        },
      }),
    ).toThrow("fill failed");
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npm test -- packages/desktop-shell/src/host.test.ts`

Expected: FAIL — `./host` not found.

- [ ] **Step 3: Write `host.ts`**

```ts
import { WorkspaceEngine, type LayoutState } from "@workshell/compositor";
import { buildWorkspace } from "./chrome";
import { createPanelChrome } from "./panel-chrome";

export type FillWidgetLayer = (host: HTMLElement) => void;
export type FillPanelBody = (id: string, host: HTMLElement) => void;

export type BootOptions = {
  theme: string;
  seed: () => LayoutState;
  fillWidgetLayer: FillWidgetLayer;
  fillPanelBody: FillPanelBody;
  storage?: Storage;
};

export type WorkshellHost = {
  readonly workspace: HTMLElement;
  readonly engine: WorkspaceEngine;
  boot(opts: BootOptions): WorkspaceEngine;
  setTheme(name: string): void;
};

export function createDesktop(root: HTMLElement): WorkshellHost {
  if (!(root instanceof HTMLElement)) throw new Error("#app missing");
  const hosts = buildWorkspace(root);
  let engine: WorkspaceEngine | undefined;
  let booted = false;

  const api: WorkshellHost = {
    workspace: hosts.workspace,
    get engine() {
      if (!engine) throw new Error("boot() required");
      return engine;
    },
    boot(opts: BootOptions) {
      if (booted) throw new Error("boot() already called");
      if (!opts.theme || !opts.seed || !opts.fillWidgetLayer || !opts.fillPanelBody) {
        throw new Error("boot() missing required options");
      }
      booted = true;
      engine = new WorkspaceEngine(hosts, opts.storage ?? localStorage, opts.seed);
      engine.boot((id) => {
        const title = engine!.state.panels[id]?.title ?? id;
        const el = createPanelChrome(id, title);
        const body = el.querySelector(".panel-body");
        if (!(body instanceof HTMLElement)) throw new Error("panel-body missing");
        opts.fillPanelBody(id, body);
        return el;
      });
      opts.fillWidgetLayer(hosts.widgetLayer);
      api.setTheme(opts.theme);
      return engine;
    },
    setTheme(name: string) {
      hosts.workspace.dataset.theme = name;
    },
  };
  return api;
}
```

Do **not** import CSS from this module (tests stay CSS-free). Demo `main.ts` imports CSS.

Update `index.ts` to export `createDesktop`, `WorkshellHost`, `BootOptions`, `FillWidgetLayer`, `FillPanelBody`, `createPanelChrome`.

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npm test -- packages/desktop-shell/src/host.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/desktop-shell
git commit -m "feat: WorkshellHost boot callbacks"
```

---

### Task 8: Split CSS into compositor, shell, theme

**Files:**
- Create: `packages/compositor/src/compositor.css`
- Create: `packages/desktop-shell/src/shell.css`
- Create: `packages/themes/aetheris/tokens.css`

No new unit tests. Source of truth: `src/style.css`. Do not leave Tailwind in compositor or shell.

- [ ] **Step 1: Write `packages/compositor/src/compositor.css`**

Mechanical only:

```css
html,
body,
#app {
  height: 100%;
  margin: 0;
  overflow: hidden;
}

#workspace {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.panel {
  pointer-events: auto;
  position: absolute;
  left: 0;
  top: 0;
  width: var(--w);
  height: var(--h);
  transform: translate3d(var(--x), var(--y), 0);
  z-index: var(--z);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
  min-height: 0;
}

.panel[data-mode="dock"] {
  inset: 0;
  left: 0;
  top: 0;
  transform: none;
  width: auto;
  height: auto;
}

.panel[data-mode="dock"][hidden] {
  display: none;
}

.panel[data-mode="overlay"] {
  position: relative;
  left: auto;
  top: auto;
  width: 100%;
  height: 100%;
  transform: none;
}

.panel[data-mode="maximized"] {
  left: 0;
  top: 0;
  width: 100%;
  height: calc(100% - var(--taskbar-h) - var(--taskbar-gap));
  transform: none;
}

.panel.is-dragging {
  will-change: transform;
}

.resize-handle {
  display: none;
  position: absolute;
  right: 0;
  bottom: 0;
  width: 14px;
  height: 14px;
  cursor: nwse-resize;
  pointer-events: auto;
}

.panel[data-mode="float"] .resize-handle {
  display: block;
}
```

- [ ] **Step 2: Write `packages/desktop-shell/src/shell.css`**

```css
#wallpaper {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}

#widget-layer {
  position: absolute;
  inset: 0;
  bottom: calc(var(--taskbar-h) + var(--taskbar-gap));
  z-index: 1;
  padding: 20px;
  pointer-events: auto;
  display: flex;
  min-height: 0;
}

.slot {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  position: relative;
}

.slot-left {
  width: var(--left-w);
  flex: 0 0 var(--left-w);
}

.slot-center {
  flex: 1 1 auto;
}

.slot-right {
  width: var(--right-w);
  flex: 0 0 var(--right-w);
}

.slot-tabs {
  display: flex;
  gap: 4px;
  padding: 6px 8px 0;
  min-height: 28px;
}

.slot-tab {
  border-radius: 8px 8px 0 0;
  padding: 2px 10px;
  font-size: 11px;
  cursor: pointer;
}

.slot-body {
  flex: 1;
  min-height: 0;
  position: relative;
  margin: 0 8px 8px;
}

.slot-resizer {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 6px;
  cursor: ew-resize;
  z-index: 5;
}

.slot-left .slot-resizer {
  right: 0;
}

.slot-right .slot-resizer {
  left: 0;
}

#taskbar {
  position: absolute;
  left: 50%;
  bottom: var(--taskbar-gap);
  transform: translateX(-50%);
  height: var(--taskbar-h);
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  max-width: calc(100vw - 24px);
}

.task-pill {
  padding: 6px 14px;
  font-size: 11px;
  cursor: pointer;
}

#float-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 10;
}

#snap-preview {
  position: absolute;
  pointer-events: none;
  z-index: 10000;
  display: none;
  border-radius: 12px;
  left: var(--snap-x, 0px);
  top: var(--snap-y, 0px);
  width: var(--snap-w, 0px);
  height: var(--snap-h, 0px);
}

#snap-preview[data-on="true"] {
  display: block;
}

#overlay-dim {
  position: fixed;
  inset: 0;
  display: none;
  pointer-events: none;
  z-index: 40;
}

#overlay-dim[data-on="true"] {
  display: block;
  pointer-events: auto;
}

#overlay-host {
  position: fixed;
  left: 50%;
  top: 50%;
  width: min(720px, 80vw);
  height: min(70vh, 800px);
  transform: translate(-50%, -50%);
  display: none;
  pointer-events: none;
  z-index: 50;
}

#overlay-host[data-on="true"] {
  display: block;
  pointer-events: auto;
}

.panel-titlebar {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 44px;
  padding: 0 12px;
  cursor: move;
  user-select: none;
  flex-shrink: 0;
}

.panel-title {
  flex: 1;
}

.traffic {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tl {
  width: 12px;
  height: 12px;
  padding: 0;
  border: none;
  border-radius: 50%;
  cursor: pointer;
}

.panel-actions {
  display: flex;
  gap: 4px;
}

.panel-actions button {
  border-radius: 6px;
  font-size: 10px;
  padding: 2px 6px;
  cursor: pointer;
}

.panel-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-body:not(:has(.inspector)) {
  overflow: auto;
  padding: 10px;
}
```

No `backdrop-filter`, no wallpaper URL, no traffic-light colors in this file.

- [ ] **Step 3: Write `packages/themes/aetheris/tokens.css`**

```css
:root,
[data-theme="aetheris"] {
  --bg: #0b111e;
  --bg-panel: rgba(9, 14, 26, 0.82);
  --cyan: #4ee6e0;
  --cyan-dim: rgba(78, 230, 224, 0.35);
  --text: #ffffff;
  --muted: rgba(224, 235, 255, 0.62);
  --glass: rgba(11, 17, 30, 0.45);
  --glass-card: rgba(18, 26, 44, 0.65);
  --violet: #8a3ffc;
  --left-w: 320px;
  --right-w: 360px;
  --taskbar-h: 64px;
  --taskbar-gap: 12px;
  --font-sans: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
}

html,
body,
#app {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-sans);
}

#workspace {
  background: var(--bg);
}

#wallpaper {
  background-image: url("https://lh3.googleusercontent.com/aida/AEtjO1Uhx-09OkKAwv1WADA5WF7QRK6dVY5LVKAsYUadzmaJyYaEWaQJ8I5-ytvEUsTnjQiPn7tNESX3AXcEw8FTjGqTYXRs8TdVBi0eDooIvAagyq5YtD6wudNYt77uRZY5bw2ME7aawvIDV3l6LxKPqWhIGSVgkpiSr3WtyUXs50MhXKlDHjSXVvmPk0fAGxHRk__Dt6PmtPpztZyAHQrAYQwZkQIEZesau_fX3bU83ilUPFLsrDq_HGHmGyI");
  background-size: cover;
  background-position: center;
}

#wallpaper::after {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(5, 10, 20, 0.38);
  pointer-events: none;
}

.panel {
  background: var(--bg-panel);
  color: var(--text);
  border-radius: 16px;
  border: 1px solid var(--cyan-dim);
  box-shadow:
    0 24px 64px -12px rgba(0, 0, 0, 0.65),
    inset 0 1px 0 rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(40px) saturate(210%);
}

.panel[data-mode="maximized"] {
  border-radius: 0;
}

.panel[data-focus="true"] {
  box-shadow:
    0 0 0 1px var(--cyan),
    0 0 18px var(--cyan-dim),
    0 24px 64px -12px rgba(0, 0, 0, 0.65);
}

.panel.is-dragging,
.panel.is-dragging[data-focus="true"] {
  backdrop-filter: none;
  background: rgba(9, 14, 26, 0.92);
  box-shadow: 0 0 0 1px var(--cyan);
}

.panel-titlebar {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  font-family: var(--font-display);
  font-size: 13px;
}

.panel-title {
  letter-spacing: 0.04em;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
}

.tl {
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.35);
}

.tl-close {
  background: #ff5f56;
}

.tl-hide {
  background: #ffbd2e;
}

.tl-max {
  background: #27c93f;
}

.resize-handle {
  background: linear-gradient(135deg, transparent 50%, var(--cyan-dim) 50%);
}

#taskbar {
  border-radius: 20px;
  background: rgba(11, 17, 30, 0.62);
  backdrop-filter: blur(28px) saturate(190%);
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.18);
}

.task-pill {
  border: 1px solid var(--cyan-dim);
  background: rgba(9, 14, 26, 0.55);
  color: var(--text);
  border-radius: 999px;
  font-family: var(--font-display);
}

.task-pill[data-mode="float"],
.task-pill[data-mode="maximized"] {
  box-shadow: 0 0 12px var(--cyan-dim);
  border-color: var(--cyan);
}

.task-pill[data-mode="hidden"] {
  opacity: 0.7;
}

#snap-preview {
  border: 1px dashed var(--cyan);
  background: rgba(78, 230, 224, 0.08);
}

#overlay-dim {
  background: rgba(0, 8, 12, 0.62);
}

.slot-tab {
  border: 1px solid var(--cyan-dim);
  background: transparent;
  color: var(--muted);
}

.slot-tab[data-active="true"] {
  color: var(--text);
  background: var(--bg-panel);
  box-shadow: 0 0 12px var(--cyan-dim);
}

.panel-actions button {
  border: 1px solid var(--cyan-dim);
  background: transparent;
  color: var(--muted);
}
```

- [ ] **Step 4: Commit**

```bash
git add packages/compositor/src/compositor.css packages/desktop-shell/src/shell.css packages/themes/aetheris
git commit -m "feat: split compositor, shell, and aetheris CSS"
```

---

### Task 9: Shell-demo owns seed content

**Files:**
- Create: `apps/shell-demo/index.html`
- Create: `apps/shell-demo/vite.config.ts`
- Create: `apps/shell-demo/tsconfig.json`
- Create: `apps/shell-demo/src/vite-env.d.ts`
- Create: `apps/shell-demo/src/seed.ts`
- Create: `apps/shell-demo/src/seed.test.ts`
- Create: `apps/shell-demo/src/widgets/kanban.ts`
- Create: `apps/shell-demo/src/widgets/kanban.test.ts`
- Create: `apps/shell-demo/src/windows/task-104.ts`
- Create: `apps/shell-demo/src/windows/task-104.test.ts`
- Create: `apps/shell-demo/src/demo.css`
- Create: `apps/shell-demo/src/main.ts`

- [ ] **Step 1: Write failing demo tests**

`apps/shell-demo/src/seed.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { KNOWN_IDS, STORAGE_KEY, seedLayout } from "./seed";

describe("seedLayout", () => {
  it("seeds task-104 floating with empty slots", () => {
    const s = seedLayout();
    expect(s.version).toBe(2);
    expect(STORAGE_KEY).toBe("workshell.layout.v1");
    expect([...KNOWN_IDS]).toEqual(["task-104"]);
    expect(s.slots.left).toEqual({ width: 320, order: [], activeId: null });
    expect(s.slots.center).toEqual({ width: 0, order: [], activeId: null });
    expect(s.slots.right).toEqual({ width: 360, order: [], activeId: null });
    expect(s.overlay).toBeNull();
    expect(s.closed).toEqual([]);
    expect(s.panels["task-104"]).toMatchObject({
      id: "task-104",
      title: "TASK-104",
      mode: "float",
      x: 96,
      y: 48,
      w: 720,
      h: 520,
      z: 2,
    });
    expect(s.panels["task-104"].restore).toBeUndefined();
    expect(s.panels.backlog).toBeUndefined();
  });
});
```

`seed.ts` must re-export `STORAGE_KEY` from `@workshell/desktop-shell` so this import works.

`apps/shell-demo/src/widgets/kanban.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createDesktop } from "@workshell/desktop-shell";
import { seedLayout } from "../seed";
import { mountKanban } from "./kanban";

describe("kanban widget", () => {
  it("mounts four static lanes and is not a panel", () => {
    const root = document.createElement("div");
    const host = createDesktop(root);
    host.boot({
      theme: "aetheris",
      seed: seedLayout,
      storage: localStorage,
      fillWidgetLayer: mountKanban,
      fillPanelBody() {},
    });
    const layer = host.workspace.querySelector("#widget-layer")!;
    const lanes = layer.querySelectorAll("[data-purpose='kanban-lane']");
    expect(lanes.length).toBe(4);
    const titles = [...lanes].map((l) => l.querySelector("h2")?.textContent);
    expect(titles).toEqual([
      "Backlog / Ideias",
      "Em Progresso (Sprint 04)",
      "Revisão",
      "Concluído",
    ]);
    expect(layer.querySelector("[data-id]")).toBeNull();
    expect(layer.querySelector(".panel")).toBeNull();
  });
});
```

`apps/shell-demo/src/windows/task-104.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createDesktop } from "@workshell/desktop-shell";
import { seedLayout } from "../seed";
import { fillTask104 } from "./task-104";

describe("TASK-104 body", () => {
  it("paints the three-column inspector through fillPanelBody", () => {
    const root = document.createElement("div");
    const host = createDesktop(root);
    host.boot({
      theme: "aetheris",
      seed: seedLayout,
      storage: localStorage,
      fillWidgetLayer() {},
      fillPanelBody(id, el) {
        if (id === "task-104") fillTask104(el);
      },
    });
    const el = host.engine.node("task-104");
    expect(el.querySelector("[data-pane='chat']")).toBeTruthy();
    expect(el.querySelector("[data-pane='spec']")).toBeTruthy();
    expect(el.querySelector("[data-pane='attachments']")).toBeTruthy();
    expect(el.querySelector(".panel-title")?.textContent).toBe("TASK-104");
  });
});
```

- [ ] **Step 2: Run demo tests and confirm they fail**

Run: `npm test -- apps/shell-demo/src`

Expected: FAIL — modules missing.

- [ ] **Step 3: Implement demo app**

`apps/shell-demo/src/seed.ts` — move `KNOWN_IDS`, `KnownId`, `PANEL_META`, `seedLayout` from `src/layout/types.ts`. Import `DEFAULT_FLOAT`, `DEFAULT_LEFT_W`, `DEFAULT_RIGHT_W`, `type LayoutState` from `@workshell/desktop-shell` (re-exports).

`apps/shell-demo/src/widgets/kanban.ts` — byte-for-byte copy of `src/desktop/kanban.ts`.

`apps/shell-demo/src/windows/task-104.ts`:

```ts
export function fillTask104(host: HTMLElement): void {
  host.innerHTML = `<div class="inspector">
      <aside class="inspector-pane" data-pane="chat">
        <header class="inspector-pane-head">Chat</header>
        <div class="inspector-pane-body">
          <article class="msg">
            <strong>Helena Vaz • Tech Lead</strong>
            <p>Subi a revisão 2 da especificação do engine de inferência neural. Por favor, analisem as flags de shader no markdown ao centro.</p>
          </article>
          <article class="msg">
            <strong>Carlos Mendes • DevOps</strong>
            <p>Validado no cluster de testes. A compilação em WebAssembly gerou 14% menos overhead nos drivers Chromium v122.</p>
          </article>
          <article class="msg">
            <strong>José G. Gruber • Você</strong>
            <p>Perfeito. Estou abrindo o diagrama svg e o markdown de especificações agora para concluir os testes de memória de vídeo.</p>
          </article>
        </div>
      </aside>
      <section class="inspector-pane" data-pane="spec">
        <header class="inspector-pane-head">Spec</header>
        <div class="inspector-pane-body">
          <h2>SPEC_ENGINE_v2.md</h2>
          <p>Arquitetura de Renderização Neural Direta (SIMD / WebGPU)</p>
          <pre><code>export const neuralPipelineConfig = {
  devicePreference: 'high-performance',
  tensorPrecision: 'float16',
  bindingGroupLayout: {
    entries: [
      { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
      { binding: 1, visibility: GPUShaderStage.COMPUTE, storageTexture: { format: 'rgba16float' } }
    ]
  }
};</code></pre>
        </div>
      </section>
      <aside class="inspector-pane" data-pane="attachments">
        <header class="inspector-pane-head">Attachments</header>
        <ul class="file-list">
          <li class="file-row">SPEC_ENGINE_v2.md</li>
          <li class="file-row">Render_Mockup.png</li>
          <li class="file-row">Architecture_Diagram.svg</li>
          <li class="file-row">Benchmark_Results.csv</li>
        </ul>
      </aside>
    </div>`;
}
```

`apps/shell-demo/src/demo.css` — take every rule in `src/style.css` whose selector contains `kanban`, `inspector`, `file-list`, `file-row`, `.msg`, `.card`, `.cards`, `.gpu-host`, `.columns`, `.stats`, `.stat`, or `pre`. Do not copy `#wallpaper`, `.panel`, or `#taskbar`. Keep `backdrop-filter` on `.kanban-lane` / `.kanban-card` because those are seed-widget look using theme tokens (`var(--glass)`, `var(--glass-card)`, `var(--cyan)`).

`apps/shell-demo/src/main.ts`:

```ts
import { createDesktop } from "@workshell/desktop-shell";
import "@workshell/compositor/compositor.css";
import "@workshell/desktop-shell/shell.css";
import "@workshell/theme-aetheris/tokens.css";
import "./demo.css";
import { seedLayout } from "./seed";
import { mountKanban } from "./widgets/kanban";
import { fillTask104 } from "./windows/task-104";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("#app missing");

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

`apps/shell-demo/index.html` — copy repo-root `index.html`, change script to `/src/main.ts` (Vite root = this app).

`apps/shell-demo/vite.config.ts`:

```ts
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss()],
  server: { fs: { allow: ["../.."] } },
});
```

`apps/shell-demo/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "noEmit": true },
  "include": ["src"]
}
```

`apps/shell-demo/src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />
```

Demo `package.json` must also depend on `@workshell/compositor` if CSS import is `@workshell/compositor/compositor.css` — add `"@workshell/compositor": "*"` to `apps/shell-demo` dependencies (CSS only; no engine construct).

- [ ] **Step 4: Run demo tests and confirm they pass**

Run: `npm test -- apps/shell-demo/src`

Expected: PASS (seed + kanban + inspector).

- [ ] **Step 5: Commit**

```bash
git add apps/shell-demo packages/desktop-shell/package.json packages/themes
git commit -m "feat: shell-demo boots host and owns seed content"
```

---

### Task 10: Delete the blob and point the root at the demo

**Files:**
- Delete: `src/**`, root `index.html`, root `vite.config.ts`
- Modify: `package.json` (drop `dev:blob` if present)
- Modify: `tsconfig.json` include
- Modify: `vitest.config.ts` include (drop `src/**/*.test.ts`)
- Modify: `README.md`

- [ ] **Step 1: Remove blob paths**

```bash
rm -rf src index.html vite.config.ts
```

`tsconfig.json`:

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": { "noEmit": true },
  "include": ["packages", "apps"]
}
```

`vitest.config.ts` include: `["packages/**/*.test.ts", "apps/**/*.test.ts"]` only.

Root `package.json` scripts: `dev` / `build` / `test` as in Task 1. Remove `dev:blob`.

- [ ] **Step 2: Run the full suite**

Run: `npm test`

Expected: PASS. Count ≥ current 34 (compositor persist/engine + shell chrome/host + demo seed/kanban/inspector). Zero tests import `src/layout`. Zero compositor tests mention `task-104` except desktop-shell/demo.

Run: `npx tsc --noEmit -p packages/compositor/tsconfig.json` and the desktop-shell / shell-demo tsconfigs.

Expected: no errors.

- [ ] **Step 3: Update `README.md`**

```markdown
# Workshell

Compositor-first desktop shell (vanilla TypeScript) with an Aetheris theme and a seed demo. Not a full SPA. Not a WebGPU renderer.

Packages: `@workshell/compositor`, `@workshell/desktop-shell`, `@workshell/theme-aetheris`. App: `@workshell/shell-demo`.

## Run

```bash
npm install
npm run dev
```

Opens the shell-demo. Layout key: `localStorage["workshell.layout.v1"]` (`version: 2`). Clear it to restore the seed.

## Test

```bash
npm test
```

## Acceptance demo

1. Desktop shows wallpaper, four kanban lanes, taskbar, one **TASK-104** window. The board stays visible around the window.
2. Drag the window (titlebar) and resize from the bottom-right handle.
3. Maximize — fills the usable desktop and stops above the taskbar. Unmaximize restores the float rect.
4. Drag a maximized titlebar — it unmaximizes then floats.
5. Hide — window gone, taskbar pill remains. Pill restores. Hide while maximized restores maximized.
6. Close — no pill; reload does not bring the window back.
7. Reload keeps float / maximized / hidden. Console reparent logs: `isConnected` stays true and `uid` is stable while the window lives.

Seed: kanban widget (not a panel) + floating TASK-104, both filled by the demo through `boot({ fillWidgetLayer, fillPanelBody })`. Overlay and dock APIs exist but are not in the titlebar.
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: remove blob src; root runs shell-demo"
```

---

## Execution notes

- Shallower quality reviews (spec still, parent-only quality).
- Do not start `apps/spa`, extra themes, dock, snap, overlay chrome, or kanban DnD.
- After Task 10, `npm run dev` is `apps/shell-demo`. José starts it himself unless he asks.
- If leftover `localStorage["workshell.layout.v1"]` is version 1, it reseeds as v2 (unchanged).
