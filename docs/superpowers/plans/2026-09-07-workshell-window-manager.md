# Workshell Window Manager Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a running Vite + TypeScript + Tailwind window manager (Workshell) that docks, floats, overlays, persists, and moves panels on the compositor at 180 Hz.

**Architecture:** `WorkspaceEngine` owns `LayoutState`. Each panel is one DOM node, reparented (never cloned or rebuilt) between slot bodies, `#float-layer`, and `#overlay-host`. Gestures write `transform` / CSS size variables only; persist and reparent happen on `pointerup`. Overlay dim is a sibling *under* `#overlay-host` so the dim covers docks without covering the overlay panel.

**Tech Stack:** Vite, TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`), Vitest + happy-dom. No React, no docking library, no iframe, no WebGPU.

**Spec:** `docs/superpowers/specs/2026-09-07-workshell-window-manager-design.md`

---

## File map

| File | Responsibility |
|---|---|
| `package.json` | scripts: `dev`, `build`, `test` |
| `vite.config.ts` | Vite + Tailwind + Vitest happy-dom |
| `tsconfig.json` / `tsconfig.node.json` | TS project |
| `index.html` | `#app` mount |
| `.gitignore` | `node_modules`, `dist` |
| `README.md` | `npm install`, `npm run dev`, `npm test` |
| `src/style.css` | Tailwind import + compositor / chrome CSS |
| `src/main.ts` | boot chrome + engine |
| `src/layout/types.ts` | types, constants, `seedLayout()` |
| `src/layout/persist.ts` | `loadLayout` / `saveLayout` / `sanitizeLayout` |
| `src/layout/chrome.ts` | `buildWorkspace()` — topbar, slots, taskbar, layers |
| `src/layout/panels.ts` | `createPanel()` — one node, placeholders, GPU branch |
| `src/layout/engine.ts` | `WorkspaceEngine`, `mount()`, `snapZone()`, gestures |
| `src/layout/types.test.ts` | seed shape |
| `src/layout/persist.test.ts` | persist round-trip / corrupt / unknown ids |
| `src/layout/engine.test.ts` | dock/float/overlay/close/node identity/snapZone |

Do not put GPU/render code anywhere. Do not use a docking library.

**Overlay stacking (spec intent):** `#overlay-dim` must not paint on top of the overlay panel. Chrome order is `#float-layer` (floats + snap preview), then `#overlay-dim`, then `#overlay-host`. The host is **not** nested inside `#float-layer`.

**Pointer-path rules (every gesture task):** no `getBoundingClientRect` / `offsetWidth` / `clientWidth` in `pointermove`; no `localStorage` in `pointermove`; no Tailwind class toggles on the moving panel during move. `will-change: transform` only while dragging.

---

### Task 1: Vite + TypeScript + Tailwind + Vitest scaffold

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `index.html`
- Create: `src/vite-env.d.ts`
- Create: `src/main.ts`
- Create: `src/style.css`
- Create: `.gitignore`
- Create: `README.md`

- [ ] **Step 1: Write scaffold files**

`package.json`:

```json
{
  "name": "workshell",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
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

`vite.config.ts`:

```ts
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss()],
  test: {
    environment: "happy-dom",
  },
});
```

`tsconfig.json`:

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
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src"]
}
```

`tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true
  },
  "include": ["vite.config.ts"]
}
```

`index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Workshell</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

`src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />
```

`src/style.css`:

```css
@import "tailwindcss";
```

`src/main.ts`:

```ts
import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("#app missing");
app.textContent = "Workshell";
```

`.gitignore`:

```
node_modules
dist
.DS_Store
*.local
```

`README.md`:

```markdown
# Workshell

Minimal desktop-like window manager prototype (vanilla TypeScript + Vite + Tailwind). Not a full app. Not a WebGPU renderer.

## Run

```bash
npm install
npm run dev
```

Open the printed local URL. Layout persists in `localStorage` under `workshell.layout.v1`. Clear that key to reset seed panels.

## Test

```bash
npm test
```
```

- [ ] **Step 2: Install and verify the toolchain**

Run:

```bash
npm install
npx vitest run
npx tsc --noEmit
```

Expected: `vitest run` exits 0 with no test files (or “No test files found”). `tsc --noEmit` exits 0.

If Vitest 3 requires a triple-slash reference for `defineConfig` test field, add `/// <reference types="vitest/config" />` at the top of `vite.config.ts`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json vite.config.ts tsconfig.json tsconfig.node.json index.html src/main.ts src/style.css src/vite-env.d.ts .gitignore README.md
git commit -m "chore: scaffold Vite TypeScript Tailwind Vitest app"
```

---

### Task 2: Layout types and seed

**Files:**
- Create: `src/layout/types.ts`
- Test: `src/layout/types.test.ts`

- [ ] **Step 1: Write the failing test**

`src/layout/types.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { KNOWN_IDS, STORAGE_KEY, seedLayout } from "./types";

describe("seedLayout", () => {
  it("seeds the five panels into the spec slots", () => {
    const s = seedLayout();
    expect(s.version).toBe(1);
    expect(STORAGE_KEY).toBe("workshell.layout.v1");
    expect([...KNOWN_IDS]).toEqual(["backlog", "sprint", "chat", "spec", "metrics"]);
    expect(s.slots.left).toEqual({
      width: 320,
      order: ["backlog"],
      activeId: "backlog",
    });
    expect(s.slots.center).toEqual({
      width: 0,
      order: ["sprint", "chat"],
      activeId: "sprint",
    });
    expect(s.slots.right).toEqual({
      width: 360,
      order: ["spec"],
      activeId: "spec",
    });
    expect(s.panels.backlog.mode).toBe("dock");
    expect(s.panels.backlog.slot).toBe("left");
    expect(s.panels.sprint.mode).toBe("dock");
    expect(s.panels.chat.mode).toBe("dock");
    expect(s.panels.chat.slot).toBe("center");
    expect(s.panels.spec.mode).toBe("dock");
    expect(s.panels.spec.slot).toBe("right");
    expect(s.panels.metrics.mode).toBe("float");
    expect(s.panels.metrics.w).toBe(420);
    expect(s.panels.metrics.h).toBe(280);
    expect(s.overlay).toBeNull();
    expect(s.closed).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/layout/types.test.ts`

Expected: FAIL — cannot find module `./types`.

- [ ] **Step 3: Write `src/layout/types.ts`**

```ts
export const STORAGE_KEY = "workshell.layout.v1";

export const SNAP_EDGE_PX = 40;
export const FLOAT_OUT_THRESHOLD_PX = 8;
export const MIN_FLOAT_W = 240;
export const MIN_FLOAT_H = 160;
export const DEFAULT_LEFT_W = 320;
export const DEFAULT_RIGHT_W = 360;
export const DEFAULT_FLOAT = { x: 120, y: 96, w: 420, h: 280 } as const;

export const KNOWN_IDS = ["backlog", "sprint", "chat", "spec", "metrics"] as const;
export type KnownId = (typeof KNOWN_IDS)[number];

export const PANEL_META: Record<KnownId, { title: string }> = {
  backlog: { title: "Backlog / Ideas" },
  sprint: { title: "Sprint Board" },
  chat: { title: "Task Thread" },
  spec: { title: "Spec Viewer" },
  metrics: { title: "Benchmark Metrics" },
};

export type SlotId = "left" | "center" | "right";
export type Mode = "dock" | "float" | "overlay";

export type PanelState = {
  id: string;
  uid: string;
  title: string;
  mode: Mode;
  slot?: SlotId;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
};

export type SlotState = {
  width: number;
  order: string[];
  activeId: string | null;
};

export type OverlayState = {
  id: string;
  restore: { mode: Mode; slot?: SlotId };
} | null;

export type LayoutState = {
  version: 1;
  slots: {
    left: SlotState;
    center: SlotState;
    right: SlotState;
  };
  panels: Record<string, PanelState>;
  overlay: OverlayState;
  closed: string[];
  nextZ: number;
};

export function seedLayout(): LayoutState {
  const float = DEFAULT_FLOAT;
  return {
    version: 1,
    slots: {
      left: { width: DEFAULT_LEFT_W, order: ["backlog"], activeId: "backlog" },
      center: { width: 0, order: ["sprint", "chat"], activeId: "sprint" },
      right: { width: DEFAULT_RIGHT_W, order: ["spec"], activeId: "spec" },
    },
    panels: {
      backlog: {
        id: "backlog",
        uid: "",
        title: PANEL_META.backlog.title,
        mode: "dock",
        slot: "left",
        x: 80,
        y: 80,
        w: float.w,
        h: float.h,
        z: 1,
      },
      sprint: {
        id: "sprint",
        uid: "",
        title: PANEL_META.sprint.title,
        mode: "dock",
        slot: "center",
        x: 120,
        y: 90,
        w: 520,
        h: 360,
        z: 1,
      },
      chat: {
        id: "chat",
        uid: "",
        title: PANEL_META.chat.title,
        mode: "dock",
        slot: "center",
        x: 160,
        y: 110,
        w: 420,
        h: 480,
        z: 1,
      },
      spec: {
        id: "spec",
        uid: "",
        title: PANEL_META.spec.title,
        mode: "dock",
        slot: "right",
        x: 200,
        y: 100,
        w: 420,
        h: 520,
        z: 1,
      },
      metrics: {
        id: "metrics",
        uid: "",
        title: PANEL_META.metrics.title,
        mode: "float",
        slot: "right",
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

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/layout/types.test.ts`

Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/layout/types.ts src/layout/types.test.ts
git commit -m "feat: add layout types and seed state"
```

---

### Task 3: Persist load/save/sanitize

**Files:**
- Create: `src/layout/persist.ts`
- Test: `src/layout/persist.test.ts`

- [ ] **Step 1: Write the failing tests**

`src/layout/persist.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { loadLayout, saveLayout } from "./persist";
import { STORAGE_KEY, seedLayout } from "./types";

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
    const s = loadLayout(mem());
    expect(s.slots.left.order).toEqual(["backlog"]);
    expect(s.panels.metrics.mode).toBe("float");
  });

  it("seeds when JSON is corrupt", () => {
    const storage = mem({ [STORAGE_KEY]: "{not json" });
    expect(loadLayout(storage).version).toBe(1);
    expect(loadLayout(storage).panels.spec.title).toBe("Spec Viewer");
  });

  it("seeds when version is not 1", () => {
    const storage = mem({ [STORAGE_KEY]: JSON.stringify({ version: 2, panels: {} }) });
    expect(loadLayout(storage).slots.right.order).toEqual(["spec"]);
  });

  it("round-trips slot order, active tabs, float rects, and closed ids", () => {
    const storage = mem();
    const state = seedLayout();
    state.slots.center.activeId = "chat";
    state.panels.metrics.x = 44;
    state.panels.metrics.y = 66;
    state.closed = ["backlog"];
    state.slots.left.order = [];
    state.slots.left.activeId = null;
    delete state.panels.backlog;
    saveLayout(storage, state);
    const loaded = loadLayout(storage);
    expect(loaded.slots.center.activeId).toBe("chat");
    expect(loaded.panels.metrics.x).toBe(44);
    expect(loaded.panels.metrics.y).toBe(66);
    expect(loaded.closed).toEqual(["backlog"]);
    expect(loaded.slots.left.order).toEqual([]);
    expect(loaded.panels.backlog).toBeUndefined();
  });

  it("drops unknown panel ids from panels, orders, overlay, and closed", () => {
    const storage = mem();
    const state = seedLayout() as ReturnType<typeof seedLayout> & {
      panels: Record<string, unknown>;
    };
    state.panels.ghost = {
      id: "ghost",
      uid: "x",
      title: "Ghost",
      mode: "dock",
      slot: "left",
      x: 0,
      y: 0,
      w: 10,
      h: 10,
      z: 1,
    };
    state.slots.left.order = ["backlog", "ghost"];
    state.closed = ["nope"];
    state.overlay = {
      id: "ghost",
      restore: { mode: "dock", slot: "left" },
    };
    saveLayout(storage, state as ReturnType<typeof seedLayout>);
    const loaded = loadLayout(storage);
    expect(loaded.panels.ghost).toBeUndefined();
    expect(loaded.slots.left.order).toEqual(["backlog"]);
    expect(loaded.closed).toEqual([]);
    expect(loaded.overlay).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/layout/persist.test.ts`

Expected: FAIL — cannot find module `./persist`.

- [ ] **Step 3: Write `src/layout/persist.ts`**

```ts
import {
  KNOWN_IDS,
  type LayoutState,
  type Mode,
  type PanelState,
  type SlotId,
  type SlotState,
  STORAGE_KEY,
  seedLayout,
} from "./types";

const KNOWN = new Set<string>(KNOWN_IDS);

function isSlotId(v: unknown): v is SlotId {
  return v === "left" || v === "center" || v === "right";
}

function isMode(v: unknown): v is Mode {
  return v === "dock" || v === "float" || v === "overlay";
}

function sanitizeSlot(slot: SlotState | undefined, fallbackWidth: number): SlotState {
  const width = typeof slot?.width === "number" ? slot.width : fallbackWidth;
  const order = (slot?.order ?? []).filter((id) => KNOWN.has(id));
  const activeId =
    slot?.activeId && order.includes(slot.activeId) ? slot.activeId : (order[0] ?? null);
  return { width, order, activeId };
}

function sanitizePanel(id: string, raw: PanelState): PanelState {
  return {
    id,
    uid: typeof raw.uid === "string" ? raw.uid : "",
    title: typeof raw.title === "string" ? raw.title : id,
    mode: isMode(raw.mode) ? raw.mode : "dock",
    slot: isSlotId(raw.slot) ? raw.slot : undefined,
    x: typeof raw.x === "number" ? raw.x : 120,
    y: typeof raw.y === "number" ? raw.y : 96,
    w: typeof raw.w === "number" ? raw.w : 420,
    h: typeof raw.h === "number" ? raw.h : 280,
    z: typeof raw.z === "number" ? raw.z : 1,
  };
}

export function sanitizeLayout(parsed: LayoutState): LayoutState {
  if (!parsed.slots || !parsed.panels) return seedLayout();
  const panels: Record<string, PanelState> = {};
  for (const id of Object.keys(parsed.panels)) {
    if (!KNOWN.has(id)) continue;
    panels[id] = sanitizePanel(id, parsed.panels[id]);
  }
  const closedKnown = (parsed.closed ?? []).filter((id) => KNOWN.has(id));
  const overlayRaw = parsed.overlay;
  const overlay =
    overlayRaw && KNOWN.has(overlayRaw.id) && panels[overlayRaw.id]
      ? {
          id: overlayRaw.id,
          restore: {
            mode: isMode(overlayRaw.restore?.mode) ? overlayRaw.restore.mode : "float",
            slot: isSlotId(overlayRaw.restore?.slot) ? overlayRaw.restore.slot : undefined,
          },
        }
      : null;
  return {
    version: 1,
    slots: {
      left: sanitizeSlot(parsed.slots.left, 320),
      center: sanitizeSlot(parsed.slots.center, 0),
      right: sanitizeSlot(parsed.slots.right, 360),
    },
    panels,
    overlay,
    closed: closedKnown,
    nextZ: typeof parsed.nextZ === "number" ? parsed.nextZ : 3,
  };
}

export function loadLayout(storage: Storage): LayoutState {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return seedLayout();
  try {
    const parsed = JSON.parse(raw) as LayoutState;
    if (parsed?.version !== 1) return seedLayout();
    return sanitizeLayout(parsed);
  } catch {
    return seedLayout();
  }
}

export function saveLayout(storage: Storage, state: LayoutState): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}
```

Closed ids stay in `closed` even if the panel record was deleted. `boot` skips mounting any id in `closed`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/layout/persist.test.ts`

Expected: PASS (5 tests). If the round-trip test fails because `delete state.panels.backlog` plus `closed: ["backlog"]` is dropped by an over-eager filter, keep closed ids that are known even when the panel record is missing.

- [ ] **Step 5: Commit**

```bash
git add src/layout/persist.ts src/layout/persist.test.ts
git commit -m "feat: persist layout to localStorage with seed-on-corrupt"
```

---

### Task 4: Workspace chrome DOM and compositor CSS

**Files:**
- Create: `src/layout/chrome.ts`
- Modify: `src/style.css`
- Test: `src/layout/chrome.test.ts`

- [ ] **Step 1: Write the failing test**

`src/layout/chrome.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildWorkspace } from "./chrome";

describe("buildWorkspace", () => {
  it("builds slots, float layer, overlay host above dim, and taskbar", () => {
    const root = document.createElement("div");
    const hosts = buildWorkspace(root);
    expect(hosts.workspace.id).toBe("workspace");
    expect(hosts.left.id).toBe("dock-left");
    expect(hosts.center.id).toBe("dock-center");
    expect(hosts.right.id).toBe("dock-right");
    expect(hosts.floatLayer.id).toBe("float-layer");
    expect(hosts.snapPreview.id).toBe("snap-preview");
    expect(hosts.overlayDim.id).toBe("overlay-dim");
    expect(hosts.overlayHost.id).toBe("overlay-host");
    expect(hosts.taskbar.id).toBe("taskbar");
    expect(root.querySelector("#topbar")?.textContent).toContain("WORKSHELL OS // ENGINE CORE");
    const dimIndex = [...hosts.workspace.children].indexOf(hosts.overlayDim);
    const hostIndex = [...hosts.workspace.children].indexOf(hosts.overlayHost);
    expect(hostIndex).toBeGreaterThan(dimIndex);
    expect(getComputedStyle(hosts.floatLayer).pointerEvents).not.toBe("auto");
  });
});
```

`getComputedStyle` in happy-dom may not apply stylesheet. If `pointerEvents` is empty, drop that assertion and assert `hosts.floatLayer.style.pointerEvents === "none"` (set as a style in `buildWorkspace`) **or** assert the element has class `pointer-events-none` and id `float-layer`. Prefer asserting DOM ids/order; do not fail the task on computed CSS.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/layout/chrome.test.ts`

Expected: FAIL — cannot find module `./chrome`.

- [ ] **Step 3: Write `src/layout/chrome.ts`**

```ts
export type EngineHosts = {
  workspace: HTMLElement;
  left: HTMLElement;
  center: HTMLElement;
  right: HTMLElement;
  leftTabs: HTMLElement;
  centerTabs: HTMLElement;
  rightTabs: HTMLElement;
  leftBody: HTMLElement;
  centerBody: HTMLElement;
  rightBody: HTMLElement;
  floatLayer: HTMLElement;
  overlayHost: HTMLElement;
  overlayDim: HTMLElement;
  snapPreview: HTMLElement;
  taskbar: HTMLElement;
};

function slot(id: "dock-left" | "dock-center" | "dock-right", side: "left" | "center" | "right"): HTMLElement {
  const el = document.createElement("section");
  el.id = id;
  el.className = `slot slot-${side}`;
  el.dataset.slot = side;
  const tabs = document.createElement("div");
  tabs.className = "slot-tabs";
  tabs.dataset.slotTabs = side;
  const body = document.createElement("div");
  body.className = "slot-body";
  body.dataset.slotBody = side;
  el.append(tabs, body);
  if (side === "left" || side === "right") {
    const handle = document.createElement("div");
    handle.className = "slot-resizer";
    handle.dataset.resizeSlot = side;
    el.append(handle);
  }
  return el;
}

export function buildWorkspace(root: HTMLElement): EngineHosts {
  root.replaceChildren();
  const workspace = document.createElement("div");
  workspace.id = "workspace";

  const topbar = document.createElement("header");
  topbar.id = "topbar";
  topbar.textContent = "WORKSHELL OS // ENGINE CORE";

  const dockRow = document.createElement("div");
  dockRow.id = "dock-row";
  const left = slot("dock-left", "left");
  const center = slot("dock-center", "center");
  const right = slot("dock-right", "right");
  dockRow.append(left, center, right);

  const taskbar = document.createElement("nav");
  taskbar.id = "taskbar";

  const floatLayer = document.createElement("div");
  floatLayer.id = "float-layer";
  floatLayer.style.pointerEvents = "none";

  const snapPreview = document.createElement("div");
  snapPreview.id = "snap-preview";
  snapPreview.setAttribute("aria-hidden", "true");
  floatLayer.append(snapPreview);

  const overlayDim = document.createElement("div");
  overlayDim.id = "overlay-dim";

  const overlayHost = document.createElement("div");
  overlayHost.id = "overlay-host";

  workspace.append(topbar, dockRow, taskbar, floatLayer, overlayDim, overlayHost);
  root.append(workspace);

  return {
    workspace,
    left,
    center,
    right,
    leftTabs: left.querySelector("[data-slot-tabs='left']") as HTMLElement,
    centerTabs: center.querySelector("[data-slot-tabs='center']") as HTMLElement,
    rightTabs: right.querySelector("[data-slot-tabs='right']") as HTMLElement,
    leftBody: left.querySelector("[data-slot-body='left']") as HTMLElement,
    centerBody: center.querySelector("[data-slot-body='center']") as HTMLElement,
    rightBody: right.querySelector("[data-slot-body='right']") as HTMLElement,
    floatLayer,
    overlayHost,
    overlayDim,
    snapPreview,
    taskbar,
  };
}
```

- [ ] **Step 4: Replace `src/style.css` with chrome + compositor rules**

```css
@import "tailwindcss";

:root {
  --bg: #041016;
  --bg-panel: #071a22;
  --cyan: #4ee6e0;
  --cyan-dim: rgba(78, 230, 224, 0.35);
  --text: #d7f6ff;
  --muted: #7aa8b0;
  --left-w: 320px;
  --right-w: 360px;
}

html,
body,
#app {
  height: 100%;
  margin: 0;
  overflow: hidden;
  background: var(--bg);
  color: var(--text);
  font-family: ui-sans-serif, system-ui, sans-serif;
}

#workspace {
  width: 100vw;
  height: 100vh;
  display: grid;
  grid-template-rows: 40px 1fr 36px;
  background-color: var(--bg);
  background-image:
    linear-gradient(rgba(78, 230, 224, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(78, 230, 224, 0.04) 1px, transparent 1px);
  background-size: 32px 32px;
}

#topbar {
  display: flex;
  align-items: center;
  padding: 0 16px;
  letter-spacing: 0.14em;
  font-size: 12px;
  color: var(--cyan);
  border-bottom: 1px solid var(--cyan-dim);
  background: rgba(4, 16, 22, 0.92);
}

#dock-row {
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
  border: 1px solid var(--cyan-dim);
  background: transparent;
  color: var(--muted);
  border-radius: 8px 8px 0 0;
  padding: 2px 10px;
  font-size: 11px;
  cursor: pointer;
}

.slot-tab[data-active="true"] {
  color: var(--text);
  background: var(--bg-panel);
  box-shadow: 0 0 12px var(--cyan-dim);
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
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  border-top: 1px solid var(--cyan-dim);
  background: rgba(4, 16, 22, 0.92);
}

.task-pill {
  border: 1px solid var(--cyan-dim);
  background: #062028;
  color: var(--text);
  border-radius: 999px;
  padding: 2px 12px;
  font-size: 11px;
  cursor: pointer;
}

.task-pill[data-mode="float"] {
  box-shadow: 0 0 8px var(--cyan-dim);
}

#float-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 20;
}

#snap-preview {
  position: absolute;
  pointer-events: none;
  display: none;
  border: 1px dashed var(--cyan);
  background: rgba(78, 230, 224, 0.08);
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
  background: rgba(0, 8, 12, 0.62);
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

.panel {
  pointer-events: auto;
  contain: layout paint;
  display: flex;
  flex-direction: column;
  background: var(--bg-panel);
  color: var(--text);
  border-radius: 12px;
  border: 1px solid var(--cyan-dim);
  box-shadow: 0 0 0 1px rgba(40, 180, 180, 0.12);
  overflow: hidden;
  min-width: 0;
  min-height: 0;
}

.panel[data-mode="dock"] {
  position: absolute;
  inset: 0;
  transform: none;
  width: auto;
  height: auto;
}

.panel[data-mode="dock"][hidden] {
  display: none;
}

.panel[data-mode="float"] {
  position: absolute;
  left: 0;
  top: 0;
  width: var(--w);
  height: var(--h);
  transform: translate3d(var(--x), var(--y), 0);
  z-index: var(--z);
}

.panel[data-mode="overlay"] {
  width: 100%;
  height: 100%;
  transform: none;
}

.panel[data-focus="true"] {
  box-shadow: 0 0 0 1px var(--cyan), 0 0 18px var(--cyan-dim);
}

.panel.is-dragging {
  will-change: transform;
  box-shadow: 0 0 0 1px var(--cyan);
}

.panel-titlebar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  cursor: grab;
  user-select: none;
  border-bottom: 1px solid var(--cyan-dim);
  font-size: 12px;
}

.panel-title {
  flex: 1;
  letter-spacing: 0.04em;
}

.panel-actions {
  display: flex;
  gap: 4px;
}

.panel-actions button {
  border: 1px solid var(--cyan-dim);
  background: transparent;
  color: var(--muted);
  border-radius: 6px;
  font-size: 10px;
  padding: 2px 6px;
  cursor: pointer;
}

.panel-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 10px;
}

.resize-handle {
  display: none;
  position: absolute;
  right: 0;
  bottom: 0;
  width: 14px;
  height: 14px;
  cursor: nwse-resize;
  background:
    linear-gradient(135deg, transparent 50%, var(--cyan-dim) 50%);
}

.panel[data-mode="float"] .resize-handle {
  display: block;
}

.cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card,
.msg,
.stat {
  border: 1px solid var(--cyan-dim);
  border-radius: 8px;
  padding: 8px 10px;
  background: rgba(4, 20, 28, 0.6);
}

.columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  height: 100%;
}

pre {
  margin: 8px 0 0;
  padding: 8px;
  background: #031014;
  border-radius: 8px;
  overflow: auto;
  font-size: 12px;
}

.stats {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.gpu-host {
  width: 100%;
  height: 100%;
  background: #000;
  color: var(--muted);
  display: flex;
  align-items: center;
  justify-content: center;
}
```

- [ ] **Step 5: Run chrome tests**

Run: `npx vitest run src/layout/chrome.test.ts`

Expected: PASS. Adjust the pointer-events assertion if happy-dom does not compute it.

- [ ] **Step 6: Commit**

```bash
git add src/layout/chrome.ts src/layout/chrome.test.ts src/style.css
git commit -m "feat: add workspace chrome and compositor CSS"
```

---

### Task 5: Panel factory (placeholders + uid)

**Files:**
- Create: `src/layout/panels.ts`
- Test: `src/layout/panels.test.ts`

- [ ] **Step 1: Write the failing tests**

`src/layout/panels.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createPanel } from "./panels";

describe("createPanel", () => {
  it("stamps id and uid and never requires a second node for the same call result", () => {
    const el = createPanel("spec");
    expect(el.dataset.id).toBe("spec");
    expect(el.dataset.uid).toMatch(/./);
    expect(el.querySelector(".panel-title")?.textContent).toBe("Spec Viewer");
    expect(el.querySelectorAll("[data-action]").length).toBe(4);
    expect(el.querySelector("pre")).not.toBeNull();
  });

  it("renders placeholder bodies", () => {
    expect(createPanel("backlog").querySelectorAll(".card").length).toBe(2);
    expect(createPanel("sprint").querySelectorAll(".column").length).toBe(2);
    expect(createPanel("chat").querySelectorAll(".msg").length).toBe(3);
    const metrics = createPanel("metrics");
    expect(metrics.textContent).toContain("4.12 ms");
    expect(metrics.textContent).toContain("340 MB");
    expect(metrics.textContent).toContain("144 Hz");
  });

  it("GPU Preview is a black canvas placeholder", () => {
    const el = createPanel("gpu-preview", "GPU Preview");
    expect(el.querySelector("canvas")).not.toBeNull();
    expect(el.textContent).toContain("WebGPU host");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/layout/panels.test.ts`

Expected: FAIL — cannot find module `./panels`.

- [ ] **Step 3: Write `src/layout/panels.ts`**

```ts
import { PANEL_META, type KnownId } from "./types";

function uid(): string {
  return crypto.randomUUID();
}

function bodyFor(id: string, title: string): string {
  if (title === "GPU Preview") {
    return `<div class="gpu-host"><canvas width="16" height="16"></canvas><span>WebGPU host</span></div>`;
  }
  switch (id) {
    case "backlog":
      return `<div class="cards"><article class="card">Capture holographic snap zones</article><article class="card">Keep panel nodes alive across dock/float</article></div>`;
    case "sprint":
      return `<div class="columns"><div class="column card"><h3>Doing</h3><article class="card">Window manager pointer path</article></div><div class="column card"><h3>Done</h3><article class="card">Seed layout</article></div></div>`;
    case "chat":
      return `<div class="cards"><p class="msg"><strong>sys</strong> overlay restores previous mode</p><p class="msg"><strong>dev</strong> reparent, do not clone</p><p class="msg"><strong>sys</strong> persist on pointerup only</p></div>`;
    case "spec":
      return `<div><h2>Spec Viewer</h2><p>Layout engine contract</p><pre><code>mount(node, host) // same node</code></pre></div>`;
    case "metrics":
      return `<div class="stats"><div class="stat">4.12 ms</div><div class="stat">340 MB</div><div class="stat">144 Hz</div></div>`;
    default:
      return `<div class="card">${title}</div>`;
  }
}

export function createPanel(id: string, title?: string): HTMLElement {
  const resolvedTitle =
    title ?? (id in PANEL_META ? PANEL_META[id as KnownId].title : id);
  const el = document.createElement("section");
  el.className = "panel";
  el.dataset.id = id;
  el.dataset.uid = uid();
  el.innerHTML = `
    <div class="panel-titlebar">
      <span class="panel-title"></span>
      <div class="panel-actions">
        <button type="button" data-action="dock">Dock</button>
        <button type="button" data-action="float">Float</button>
        <button type="button" data-action="overlay">Overlay</button>
        <button type="button" data-action="close">Close</button>
      </div>
    </div>
    <div class="panel-body"></div>
    <div class="resize-handle" data-resize="1"></div>
  `;
  el.querySelector(".panel-title")!.textContent = resolvedTitle;
  el.querySelector(".panel-body")!.innerHTML = bodyFor(id, resolvedTitle);
  return el;
}
```

`createPanel` may set `innerHTML` **once at creation**. It must never be called again for an existing id. The engine must not rebuild the node.

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/layout/panels.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/layout/panels.ts src/layout/panels.test.ts
git commit -m "feat: create durable panel nodes with placeholder bodies"
```

---

### Task 6: WorkspaceEngine commit path (mount/dock/float/overlay/close/tabs)

**Files:**
- Create: `src/layout/engine.ts`
- Test: `src/layout/engine.test.ts`

This task does **not** implement drag/resize yet. It must implement `mount`, mode changes, tabs, overlay dim click restore, persist on commit, and reparent logging.

- [ ] **Step 1: Write the failing tests**

`src/layout/engine.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { buildWorkspace } from "./chrome";
import { WorkspaceEngine, snapZone } from "./engine";
import { createPanel } from "./panels";
import { STORAGE_KEY } from "./types";

function boot(storage: Storage = localStorage): {
  engine: WorkspaceEngine;
  hosts: ReturnType<typeof buildWorkspace>;
} {
  localStorage.clear();
  const root = document.createElement("div");
  document.body.append(root);
  const hosts = buildWorkspace(root);
  const engine = new WorkspaceEngine(hosts, storage);
  engine.boot(createPanel);
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

  it("preserves the same node and uid across float and dock", () => {
    const { engine, hosts } = boot();
    const before = engine.node("spec");
    const uid = before.dataset.uid;
    expect(before.parentElement).toBe(hosts.rightBody);
    engine.float("spec");
    expect(before.isConnected).toBe(true);
    expect(before.dataset.uid).toBe(uid);
    expect(before.parentElement).toBe(hosts.floatLayer);
    engine.dock("spec", "right");
    expect(before.isConnected).toBe(true);
    expect(before.dataset.uid).toBe(uid);
    expect(before.parentElement).toBe(hosts.rightBody);
    expect(before).toBe(engine.node("spec"));
  });

  it("stacks docked panels as tabs and can overlay then restore", () => {
    const { engine, hosts } = boot();
    const chat = engine.node("chat");
    expect(engine.state.slots.center.order).toEqual(["sprint", "chat"]);
    engine.activateTab("center", "chat");
    expect(engine.state.slots.center.activeId).toBe("chat");
    expect(chat.hasAttribute("hidden")).toBe(false);
    engine.overlay("chat");
    expect(chat.parentElement).toBe(hosts.overlayHost);
    expect(hosts.overlayDim.dataset.on).toBe("true");
    hosts.overlayDim.click();
    expect(engine.state.panels.chat.mode).toBe("dock");
    expect(chat.parentElement).toBe(hosts.centerBody);
  });

  it("close removes the panel from the slot and records closed", () => {
    const { engine } = boot();
    const metrics = engine.node("metrics");
    engine.close("metrics");
    expect(metrics.isConnected).toBe(false);
    expect(engine.state.closed).toContain("metrics");
    expect(engine.state.slots.right.order).not.toContain("metrics");
  });

  it("persist round-trips after dock/float", () => {
    const { engine } = boot();
    engine.float("spec", { x: 40, y: 50, w: 300, h: 220 });
    engine.persist();
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(raw.panels.spec.mode).toBe("float");
    expect(raw.panels.spec.x).toBe(40);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/layout/engine.test.ts`

Expected: FAIL — cannot find module `./engine`.

- [ ] **Step 3: Write `src/layout/engine.ts` (commit path + snapZone, no drag yet)**

```ts
import type { EngineHosts } from "./chrome";
import { loadLayout, saveLayout } from "./persist";
import {
  DEFAULT_FLOAT,
  MIN_FLOAT_H,
  MIN_FLOAT_W,
  SNAP_EDGE_PX,
  type LayoutState,
  type SlotId,
} from "./types";

export function snapZone(
  clientX: number,
  viewportW: number,
  _leftW: number,
  _rightW: number,
): SlotId | null {
  if (clientX <= SNAP_EDGE_PX) return "left";
  if (clientX >= viewportW - SNAP_EDGE_PX) return "right";
  const third = viewportW / 3;
  if (clientX >= third && clientX <= third * 2) return "center";
  return null;
}

export class WorkspaceEngine {
  state: LayoutState;
  private nodes = new Map<string, HTMLElement>();

  constructor(
    private hosts: EngineHosts,
    private storage: Storage = localStorage,
  ) {
    this.state = loadLayout(storage);
  }

  node(id: string): HTMLElement {
    const el = this.nodes.get(id);
    if (!el) throw new Error(`unknown panel ${id}`);
    return el;
  }

  boot(createPanel: (id: string) => HTMLElement): void {
    this.applySlotWidths();
    for (const id of Object.keys(this.state.panels)) {
      if (this.state.closed.includes(id)) continue;
      const el = createPanel(id);
      this.nodes.set(id, el);
      this.state.panels[id].uid = el.dataset.uid ?? "";
      this.bindPanel(el);
      this.applyMode(id);
    }
    this.renderTabs();
    this.renderTaskbar();
    this.applyOverlayChrome();
    this.hosts.overlayDim.addEventListener("click", () => {
      const id = this.state.overlay?.id;
      if (id) this.restoreOverlay();
    });
  }

  persist(): void {
    saveLayout(this.storage, this.state);
  }

  /**
   * Reparent the same panel node. Never clone, never innerHTML-replace the panel.
   * The node must stay isConnected after this call (unless the host is detached).
   */
  mount(panelEl: HTMLElement, targetHost: HTMLElement): void {
    targetHost.appendChild(panelEl);
    console.info("[workshell] reparent", {
      id: panelEl.dataset.id,
      uid: panelEl.dataset.uid,
      isConnected: panelEl.isConnected,
      parent: targetHost.id || targetHost.dataset.slotBody,
    });
  }

  dock(id: string, slot: SlotId): void {
    const panel = this.state.panels[id];
    if (!panel) return;
    if (this.state.overlay?.id === id) this.state.overlay = null;
    this.removeFromSlots(id);
    panel.mode = "dock";
    panel.slot = slot;
    const s = this.state.slots[slot];
    if (!s.order.includes(id)) s.order.push(id);
    s.activeId = id;
    this.applyMode(id);
    this.renderTabs();
    this.renderTaskbar();
    this.applyOverlayChrome();
    this.persist();
  }

  float(id: string, rect?: { x: number; y: number; w: number; h: number }): void {
    const panel = this.state.panels[id];
    if (!panel) return;
    if (this.state.overlay?.id === id) this.state.overlay = null;
    this.removeFromSlots(id);
    panel.mode = "float";
    if (rect) {
      panel.x = rect.x;
      panel.y = rect.y;
      panel.w = rect.w;
      panel.h = rect.h;
    } else if (!panel.w || !panel.h) {
      panel.x = DEFAULT_FLOAT.x;
      panel.y = DEFAULT_FLOAT.y;
      panel.w = DEFAULT_FLOAT.w;
      panel.h = DEFAULT_FLOAT.h;
    }
    this.focus(id, false);
    this.applyMode(id);
    this.renderTabs();
    this.renderTaskbar();
    this.applyOverlayChrome();
    this.persist();
  }

  overlay(id: string): void {
    const panel = this.state.panels[id];
    if (!panel) return;
    if (this.state.overlay?.id === id) return;
    this.state.overlay = {
      id,
      restore: { mode: panel.mode, slot: panel.slot },
    };
    this.removeFromSlots(id);
    panel.mode = "overlay";
    this.applyMode(id);
    this.renderTabs();
    this.renderTaskbar();
    this.applyOverlayChrome();
    this.persist();
  }

  restoreOverlay(): void {
    const overlay = this.state.overlay;
    if (!overlay) return;
    const { id, restore } = overlay;
    this.state.overlay = null;
    if (restore.mode === "dock" && restore.slot) this.dock(id, restore.slot);
    else this.float(id);
  }

  close(id: string): void {
    const panel = this.state.panels[id];
    if (!panel) return;
    if (this.state.overlay?.id === id) this.state.overlay = null;
    this.removeFromSlots(id);
    if (!this.state.closed.includes(id)) this.state.closed.push(id);
    const el = this.nodes.get(id);
    el?.remove();
    this.nodes.delete(id);
    this.renderTabs();
    this.renderTaskbar();
    this.applyOverlayChrome();
    this.persist();
  }

  focus(id: string, persist = true): void {
    const panel = this.state.panels[id];
    if (!panel) return;
    if (panel.mode === "dock" && panel.slot) this.activateTab(panel.slot, id, persist);
    if (panel.mode === "float") {
      panel.z = this.state.nextZ++;
      const el = this.nodes.get(id);
      if (el) el.style.setProperty("--z", String(panel.z));
    }
    for (const [pid, node] of this.nodes) {
      node.dataset.focus = pid === id ? "true" : "false";
    }
    if (persist) this.persist();
  }

  activateTab(slot: SlotId, id: string, persist = true): void {
    this.state.slots[slot].activeId = id;
    for (const pid of this.state.slots[slot].order) {
      const el = this.nodes.get(pid);
      if (!el) continue;
      if (pid === id) el.removeAttribute("hidden");
      else el.setAttribute("hidden", "");
    }
    this.renderTabs();
    if (persist) this.persist();
  }

  setSlotWidth(slot: "left" | "right", px: number): void {
    const width = Math.max(180, px);
    this.state.slots[slot].width = width;
    this.applySlotWidths();
    this.persist();
  }

  private applySlotWidths(): void {
    this.hosts.workspace.style.setProperty("--left-w", `${this.state.slots.left.width}px`);
    this.hosts.workspace.style.setProperty("--right-w", `${this.state.slots.right.width}px`);
  }

  private removeFromSlots(id: string): void {
    (["left", "center", "right"] as SlotId[]).forEach((slot) => {
      const s = this.state.slots[slot];
      s.order = s.order.filter((x) => x !== id);
      if (s.activeId === id) s.activeId = s.order[0] ?? null;
      this.activateTab(slot, s.activeId ?? "", false);
    });
  }

  private applyMode(id: string): void {
    const panel = this.state.panels[id];
    const el = this.nodes.get(id);
    if (!panel || !el) return;
    el.dataset.mode = panel.mode;
    el.style.setProperty("--x", `${panel.x}px`);
    el.style.setProperty("--y", `${panel.y}px`);
    el.style.setProperty("--w", `${Math.max(MIN_FLOAT_W, panel.w)}px`);
    el.style.setProperty("--h", `${Math.max(MIN_FLOAT_H, panel.h)}px`);
    el.style.setProperty("--z", String(panel.z));
    el.style.transform = "";
    if (panel.mode === "dock" && panel.slot) {
      const body = this.slotBody(panel.slot);
      this.mount(el, body);
      const active = this.state.slots[panel.slot].activeId === id;
      if (active) el.removeAttribute("hidden");
      else el.setAttribute("hidden", "");
    } else if (panel.mode === "float") {
      el.removeAttribute("hidden");
      this.mount(el, this.hosts.floatLayer);
    } else {
      el.removeAttribute("hidden");
      this.mount(el, this.hosts.overlayHost);
    }
  }

  private slotBody(slot: SlotId): HTMLElement {
    if (slot === "left") return this.hosts.leftBody;
    if (slot === "right") return this.hosts.rightBody;
    return this.hosts.centerBody;
  }

  private slotTabs(slot: SlotId): HTMLElement {
    if (slot === "left") return this.hosts.leftTabs;
    if (slot === "right") return this.hosts.rightTabs;
    return this.hosts.centerTabs;
  }

  private applyOverlayChrome(): void {
    const on = Boolean(this.state.overlay);
    this.hosts.overlayDim.dataset.on = on ? "true" : "false";
    this.hosts.overlayHost.dataset.on = on ? "true" : "false";
  }

  private renderTabs(): void {
    (["left", "center", "right"] as SlotId[]).forEach((slot) => {
      const host = this.slotTabs(slot);
      host.replaceChildren();
      for (const id of this.state.slots[slot].order) {
        const panel = this.state.panels[id];
        if (!panel) continue;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "slot-tab";
        btn.textContent = panel.title;
        btn.dataset.active = this.state.slots[slot].activeId === id ? "true" : "false";
        btn.addEventListener("click", () => this.activateTab(slot, id));
        host.append(btn);
      }
    });
  }

  private renderTaskbar(): void {
    this.hosts.taskbar.replaceChildren();
    for (const [id, panel] of Object.entries(this.state.panels)) {
      if (this.state.closed.includes(id)) continue;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "task-pill";
      btn.dataset.mode = panel.mode;
      btn.textContent = `${panel.title} · ${panel.mode}`;
      btn.addEventListener("click", () => this.focus(id));
      this.hosts.taskbar.append(btn);
    }
  }

  private bindPanel(el: HTMLElement): void {
    const id = el.dataset.id!;
    el.addEventListener("pointerdown", () => this.focus(id));
    el.querySelectorAll<HTMLButtonElement>("[data-action]").forEach((btn) => {
      btn.addEventListener("pointerdown", (e) => e.stopPropagation());
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        if (action === "close") this.close(id);
        else if (action === "float") this.float(id);
        else if (action === "overlay") this.overlay(id);
        else if (action === "dock") {
          const panel = this.state.panels[id];
          if (panel.mode === "dock") return;
          this.dock(id, panel.slot ?? "right");
        }
      });
    });
  }
}
```

`activateTab` must treat an empty `id` as “no active tab” (hide all in that slot). Use this body, not a version that requires a real id:

```ts
  activateTab(slot: SlotId, id: string, persist = true): void {
    this.state.slots[slot].activeId = id || null;
    for (const pid of this.state.slots[slot].order) {
      const el = this.nodes.get(pid);
      if (!el) continue;
      if (id && pid === id) el.removeAttribute("hidden");
      else el.setAttribute("hidden", "");
    }
    this.renderTabs();
    if (persist) this.persist();
  }
```

That `activateTab` implementation is the one to ship (replace the earlier `activateTab` in the same file). `FLOAT_OUT_THRESHOLD_PX` is used in Task 7.

- [ ] **Step 4: Run engine tests**

Run: `npx vitest run src/layout/engine.test.ts`

Expected: PASS. Fix overlay restore if `removeFromSlots` during overlay already dropped chat from center order — `restore.slot` must still dock it back (and `dock` pushes onto `order`). Confirm `overlay()` saves `restore` **before** `removeFromSlots`.

- [ ] **Step 5: Commit**

```bash
git add src/layout/engine.ts src/layout/engine.test.ts
git commit -m "feat: reparenting window engine dock float overlay close"
```

---

### Task 7: Gestures (drag, snap, resize, float-out, slot width)

**Files:**
- Modify: `src/layout/engine.ts`
- Modify: `src/layout/engine.test.ts`

Hard rules: `pointermove` writes `el.style.transform` (drag) or `--w`/`--h` (resize) only. No layout reads. No `saveLayout`. Snap preview uses CSS variables on `#snap-preview` and `data-on`.

Add `FLOAT_OUT_THRESHOLD_PX` to the `./types` import in `engine.ts`.

- [ ] **Step 1: Add gesture tests**

Append to `src/layout/engine.test.ts`:

```ts
describe("gestures", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    localStorage.clear();
  });

  it("docks a floating panel on pointerup in the right snap zone", () => {
    const { engine, hosts } = boot();
    engine.float("spec", { x: 100, y: 80, w: 300, h: 220 });
    const el = engine.node("spec");
    const bar = el.querySelector(".panel-titlebar")!;
    bar.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, clientX: 120, clientY: 90, pointerId: 1 }),
    );
    window.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, clientX: 1790, clientY: 90, pointerId: 1 }),
    );
    window.dispatchEvent(
      new PointerEvent("pointerup", { bubbles: true, clientX: 1790, clientY: 90, pointerId: 1 }),
    );
    expect(engine.state.panels.spec.mode).toBe("dock");
    expect(el.parentElement).toBe(hosts.rightBody);
  });
});
```

If happy-dom does not deliver `window` pointer events to the engine, bind listeners on `document` in the implementation (not only `window`). Tests should dispatch on the same target the engine listens to. **Implementation must listen on `document` for `pointermove` / `pointerup` / `pointercancel`.**

- [ ] **Step 2: Run the new test and confirm it fails**

Run: `npx vitest run src/layout/engine.test.ts`

Expected: FAIL on “docks a floating panel…” because gestures are not wired.

- [ ] **Step 3: Add gesture state and listeners to `WorkspaceEngine`**

Add fields:

```ts
  private drag: null | {
    id: string;
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    fromDock: boolean;
    armed: boolean;
  } = null;
  private resize: null | {
    id: string;
    pointerId: number;
    startX: number;
    startY: number;
    originW: number;
    originH: number;
  } = null;
  private slotDrag: null | {
    slot: "left" | "right";
    pointerId: number;
    startX: number;
    originW: number;
  } = null;
  private snap: SlotId | null = null;
```

At the end of `boot()`:

```ts
    document.addEventListener("pointermove", (e) => this.onPointerMove(e));
    document.addEventListener("pointerup", (e) => this.onPointerUp(e));
    document.addEventListener("pointercancel", (e) => this.onPointerUp(e));
    this.hosts.left.querySelector("[data-resize-slot='left']")?.addEventListener(
      "pointerdown",
      (e) => this.beginSlotResize(e as PointerEvent, "left"),
    );
    this.hosts.right.querySelector("[data-resize-slot='right']")?.addEventListener(
      "pointerdown",
      (e) => this.beginSlotResize(e as PointerEvent, "right"),
    );
```

Replace `bindPanel` with:

```ts
  private bindPanel(el: HTMLElement): void {
    const id = el.dataset.id!;
    el.addEventListener("pointerdown", () => this.focus(id));
    const bar = el.querySelector(".panel-titlebar");
    bar?.addEventListener("pointerdown", (e) => this.beginDrag(e as PointerEvent, id));
    el.querySelector("[data-resize]")?.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      this.beginResize(e as PointerEvent, id);
    });
    el.querySelectorAll<HTMLButtonElement>("[data-action]").forEach((btn) => {
      btn.addEventListener("pointerdown", (e) => e.stopPropagation());
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        if (action === "close") this.close(id);
        else if (action === "float") this.float(id);
        else if (action === "overlay") this.overlay(id);
        else if (action === "dock") {
          const panel = this.state.panels[id];
          if (panel.mode === "dock") return;
          this.dock(id, panel.slot ?? "right");
        }
      });
    });
  }
```

Add methods (comments required on snap + reparent):

```ts
  private beginDrag(e: PointerEvent, id: string): void {
    if ((e.target as HTMLElement).closest("[data-action]")) return;
    const panel = this.state.panels[id];
    if (!panel || panel.mode === "overlay") return;
    e.preventDefault();
    (e.currentTarget as HTMLElement | null)?.setPointerCapture?.(e.pointerId);
    this.drag = {
      id,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: panel.x,
      originY: panel.y,
      fromDock: panel.mode === "dock",
      armed: panel.mode === "float",
    };
    this.focus(id, false);
  }

  private beginResize(e: PointerEvent, id: string): void {
    const panel = this.state.panels[id];
    if (!panel || panel.mode !== "float") return;
    e.preventDefault();
    this.resize = {
      id,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originW: panel.w,
      originH: panel.h,
    };
  }

  private beginSlotResize(e: PointerEvent, slot: "left" | "right"): void {
    e.preventDefault();
    this.slotDrag = {
      slot,
      pointerId: e.pointerId,
      startX: e.clientX,
      originW: this.state.slots[slot].width,
    };
  }

  private onPointerMove(e: PointerEvent): void {
    if (this.slotDrag && e.pointerId === this.slotDrag.pointerId) {
      const dx = e.clientX - this.slotDrag.startX;
      const next =
        this.slotDrag.slot === "left"
          ? this.slotDrag.originW + dx
          : this.slotDrag.originW - dx;
      this.hosts.workspace.style.setProperty(
        this.slotDrag.slot === "left" ? "--left-w" : "--right-w",
        `${Math.max(180, next)}px`,
      );
      return;
    }
    if (this.resize && e.pointerId === this.resize.pointerId) {
      const el = this.nodes.get(this.resize.id);
      if (!el) return;
      const w = Math.max(MIN_FLOAT_W, this.resize.originW + (e.clientX - this.resize.startX));
      const h = Math.max(MIN_FLOAT_H, this.resize.originH + (e.clientY - this.resize.startY));
      el.style.setProperty("--w", `${w}px`);
      el.style.setProperty("--h", `${h}px`);
      return;
    }
    if (!this.drag || e.pointerId !== this.drag.pointerId) return;
    const dx = e.clientX - this.drag.startX;
    const dy = e.clientY - this.drag.startY;
    if (!this.drag.armed) {
      if (Math.hypot(dx, dy) < FLOAT_OUT_THRESHOLD_PX) return;
      // Commit-time reparent once, then compositor drag.
      this.float(this.drag.id);
      this.drag.armed = true;
      this.drag.originX = e.clientX - 48;
      this.drag.originY = e.clientY - 14;
      this.drag.startX = e.clientX;
      this.drag.startY = e.clientY;
    }
    const el = this.nodes.get(this.drag.id);
    if (!el) return;
    const x = this.drag.originX + dx;
    const y = this.drag.originY + dy;
    el.classList.add("is-dragging");
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    // Snap from pointer + viewport + stored slot widths. Do not measure the panel.
    this.snap = snapZone(
      e.clientX,
      window.innerWidth || 1280,
      this.state.slots.left.width,
      this.state.slots.right.width,
    );
    this.paintSnap(this.snap);
  }

  /**
   * Snap preview is a sibling overlay. Zones: 40px left/right edges, middle third = center.
   */
  private paintSnap(zone: SlotId | null): void {
    const preview = this.hosts.snapPreview;
    if (!zone) {
      preview.dataset.on = "false";
      return;
    }
    const vw = window.innerWidth || 1280;
    const vh = window.innerHeight || 800;
    const leftW = this.state.slots.left.width;
    const rightW = this.state.slots.right.width;
    let x = 8;
    let y = 48;
    let w = leftW - 16;
    let h = vh - 96;
    if (zone === "center") {
      x = leftW + 8;
      w = Math.max(80, vw - leftW - rightW - 16);
    } else if (zone === "right") {
      x = vw - rightW + 8;
      w = rightW - 16;
    }
    preview.style.setProperty("--snap-x", `${x}px`);
    preview.style.setProperty("--snap-y", `${y}px`);
    preview.style.setProperty("--snap-w", `${w}px`);
    preview.style.setProperty("--snap-h", `${h}px`);
    preview.dataset.on = "true";
  }

  private onPointerUp(e: PointerEvent): void {
    if (this.slotDrag && e.pointerId === this.slotDrag.pointerId) {
      const dx = e.clientX - this.slotDrag.startX;
      const next =
        this.slotDrag.slot === "left"
          ? this.slotDrag.originW + dx
          : this.slotDrag.originW - dx;
      this.setSlotWidth(this.slotDrag.slot, next);
      this.slotDrag = null;
      return;
    }
    if (this.resize && e.pointerId === this.resize.pointerId) {
      const panel = this.state.panels[this.resize.id];
      const el = this.nodes.get(this.resize.id);
      if (panel && el) {
        panel.w = Math.max(
          MIN_FLOAT_W,
          this.resize.originW + (e.clientX - this.resize.startX),
        );
        panel.h = Math.max(
          MIN_FLOAT_H,
          this.resize.originH + (e.clientY - this.resize.startY),
        );
        el.style.setProperty("--w", `${panel.w}px`);
        el.style.setProperty("--h", `${panel.h}px`);
        this.persist();
      }
      this.resize = null;
      return;
    }
    if (!this.drag || e.pointerId !== this.drag.pointerId) return;
    const el = this.nodes.get(this.drag.id);
    const zone = this.snap;
    this.hosts.snapPreview.dataset.on = "false";
    this.snap = null;
    if (el) {
      el.classList.remove("is-dragging");
      const dx = e.clientX - this.drag.startX;
      const dy = e.clientY - this.drag.startY;
      const x = this.drag.originX + dx;
      const y = this.drag.originY + dy;
      el.style.transform = "";
      if (this.drag.armed && zone) {
        const id = this.drag.id;
        this.drag = null;
        this.dock(id, zone);
        return;
      }
      if (this.drag.armed) {
        const panel = this.state.panels[this.drag.id];
        panel.x = x;
        panel.y = y;
        el.style.setProperty("--x", `${x}px`);
        el.style.setProperty("--y", `${y}px`);
        this.persist();
      }
    }
    this.drag = null;
  }
```

`classList.add("is-dragging")` belongs on drag **start** (when `armed` becomes true), not every `pointermove`. Move that line into the arming branch only.

`float()` during float-out will persist; that is commit-time and allowed.

- [ ] **Step 4: Run all tests**

Run: `npx vitest run`

Expected: all PASS, including the snap-dock gesture test. If the test fails because `pointerdown` on the titlebar also hits `focus` persist, that is fine. If it fails because `float()` on arming resets coordinates, keep `this.drag.originX` assignment **after** `float()` as written.

- [ ] **Step 5: Commit**

```bash
git add src/layout/engine.ts src/layout/engine.test.ts
git commit -m "feat: compositor drag snap resize and dock float-out"
```

---

### Task 8: Boot the app and README acceptance notes

**Files:**
- Modify: `src/main.ts`
- Modify: `README.md`

- [ ] **Step 1: Write `src/main.ts`**

```ts
import { buildWorkspace } from "./layout/chrome";
import { WorkspaceEngine } from "./layout/engine";
import { createPanel } from "./layout/panels";
import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("#app missing");

const hosts = buildWorkspace(app);
const engine = new WorkspaceEngine(hosts, localStorage);
engine.boot(createPanel);

Object.assign(window, { workshell: engine });
```

- [ ] **Step 2: Extend README with the acceptance demo**

Replace `README.md` with:

```markdown
# Workshell

Minimal desktop-like window manager (vanilla TypeScript + Vite + Tailwind). Not a full app. Not a WebGPU renderer.

## Run

```bash
npm install
npm run dev
```

Open the local URL. Layout key: `localStorage["workshell.layout.v1"]`. Clear it to restore seed panels.

## Test

```bash
npm test
```

## Acceptance demo

1. Float **Spec Viewer** (titlebar Float, or drag it out of the right dock).
2. Drag it (titlebar) and resize from the bottom-right handle.
3. Dock it back to the right slot (drag to the right edge snap, or Dock).
4. Overlay **Task Thread**, then click the dim to restore.
5. Reload: positions remain.
6. DevTools console: every reparent logs `{ id, uid, isConnected, parent }`. `isConnected` stays true and `uid` does not change across float/dock.

Seed: Backlog left, Sprint + Chat center tabs, Spec right, Metrics floating.
```

- [ ] **Step 3: Typecheck and test**

Run:

```bash
npx tsc --noEmit
npx vitest run
```

Expected: both exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/main.ts README.md
git commit -m "feat: boot Workshell engine and document acceptance demo"
```

---

### Task 9: Manual verification pass

**Files:** none required unless a bug is found.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

Expected: Vite prints a local URL.

- [ ] **Step 2: Exercise the acceptance demo in a browser**

- Float Spec, drag, resize, dock right
- Overlay Chat, click dim
- Reload keeps layout
- Console reparent logs show `isConnected: true` and stable `uid`
- Drag should feel locked to the display refresh (no layout hitch). If it hitches, fix `onPointerMove` before any extra feature.

- [ ] **Step 3: If GPU Preview is requested later**

`createPanel("gpu-preview", "GPU Preview")` already yields a black canvas + “WebGPU host” and goes through `mount()`. Do not add a seed panel for it.

- [ ] **Step 4: Final commit only if verification required code fixes**

Commit those fixes with messages that describe the bug, e.g. `fix: keep uid stable when docking from snap`.

---

## Execution notes

- Do **not** dispatch parallel implementers against `src/layout/engine.ts`.
- Scaffold (Task 1), types (Task 2), persist (Task 3), chrome (Task 4), and panels (Task 5) are sequential only because later tasks import them; they do not share the gesture state machine.
- `npm run dev` is the acceptance surface; Vitest does not prove 180 Hz.

## Spec coverage

| Spec item | Task |
|---|---|
| Vite + TS + Tailwind, no framework | 1, 8 |
| types / persist / engine / main | 2, 3, 6, 8 |
| `#workspace` 100vw×100vh, docks, float-layer, taskbar | 4 |
| Overlay dim sibling under overlay host | 4 |
| Same DOM node reparent + `data-uid` log | 5, 6 |
| Dock / float / overlay / close / tabs / focus | 6 |
| Persist `workshell.layout.v1`, seed, corrupt | 3, 6 |
| Snap, drag, resize, float-out, slot width | 7 |
| Compositor pointer path | 7, 9 |
| Placeholder bodies | 5 |
| GPU Preview placeholder only if created | 5, 9 |
| README npm install / npm run dev | 1, 8 |
| Acceptance demo | 8, 9 |
