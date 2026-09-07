# Workshell Desktop Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the three-dock IDE seed with a Stitch-like desktop (wallpaper, kanban widget, taskbar) and compositor windows that float, maximize to the usable desktop, hide to the taskbar, and close out of the layout.

**Architecture:** Keep `WorkspaceEngine` as the only reparenter. Persist `version: 2` with known id `task-104`. Chrome drops `#dock-row`. Kanban is static markup in `#widget-layer`, not a panel. Overlay and `dock()` stay in the engine unused by seed chrome.

**Tech Stack:** Vite, TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`), Vitest + happy-dom. No React, no docking library, no iframe, no WebGPU.

**Spec:** `docs/superpowers/specs/2026-09-07-workshell-desktop-shell-design.md`

**Ownership:** Coordinating session owns `src/layout/engine.ts` (Tasks 6–7). Do not parallelize implementers on that file. Other tasks may be delegated.

**Worktree:** Create via `using-git-worktrees` at execution time. Run `npm test` / `npx tsc` from the worktree, not the repo root.

---

## File map

| File | Responsibility |
|---|---|
| `src/layout/types.ts` | `version: 2`, `Mode` includes `maximized`/`hidden`, `restore?`, `KNOWN_IDS = ["task-104"]`, taskbar constants |
| `src/layout/persist.ts` | seed on `version !== 2`; sanitize `restore`; accept new modes |
| `src/layout/chrome.ts` | wallpaper, widget-layer, float-layer, taskbar, overlay dim/host; no dock-row |
| `src/desktop/kanban.ts` | static four-lane widget |
| `src/layout/panels.ts` | traffic lights; TASK-104 inspector body |
| `src/layout/engine.ts` | `maximize` / `unmaximize` / `hide` / `show`; drag-unmaximize; no snap-dock on pointerup |
| `src/style.css` | desktop compositor CSS |
| `src/main.ts` | unchanged boot shape |
| `README.md` | new acceptance demo |
| tests | rewrite seed-dependent cases around `task-104` |

**Pointer-path rules (every engine/gesture task):** no `getBoundingClientRect` / `offsetWidth` / `clientWidth` in `pointermove`; no `localStorage` in `pointermove`; no Tailwind class toggles on the moving panel during move. `will-change: transform` only while dragging.

**Layer order (spec):** `#wallpaper`, `#widget-layer`, `#float-layer` (panels + `#snap-preview`), `#taskbar`, `#overlay-dim`, `#overlay-host`. Overlay host is a workspace sibling after the dim.

---

### Task 1: Types and seed v2

**Files:**
- Modify: `src/layout/types.ts`
- Modify: `src/layout/types.test.ts`

- [ ] **Step 1: Rewrite `src/layout/types.test.ts` for v2 seed**

```ts
import { describe, expect, it } from "vitest";
import { KNOWN_IDS, STORAGE_KEY, seedLayout } from "./types";

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

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npm test -- src/layout/types.test.ts`

Expected: FAIL — `version` is `1` and `KNOWN_IDS` still lists five panels.

- [ ] **Step 3: Replace `src/layout/types.ts`**

```ts
export const STORAGE_KEY = "workshell.layout.v1";

export const SNAP_EDGE_PX = 40;
export const FLOAT_OUT_THRESHOLD_PX = 8;
export const MIN_FLOAT_W = 240;
export const MIN_FLOAT_H = 160;
export const DEFAULT_LEFT_W = 320;
export const DEFAULT_RIGHT_W = 360;
export const TASKBAR_H = 64;
export const TASKBAR_GAP = 12;
export const DEFAULT_FLOAT = { x: 96, y: 48, w: 720, h: 520 } as const;

export const KNOWN_IDS = ["task-104"] as const;
export type KnownId = (typeof KNOWN_IDS)[number];

export const PANEL_META: Record<KnownId, { title: string }> = {
  "task-104": { title: "TASK-104" },
};

export type SlotId = "left" | "center" | "right";
export type Mode = "dock" | "float" | "overlay" | "maximized" | "hidden";

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
  restore?: { mode: Mode; slot?: SlotId };
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
  version: 2;
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
        title: PANEL_META["task-104"].title,
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

- [ ] **Step 4: Run types tests**

Run: `npm test -- src/layout/types.test.ts`

Expected: PASS. Persist/engine tests will fail until later tasks; that is expected if you run the full suite now.

- [ ] **Step 5: Commit**

```bash
git add src/layout/types.ts src/layout/types.test.ts
git commit -m "feat: persist v2 seed with floating TASK-104"
```

---

### Task 2: Persist v2

**Files:**
- Modify: `src/layout/persist.ts`
- Modify: `src/layout/persist.test.ts`

- [ ] **Step 1: Rewrite persist tests**

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
    expect(s.version).toBe(2);
    expect(s.panels["task-104"].mode).toBe("float");
    expect(s.slots.left.order).toEqual([]);
  });

  it("seeds when JSON is corrupt", () => {
    const storage = mem({ [STORAGE_KEY]: "{not json" });
    expect(loadLayout(storage).version).toBe(2);
    expect(loadLayout(storage).panels["task-104"].title).toBe("TASK-104");
  });

  it("seeds when version is not 2", () => {
    const storage = mem({ [STORAGE_KEY]: JSON.stringify({ version: 1, panels: {} }) });
    expect(loadLayout(storage).panels["task-104"].id).toBe("task-104");
    expect(loadLayout(storage).slots.right.order).toEqual([]);
  });

  it("round-trips float rect, hidden restore, and closed ids", () => {
    const storage = mem();
    const state = seedLayout();
    state.panels["task-104"].x = 44;
    state.panels["task-104"].mode = "hidden";
    state.panels["task-104"].restore = { mode: "maximized" };
    state.closed = ["task-104"];
    delete state.panels["task-104"];
    saveLayout(storage, state);
    const loaded = loadLayout(storage);
    expect(loaded.closed).toEqual(["task-104"]);
    expect(loaded.panels["task-104"]).toBeUndefined();
  });

  it("keeps hidden restore on a live panel", () => {
    const storage = mem();
    const state = seedLayout();
    state.panels["task-104"].mode = "hidden";
    state.panels["task-104"].restore = { mode: "maximized" };
    state.panels["task-104"].x = 80;
    saveLayout(storage, state);
    const loaded = loadLayout(storage);
    expect(loaded.panels["task-104"].mode).toBe("hidden");
    expect(loaded.panels["task-104"].restore).toEqual({ mode: "maximized" });
    expect(loaded.panels["task-104"].x).toBe(80);
  });

  it("drops unknown panel ids", () => {
    const storage = mem();
    const state = seedLayout() as ReturnType<typeof seedLayout> & {
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
    state.slots.left.order = ["ghost", "task-104"];
    state.closed = ["nope"];
    saveLayout(storage, state as ReturnType<typeof seedLayout>);
    const loaded = loadLayout(storage);
    expect(loaded.panels.ghost).toBeUndefined();
    expect(loaded.slots.left.order).toEqual(["task-104"]);
    expect(loaded.closed).toEqual([]);
  });
});
```

- [ ] **Step 2: Run persist tests — expect FAIL**

Run: `npm test -- src/layout/persist.test.ts`

Expected: FAIL — `loadLayout` still requires `version === 1`.

- [ ] **Step 3: Update `src/layout/persist.ts`**

Change `isMode` to include `"maximized"` and `"hidden"`.

In `sanitizePanel`, copy `restore` when present:

```ts
restore:
  raw.restore && isMode(raw.restore.mode)
    ? {
        mode: raw.restore.mode,
        slot: isSlotId(raw.restore.slot) ? raw.restore.slot : undefined,
      }
    : undefined,
```

Default unknown mode to `"float"` (not `"dock"`).

`sanitizeLayout` return `version: 2`.

`loadLayout`: `if (parsed?.version !== 2) return seedLayout();`

Keep dropping unknown ids. Keep known closed ids even without a panel record.

- [ ] **Step 4: Run persist tests**

Run: `npm test -- src/layout/persist.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/layout/persist.ts src/layout/persist.test.ts
git commit -m "feat: load layout version 2 and hidden restore"
```

---

### Task 3: Desktop chrome (no dock-row)

**Files:**
- Modify: `src/layout/chrome.ts`
- Modify: `src/layout/chrome.test.ts`

- [ ] **Step 1: Rewrite chrome test**

```ts
import { describe, expect, it } from "vitest";
import { buildWorkspace } from "./chrome";

describe("buildWorkspace", () => {
  it("builds desktop layers with overlay host after dim and no dock-row", () => {
    const root = document.createElement("div");
    const hosts = buildWorkspace(root);
    expect(hosts.workspace.id).toBe("workspace");
    expect(hosts.wallpaper.id).toBe("wallpaper");
    expect(hosts.widgetLayer.id).toBe("widget-layer");
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

- [ ] **Step 2: Run chrome test — expect FAIL**

Run: `npm test -- src/layout/chrome.test.ts`

Expected: FAIL — `#dock-row` still exists.

- [ ] **Step 3: Rewrite `buildWorkspace` in `src/layout/chrome.ts`**

`EngineHosts` becomes:

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

Build:

1. `#wallpaper` — `img` using the archive wallpaper URL from `archive/stitch_projthread_glassmorphism_kanban_desktop/code.html` (`data-purpose="desktop-wallpaper"`), plus a tint overlay. `pointer-events: none`.
2. `#widget-layer` — empty here; Task 4 fills it.
3. `#float-layer` — `pointer-events: none`; append `#snap-preview`.
4. `#taskbar`
5. `#overlay-dim`
6. `#overlay-host`

Do **not** create `#topbar` or `#dock-row`. Set `--taskbar-h: 64px` and `--taskbar-gap: 12px` on `#workspace`.

Keep `slot()` in the file (unused) so Task 6 tests can optionally attach docks later if needed. Do not call it from `buildWorkspace`.

- [ ] **Step 4: Run chrome test**

Run: `npm test -- src/layout/chrome.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/layout/chrome.ts src/layout/chrome.test.ts
git commit -m "feat: desktop chrome without dock row"
```

---

### Task 4: Kanban widget

**Files:**
- Create: `src/desktop/kanban.ts`
- Create: `src/desktop/kanban.test.ts`
- Modify: `src/layout/chrome.ts` — mount widget into `widgetLayer`

- [ ] **Step 1: Write `src/desktop/kanban.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { mountKanban } from "./kanban";
import { buildWorkspace } from "../layout/chrome";

describe("kanban widget", () => {
  it("mounts four static lanes and is not a panel", () => {
    const root = document.createElement("div");
    const hosts = buildWorkspace(root);
    mountKanban(hosts.widgetLayer);
    const lanes = hosts.widgetLayer.querySelectorAll("[data-purpose='kanban-lane']");
    expect(lanes.length).toBe(4);
    const titles = [...lanes].map((l) => l.querySelector("h2")?.textContent);
    expect(titles).toEqual([
      "Backlog / Ideias",
      "Em Progresso (Sprint 04)",
      "Revisão",
      "Concluído",
    ]);
    expect(hosts.widgetLayer.querySelector("[data-id]")).toBeNull();
    expect(hosts.widgetLayer.querySelector(".panel")).toBeNull();
  });
});
```

- [ ] **Step 2: Run kanban test — expect FAIL**

Run: `npm test -- src/desktop/kanban.test.ts`

Expected: FAIL — cannot find module `./kanban`.

- [ ] **Step 3: Implement `src/desktop/kanban.ts`**

Export `mountKanban(host: HTMLElement): void`. Four lanes as static HTML (harvest copy from the archive). Include at least the TASK-104 card in Em Progresso. No drag handlers. No `createPanel`. Call `mountKanban(hosts.widgetLayer)` at the end of `buildWorkspace`.

Lane titles must match the test exactly.

A compact structure (fill cards from the archive; keep them static):

```ts
export function mountKanban(host: HTMLElement): void {
  host.replaceChildren();
  const board = document.createElement("div");
  board.id = "kanban";
  board.dataset.purpose = "kanban-lanes-container";
  const lanes: Array<{ title: string; count: string; body: string }> = [
    { title: "Backlog / Ideias", count: "3", body: `<article class="kanban-card">...</article>` },
    { title: "Em Progresso (Sprint 04)", count: "2", body: `<article class="kanban-card" data-purpose="active-target-card">TASK-104 ...</article>` },
    { title: "Revisão", count: "2", body: `<article class="kanban-card">...</article>` },
    { title: "Concluído", count: "4", body: `<article class="kanban-card">...</article>` },
  ];
  for (const lane of lanes) {
    const section = document.createElement("section");
    section.dataset.purpose = "kanban-lane";
    section.className = "kanban-lane";
    section.innerHTML = `<div class="kanban-lane-head"><h2></h2><span class="kanban-count"></span></div><div class="kanban-lane-body">${lane.body}</div>`;
    section.querySelector("h2")!.textContent = lane.title;
    section.querySelector(".kanban-count")!.textContent = lane.count;
    board.append(section);
  }
  host.append(board);
}
```

Use `textContent` for titles (not innerHTML) so the assertion is stable.

- [ ] **Step 4: Run kanban + chrome tests**

Run: `npm test -- src/desktop/kanban.test.ts src/layout/chrome.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/desktop/kanban.ts src/desktop/kanban.test.ts src/layout/chrome.ts
git commit -m "feat: static kanban widget on the desktop"
```

---

### Task 5: Panel chrome and TASK-104 body

**Files:**
- Modify: `src/layout/panels.ts`
- Create: `src/layout/panels.test.ts`

- [ ] **Step 1: Write `src/layout/panels.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { createPanel } from "./panels";

describe("createPanel", () => {
  it("builds traffic lights and a three-column inspector for task-104", () => {
    const el = createPanel("task-104");
    expect(el.dataset.id).toBe("task-104");
    expect(el.dataset.uid).toBeTruthy();
    expect(el.querySelector("[data-action='close']")).toBeTruthy();
    expect(el.querySelector("[data-action='hide']")).toBeTruthy();
    expect(el.querySelector("[data-action='maximize']")).toBeTruthy();
    expect(el.querySelector("[data-action='dock']")).toBeNull();
    expect(el.querySelector("[data-action='float']")).toBeNull();
    expect(el.querySelector("[data-action='overlay']")).toBeNull();
    expect(el.querySelector("[data-pane='chat']")).toBeTruthy();
    expect(el.querySelector("[data-pane='spec']")).toBeTruthy();
    expect(el.querySelector("[data-pane='attachments']")).toBeTruthy();
    expect(el.querySelector(".panel-title")?.textContent).toBe("TASK-104");
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npm test -- src/layout/panels.test.ts`

Expected: FAIL — titlebar still has Dock/Float/Overlay.

- [ ] **Step 3: Update `createPanel` titlebar and `bodyFor("task-104")`**

Titlebar:

```html
<div class="panel-titlebar">
  <div class="traffic">
    <button type="button" class="tl tl-close" data-action="close" aria-label="Close"></button>
    <button type="button" class="tl tl-hide" data-action="hide" aria-label="Hide"></button>
    <button type="button" class="tl tl-max" data-action="maximize" aria-label="Maximize"></button>
  </div>
  <span class="panel-title"></span>
</div>
```

Body for `task-104`: static three columns — chat (a few fake messages), spec (markdown-ish title + code), attachments (a few file rows). Harvest copy from the archive inspector, English OS labels if the chrome around the panes is labeled. Keep it static. GPU branch (`title === "GPU Preview"`) stays.

Resize handle remains.

- [ ] **Step 4: Run panels test**

Run: `npm test -- src/layout/panels.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/layout/panels.ts src/layout/panels.test.ts
git commit -m "feat: traffic lights and TASK-104 inspector body"
```

---

### Task 6: Engine commit path (maximize / hide / show) — coordinating session

**Files:**
- Modify: `src/layout/engine.ts`
- Modify: `src/layout/engine.test.ts`

Do not dispatch a parallel implementer on `engine.ts`.

- [ ] **Step 1: Replace seed-dependent engine tests; add commit-path tests**

Keep `boot()` using `buildWorkspace` + `createPanel`. All ids are `task-104`.

```ts
it("preserves the same node and uid across float", () => {
  const { engine, hosts } = boot();
  const before = engine.node("task-104");
  const uid = before.dataset.uid;
  expect(before.parentElement).toBe(hosts.floatLayer);
  engine.float("task-104", { x: 40, y: 50, w: 300, h: 220 });
  expect(before.isConnected).toBe(true);
  expect(before.dataset.uid).toBe(uid);
  expect(before.parentElement).toBe(hosts.floatLayer);
});

it("maximize does not rewrite stored rect; unmaximize restores it", () => {
  const { engine, hosts } = boot();
  engine.float("task-104", { x: 40, y: 50, w: 300, h: 220 });
  const el = engine.node("task-104");
  engine.maximize("task-104");
  expect(engine.state.panels["task-104"].mode).toBe("maximized");
  expect(engine.state.panels["task-104"].x).toBe(40);
  expect(engine.state.panels["task-104"].w).toBe(300);
  expect(el.dataset.mode).toBe("maximized");
  expect(el.parentElement).toBe(hosts.floatLayer);
  engine.unmaximize("task-104");
  expect(engine.state.panels["task-104"].mode).toBe("float");
  expect(engine.state.panels["task-104"].x).toBe(40);
  expect(engine.state.panels["task-104"].y).toBe(50);
  expect(engine.state.panels["task-104"].w).toBe(300);
  expect(engine.state.panels["task-104"].h).toBe(220);
});

it("hide keeps the node and show restores maximized", () => {
  const { engine, hosts } = boot();
  const el = engine.node("task-104");
  engine.maximize("task-104");
  engine.hide("task-104");
  expect(el.isConnected).toBe(true);
  expect(engine.state.closed).not.toContain("task-104");
  expect(engine.state.panels["task-104"].mode).toBe("hidden");
  expect(engine.state.panels["task-104"].restore).toEqual({ mode: "maximized" });
  expect(el.style.display).toBe("none");
  const pill = [...hosts.taskbar.querySelectorAll("button")].find((b) =>
    b.textContent?.includes("TASK-104"),
  );
  expect(pill).toBeTruthy();
  pill!.click();
  expect(engine.state.panels["task-104"].mode).toBe("maximized");
  expect(engine.state.panels["task-104"].restore).toBeUndefined();
  expect(el.style.display).not.toBe("none");
});

it("close records closed and removes the pill", () => {
  const { engine, hosts } = boot();
  const el = engine.node("task-104");
  engine.close("task-104");
  expect(el.isConnected).toBe(false);
  expect(engine.state.closed).toContain("task-104");
  expect(engine.state.panels["task-104"]).toBeDefined();
  expect(hosts.taskbar.querySelector("button")).toBeNull();
});
```

`close` today deletes from `this.nodes` and `el.remove()` but leaves `panels[id]` — keep that. Persist still has the panel record plus `closed`. The persist round-trip test in Task 2 deleted the panel record; engine close should **not** delete `panels[id]` (current behavior). Spec: “leave `panels`, append id to `closed`”.

Remove the old overlay-restore-to-center-tabs test from the default seed suite (overlay API may stay untested this task). Remove the spec/chat/sprint identity test.

- [ ] **Step 2: Run engine tests — expect FAIL**

Run: `npm test -- src/layout/engine.test.ts`

Expected: FAIL — `maximize` is not a function; boot may throw because `this.hosts.left` is undefined in `boot()`.

- [ ] **Step 3: Implement commit path in `engine.ts`**

`boot()`: skip slot-resize listeners when `hosts.left` / `hosts.right` are missing.

`renderTabs()`: skip a slot when `slotTabs(slot)` is undefined.

`slotBody` / `slotTabs`: return `undefined` if hosts missing. `dock()` if no body: still update state, skip `mount` (or no-op mount). Seed never calls `dock()`.

`applyMode`:

- `hidden`: `el.style.display = "none"`; stay mounted on `floatLayer`; do not use overlay host.
- `maximized`: `el.style.display = ""`; `mount` to `floatLayer`; set usable rect via CSS (`left/top/width/height` or inset), **not** by writing `panel.x/y/w/h`. Clear `transform`.
- `float`: `el.style.display = ""`; existing `--x/--y/--w/--h` + `translate3d` CSS; `mount` floatLayer.
- `overlay` / `dock`: keep existing branches; dock only if slot body exists.

Usable height: `window.innerHeight - TASKBAR_H - TASKBAR_GAP` (import constants from types). Also set `--taskbar-h` / `--taskbar-gap` on workspace if chrome already did.

Add:

```ts
maximize(id: string): void {
  const panel = this.state.panels[id];
  if (!panel || panel.mode === "hidden") return;
  if (this.state.overlay?.id === id) this.state.overlay = null;
  this.removeFromSlots(id);
  panel.mode = "maximized";
  this.focus(id, false);
  this.applyMode(id);
  this.renderTaskbar();
  this.applyOverlayChrome();
  this.persist();
}

unmaximize(id: string): void {
  const panel = this.state.panels[id];
  if (!panel || panel.mode !== "maximized") return;
  this.float(id); // uses stored x,y,w,h
}

hide(id: string): void {
  const panel = this.state.panels[id];
  if (!panel || panel.mode === "hidden") return;
  if (this.state.overlay?.id === id) this.state.overlay = null;
  panel.restore = { mode: panel.mode, slot: panel.slot };
  this.removeFromSlots(id);
  panel.mode = "hidden";
  this.applyMode(id);
  this.renderTaskbar();
  this.applyOverlayChrome();
  this.persist();
}

show(id: string): void {
  const panel = this.state.panels[id];
  if (!panel) return;
  if (panel.mode !== "hidden") {
    this.focus(id);
    return;
  }
  const restore = panel.restore;
  panel.restore = undefined;
  if (restore?.mode === "maximized") this.maximize(id);
  else this.float(id);
}
```

`unmaximize` may call `float(id)` with no rect so stored numbers apply. `float()` currently `removeFromSlots` and persist — fine.

`renderTaskbar()`: pills for every panel **not** in `closed` whose node exists (float, maximized, hidden). Click: if `mode === "hidden"` then `show(id)` else `focus(id)`. Label can stay `title · mode`.

`bindPanel`: map `hide` → `hide(id)`, `maximize` → toggle `maximize` / `unmaximize`. Drop seed dependence on dock/float/overlay buttons (they will not exist). Keep those branches if the buttons are absent (`querySelectorAll` is fine).

`focus`: z-bump for `float` **and** `maximized`.

- [ ] **Step 4: Run engine commit tests**

Run: `npm test -- src/layout/engine.test.ts`

Expected: PASS for the new commit tests. Gesture test still expects snap-dock — rewrite in Task 7. If the old gesture test is still in the file, change or skip it in Step 1 so this task’s suite is green: replace it with a placeholder `it.todo` **only if** you cannot touch gestures yet. Prefer rewriting the gesture assertion in Task 7; for this task, **remove** the snap-dock test so `npm test -- src/layout/engine.test.ts` passes.

- [ ] **Step 5: Commit**

```bash
git add src/layout/engine.ts src/layout/engine.test.ts
git commit -m "feat: maximize hide and show window states"
```

---

### Task 7: Gestures — no snap-dock, drag-unmaximize — coordinating session

**Files:**
- Modify: `src/layout/engine.ts`
- Modify: `src/layout/engine.test.ts`

- [ ] **Step 1: Write gesture tests**

```ts
describe("gestures", () => {
  it("pointerup after a float drag does not dock", () => {
    const { engine, hosts } = boot();
    engine.float("task-104", { x: 100, y: 80, w: 300, h: 220 });
    const el = engine.node("task-104");
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
    expect(engine.state.panels["task-104"].mode).toBe("float");
    expect(el.parentElement).toBe(hosts.floatLayer);
  });

  it("titlebar drag on maximized unmaximizes then floats", () => {
    const { engine } = boot();
    engine.float("task-104", { x: 100, y: 80, w: 300, h: 220 });
    engine.maximize("task-104");
    const el = engine.node("task-104");
    const bar = el.querySelector(".panel-titlebar")!;
    bar.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, clientX: 400, clientY: 20, pointerId: 1 }),
    );
    expect(engine.state.panels["task-104"].mode).toBe("float");
    document.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, clientX: 430, clientY: 40, pointerId: 1 }),
    );
    expect(el.style.transform).toMatch(/translate3d/);
    document.dispatchEvent(
      new PointerEvent("pointerup", { bubbles: true, clientX: 430, clientY: 40, pointerId: 1 }),
    );
    expect(engine.state.panels["task-104"].mode).toBe("float");
  });
});
```

The first test also asserts `pointermove` does not persist (compare localStorage snapshot). `float()` itself persists, so snapshot **after** pointerdown (focus may persist). Take `before` after pointerdown, or after the first move. Spec: persist not on move — `focus()` on pointerdown **does** persist today; keep that. Snapshot after pointerdown.

- [ ] **Step 2: Run — expect FAIL**

Run: `npm test -- src/layout/engine.test.ts`

Expected: FAIL — pointerup still docks; maximized drag does not unmaximize on down.

- [ ] **Step 3: Change `onPointerUp` and `beginDrag`**

`onPointerUp`: **never** call `dock` from snap. Always commit `x,y` when `drag.armed`. Still clear snap preview. You may leave `paintSnap` / `snapZone` in the file unused (do not paint snap this pass: skip `paintSnap` in `onPointerMove`).

`beginDrag`:

- ignore overlay and hidden
- if `panel.mode === "maximized"`: compute `x` so the window stays under the cursor (`clamp(clientX - panel.w / 2, 0, innerWidth - panel.w)`), write `panel.x` / keep `panel.y` or set `y` to 0, then `unmaximize`/`float` **without losing the pointer gesture**. Then arm drag with `originX = panel.x`, `originY = panel.y`, `armed: true`.
- `float()` currently persists and clears transform — call a private path or: set `panel.x`, `panel.mode = "float"`, `applyMode`, then set `this.drag` armed. Avoid a full `float()` if it fights `setPointerCapture`. Minimal: mutate `panel.x`, set mode float, `applyMode`, persist once.

Do not read `getBoundingClientRect` on move. Reading it once on pointerdown for unmaximize is a **commit** and allowed if needed; prefer stored `panel.w` plus `clientX` so you do not measure.

Resize remains float-only (`beginResize` already checks `mode !== "float"`).

- [ ] **Step 4: Run engine tests**

Run: `npm test -- src/layout/engine.test.ts`

Expected: PASS (commit + gesture).

- [ ] **Step 5: Commit**

```bash
git add src/layout/engine.ts src/layout/engine.test.ts
git commit -m "feat: drag-unmaximize and drop snap-dock on pointerup"
```

---

### Task 8: Desktop CSS

**Files:**
- Modify: `src/style.css`

- [ ] **Step 1: Replace IDE grid chrome with desktop rules**

`#workspace`: `position: relative; width: 100vw; height: 100vh; overflow: hidden;` — not a 3-row grid.

`#wallpaper`: `position: absolute; inset: 0; z-index: 0;` img `object-fit: cover; width: 100%; height: 100%;`

`#widget-layer`: `position: absolute; inset: 0; bottom: calc(var(--taskbar-h) + var(--taskbar-gap)); z-index: 1; padding: 20px; pointer-events: auto;`

`#kanban`: four-column grid, lanes ~340px min, glass (`rgba(11, 17, 30, 0.45)`, light blur). Cards glass. Cyan hologram, not purple SaaS (violet only on tag chips).

`#float-layer`: `position: fixed; inset: 0; z-index: 10; pointer-events: none;` snap-preview unused (`dataset.on` false).

`.panel`: `pointer-events: auto; position: absolute; left: var(--x); top: var(--y); width: var(--w); height: var(--h); z-index: var(--z);` glass shell. `.panel.is-dragging` 1px ring, no backdrop-filter (or freeze: `backdrop-filter: none; background: rgba(9, 14, 26, 0.92)`).

`.panel[data-mode="maximized"]`: `left: 0; top: 0; width: 100%; height: calc(100% - var(--taskbar-h) - var(--taskbar-gap)); transform: none;`

`#taskbar`: `position: absolute; left: 50%; bottom: var(--taskbar-gap); transform: translateX(-50%); height: var(--taskbar-h); z-index: 30;` glass, pills.

`#overlay-dim` z-index 40; `#overlay-host` z-index 50; both unused (`dataset.on`).

Traffic lights: 12px circles, Close `#FF5F56`, Hide `#FFBD2E`, Maximize `#27C93F`.

Inspector panes: three columns (chat 280px, spec flex, attachments 260px). Scroll inside panes, not the window chrome.

Optional fonts via Google Fonts in `index.html` (Space Grotesk, Plus Jakarta Sans, JetBrains Mono). If skipped, system stack is acceptable.

No test file required beyond existing chrome/kanban. Run full `npm test` and `npx tsc --noEmit`.

- [ ] **Step 2: Run full tests + tsc**

Run: `npm test && npx tsc --noEmit`

Expected: PASS / no errors.

- [ ] **Step 3: Commit**

```bash
git add src/style.css index.html
git commit -m "feat: Aetheris desktop glass styles"
```

---

### Task 9: README and boot

**Files:**
- Modify: `README.md`
- Modify: `src/main.ts` only if boot must mount kanban (prefer chrome already calling `mountKanban`)

- [ ] **Step 1: Replace README acceptance**

```md
# Workshell

Desktop shell + compositor window manager (vanilla TypeScript + Vite + Tailwind). Not a full app. Not a WebGPU renderer.

## Run

```bash
npm install
npm run dev
```

Open the local URL. Layout key: `localStorage["workshell.layout.v1"]` (`version: 2`). Clear it to restore the seed.

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

Seed: kanban widget (not a panel) + floating TASK-104. Overlay and dock APIs exist but are not in the titlebar.
```

`main.ts` stays: `buildWorkspace`, `new WorkspaceEngine`, `boot(createPanel)`, `Object.assign(window, { workshell: engine })`.

- [ ] **Step 2: Run `npm test && npx tsc --noEmit`**

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add README.md src/main.ts
git commit -m "docs: desktop-shell acceptance demo"
```

---

### Task 10: Browser acceptance

**Files:** none required unless a bug is found.

- [ ] **Step 1: `npm run dev` from the worktree**

- [ ] **Step 2: Exercise the README demo at the printed URL**

Confirm: wallpaper + 4 lanes + taskbar; one window; maximize stops above taskbar; hide/show; close; reload `version: 2`.

- [ ] **Step 3: If a bug, fix with a failing test first (engine bugs stay in this session)**

- [ ] **Step 4: No extra commit unless fixes landed**

---

## Self-review (spec coverage)

| Spec item | Task |
|---|---|
| Desktop layers, no dock-row, overlay host after dim | 3 |
| Kanban widget not a panel | 4 |
| Modes float/maximized/hidden; dock/overlay unused in seed | 1, 6 |
| Maximize usable desktop, stored rect preserved | 6, 8 |
| Hide = minimize, taskbar restore, close = closed | 6 |
| Persist key same, version 2, no v1 migrate | 2 |
| Seed task-104 720×520 | 1, 5 |
| Traffic lights | 5, 8 |
| pointermove no persist; pointerup no snap-dock | 7 |
| Drag maximized → unmaximize then gesture | 7 |
| Freeze blur while dragging | 8 |
| Parent owns engine.ts | 6, 7 |
| Overlay/dock APIs kept | 6 (untouched public methods except boot guards) |
| README / browser | 9, 10 |
