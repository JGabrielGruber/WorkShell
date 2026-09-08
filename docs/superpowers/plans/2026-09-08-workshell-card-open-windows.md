# Card-Open Windows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `WorkspaceEngine.open()` and wire shell-demo kanban cards so clicking a card opens (or focuses) a compositor window; several windows can be live at once.

**Architecture:** Persist keeps well-formed panel ids even when they are not in the seed. Engine stores the `boot()` factory and materializes nodes on `open()`. Demo owns the task catalog, card clicks, and window bodies. No pointer-path changes. `createDesktop` / `boot()` options stay the same.

**Tech Stack:** npm workspaces, TypeScript, Vitest + happy-dom, existing compositor / desktop-shell / shell-demo packages.

**Spec:** `docs/superpowers/specs/2026-09-08-workshell-card-open-windows-design.md`

**Ownership:** Coordinating session owns `packages/compositor/src/engine.ts` (Task 2). Do not parallelize implementers on that file.

**Worktree:** Create via `using-git-worktrees` at execution time. Run `npm test` / `npx tsc` from the worktree. Do not kill José's Vite.

**Pointer-path rules:** no `getBoundingClientRect` / `offsetWidth` / `clientWidth` in `pointermove`; no `localStorage` in `pointermove`; no Tailwind class toggles on the moving panel during move.

---

## File map

| File | Responsibility |
|---|---|
| `packages/compositor/src/types.ts` | `CASCADE_PX = 28`; `OpenOptions` |
| `packages/compositor/src/persist.ts` | known set = seed ids ∪ well-formed stored panel ids |
| `packages/compositor/src/persist.test.ts` | extra id survives; garbage still drops |
| `packages/compositor/src/engine.ts` | store `createPanel`; `open()` / `materialize()` / `cascadeRect()` |
| `packages/compositor/src/engine.test.ts` | open behaviors |
| `packages/compositor/src/index.ts` | export `OpenOptions`, `CASCADE_PX` |
| `packages/desktop-shell/src/index.ts` | re-export `OpenOptions` |
| `apps/shell-demo/src/tasks.ts` | catalog |
| `apps/shell-demo/src/tasks.test.ts` | catalog ids / lanes |
| `apps/shell-demo/src/windows/task-window.ts` | `fillWindow` router |
| `apps/shell-demo/src/windows/task-window.test.ts` | inspector vs document body |
| `apps/shell-demo/src/widgets/kanban.ts` | render from catalog; optional `open` |
| `apps/shell-demo/src/widgets/kanban.test.ts` | click spy |
| `apps/shell-demo/src/main.ts` | wire `open` + `fillWindow` |
| `apps/shell-demo/src/demo.css` | card pointer + hover |
| `README.md` | acceptance: click a card |

---

### Task 1: Persist keeps well-formed extra panels

**Files:**
- Modify: `packages/compositor/src/persist.test.ts`
- Modify: `packages/compositor/src/persist.ts`

- [ ] **Step 1: Replace the allowlist test with keep-extra + drop-garbage**

In `packages/compositor/src/persist.test.ts`, replace the test `"drops unknown panel ids against the seed allowlist"` with:

```ts
  it("keeps well-formed panel ids that are not in the seed", () => {
    const storage = mem();
    const state = fixtureSeed();
    state.panels.ghost = {
      id: "ghost",
      uid: "x",
      title: "Ghost",
      mode: "float",
      x: 10,
      y: 20,
      w: 300,
      h: 220,
      z: 4,
    };
    state.slots.left.order = ["ghost", "alpha"];
    state.closed = ["nope"];
    saveLayout(storage, state);
    const loaded = loadLayout(storage, fixtureSeed);
    expect(loaded.panels.ghost).toMatchObject({
      id: "ghost",
      title: "Ghost",
      mode: "float",
      x: 10,
      y: 20,
      w: 300,
      h: 220,
    });
    expect(loaded.slots.left.order).toEqual(["ghost", "alpha"]);
    expect(loaded.closed).toEqual([]);
  });

  it("drops stored panels that are not objects", () => {
    const storage = mem();
    const state = fixtureSeed() as ReturnType<typeof fixtureSeed> & {
      panels: Record<string, unknown>;
    };
    state.panels.ghost = "nope";
    saveLayout(storage, state as ReturnType<typeof fixtureSeed>);
    const loaded = loadLayout(storage, fixtureSeed);
    expect(loaded.panels.ghost).toBeUndefined();
    expect(loaded.panels.alpha).toBeDefined();
  });
```

Keep the existing round-trip test that deletes `panels.alpha` and expects it to stay undefined.

- [ ] **Step 2: Run the new tests to verify they fail**

Run: `npm test -- packages/compositor/src/persist.test.ts`

Expected: FAIL — `loaded.panels.ghost` is `undefined` (old seed allowlist).

- [ ] **Step 3: Change `sanitizeLayout` known set**

In `packages/compositor/src/persist.ts`, replace the known-set construction and panel loop:

```ts
export function sanitizeLayout(parsed: LayoutState, seed: () => LayoutState): LayoutState {
  if (!parsed.slots || !parsed.panels) return seed();
  const seedIds = Object.keys(seed().panels);
  const panels: Record<string, PanelState> = {};
  for (const id of Object.keys(parsed.panels)) {
    if (!id) continue;
    const raw = parsed.panels[id];
    if (!raw || typeof raw !== "object") continue;
    panels[id] = sanitizePanel(id, raw);
  }
  const known = new Set([...seedIds, ...Object.keys(panels)]);
  const closedKnown = (parsed.closed ?? []).filter((id) => known.has(id));
  const overlayRaw = parsed.overlay;
  const overlay =
    overlayRaw && known.has(overlayRaw.id) && panels[overlayRaw.id]
      ? {
          id: overlayRaw.id,
          restore: {
            mode: isMode(overlayRaw.restore?.mode) ? overlayRaw.restore.mode : "float",
            slot: isSlotId(overlayRaw.restore?.slot) ? overlayRaw.restore.slot : undefined,
          },
        }
      : null;
  return {
    version: 2,
    slots: {
      left: sanitizeSlot(parsed.slots.left, 320, known),
      center: sanitizeSlot(parsed.slots.center, 0, known),
      right: sanitizeSlot(parsed.slots.right, 360, known),
    },
    panels,
    overlay,
    closed: closedKnown,
    nextZ: typeof parsed.nextZ === "number" ? parsed.nextZ : 3,
  };
}
```

- [ ] **Step 4: Run persist tests**

Run: `npm test -- packages/compositor/src/persist.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/compositor/src/persist.ts packages/compositor/src/persist.test.ts
git commit -m "fix: persist well-formed panels that are not in the seed"
```

---

### Task 2: `WorkspaceEngine.open()`

**Files:**
- Modify: `packages/compositor/src/types.ts`
- Modify: `packages/compositor/src/engine.test.ts`
- Modify: `packages/compositor/src/engine.ts`
- Modify: `packages/compositor/src/index.ts`
- Modify: `packages/desktop-shell/src/index.ts`

Coordinating session owns `engine.ts`.

- [ ] **Step 1: Add `CASCADE_PX` and `OpenOptions`**

In `packages/compositor/src/types.ts`, after `DEFAULT_FLOAT`:

```ts
export const CASCADE_PX = 28;

export type OpenOptions = { title?: string };
```

Export from `packages/compositor/src/index.ts`:

```ts
export type {
  LayoutState,
  PanelState,
  Mode,
  SlotId,
  SlotState,
  OverlayState,
  OpenOptions,
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
  CASCADE_PX,
} from "./types";
```

Re-export from `packages/desktop-shell/src/index.ts`:

```ts
export type {
  EngineHosts,
  LayoutState,
  Mode,
  OpenOptions,
  OverlayState,
  PanelState,
  SlotId,
  SlotState,
} from "@workshell/compositor";
export {
  CASCADE_PX,
  DEFAULT_FLOAT,
  DEFAULT_LEFT_W,
  DEFAULT_RIGHT_W,
  STORAGE_KEY,
  TASKBAR_GAP,
  TASKBAR_H,
  WorkspaceEngine,
  snapZone,
} from "@workshell/compositor";
```

- [ ] **Step 2: Write failing engine tests**

Append to `packages/compositor/src/engine.test.ts` inside `describe("WorkspaceEngine")` (after the close test):

```ts
  it("open before boot throws", () => {
    const hosts = fakeHosts();
    const engine = new WorkspaceEngine(hosts, localStorage, fixtureSeed);
    expect(() => engine.open("beta")).toThrow(/boot/);
  });

  it("open creates a cascaded float and a taskbar pill", () => {
    const { engine, hosts } = boot();
    engine.open("beta", { title: "Beta" });
    const el = engine.node("beta");
    expect(el.isConnected).toBe(true);
    expect(el.parentElement).toBe(hosts.floatLayer);
    expect(engine.state.panels.beta).toMatchObject({
      id: "beta",
      title: "Beta",
      mode: "float",
      x: 96 + 28,
      y: 48 + 28,
      w: 720,
      h: 520,
    });
    expect(engine.state.closed).not.toContain("beta");
    const pills = [...hosts.taskbar.querySelectorAll("button")].map((b) => b.textContent);
    expect(pills.some((t) => t?.includes("Beta"))).toBe(true);
    expect(pills.some((t) => t?.includes("Alpha"))).toBe(true);
  });

  it("open on a live panel focuses and does not duplicate the node", () => {
    const { engine, hosts } = boot();
    engine.open("beta", { title: "Beta" });
    const first = engine.node("beta");
    const uid = first.dataset.uid;
    const z = engine.state.panels.beta.z;
    engine.open("beta");
    expect(engine.node("beta")).toBe(first);
    expect(first.dataset.uid).toBe(uid);
    expect(engine.state.panels.beta.z).toBeGreaterThan(z);
    expect(hosts.floatLayer.querySelectorAll('[data-id="beta"]').length).toBe(1);
  });

  it("open after close recreates the node at the stored rect", () => {
    const { engine } = boot();
    engine.open("beta", { title: "Beta" });
    engine.float("beta", { x: 40, y: 50, w: 300, h: 220 });
    const oldUid = engine.node("beta").dataset.uid;
    engine.close("beta");
    expect(engine.state.closed).toContain("beta");
    engine.open("beta");
    expect(engine.state.closed).not.toContain("beta");
    const el = engine.node("beta");
    expect(el.isConnected).toBe(true);
    expect(el.dataset.uid).not.toBe(oldUid);
    expect(engine.state.panels.beta).toMatchObject({
      mode: "float",
      x: 40,
      y: 50,
      w: 300,
      h: 220,
    });
  });

  it("open on a hidden panel shows it", () => {
    const { engine } = boot();
    engine.hide("alpha");
    engine.open("alpha");
    expect(engine.state.panels.alpha.mode).toBe("float");
    expect(engine.node("alpha").style.display).not.toBe("none");
  });
```

- [ ] **Step 3: Run engine tests to verify they fail**

Run: `npm test -- packages/compositor/src/engine.test.ts`

Expected: FAIL — `engine.open is not a function` (or equivalent).

- [ ] **Step 4: Implement `open` on `WorkspaceEngine`**

In `packages/compositor/src/engine.ts`:

- Import `CASCADE_PX` and `OpenOptions` from `./types`.
- Add `private createPanel: ((id: string) => HTMLElement) | null = null;`
- At the start of `boot(createPanel)`: `this.createPanel = createPanel;`
- Extract the per-id body of `boot` into `private materialize(id: string): void` and call it from `boot` and `open`.

```ts
  private materialize(id: string): void {
    if (!this.createPanel) throw new Error("boot() required");
    const el = this.createPanel(id);
    this.nodes.set(id, el);
    this.state.panels[id].uid = el.dataset.uid ?? "";
    this.bindPanel(el);
    this.applyMode(id);
  }

  private cascadeRect(): { x: number; y: number; w: number; h: number } {
    const n = Object.keys(this.state.panels).filter(
      (id) => !this.state.closed.includes(id),
    ).length;
    return {
      x: DEFAULT_FLOAT.x + n * CASCADE_PX,
      y: DEFAULT_FLOAT.y + n * CASCADE_PX,
      w: DEFAULT_FLOAT.w,
      h: DEFAULT_FLOAT.h,
    };
  }

  open(id: string, opts?: OpenOptions): void {
    if (!this.createPanel) throw new Error("boot() required");
    if (!id) return;
    const panel = this.state.panels[id];
    const closed = this.state.closed.includes(id);
    if (panel && !closed) {
      if (panel.mode === "hidden") this.show(id);
      else this.focus(id);
      return;
    }
    if (panel && closed) {
      this.state.closed = this.state.closed.filter((x) => x !== id);
      this.materialize(id);
      this.float(id);
      return;
    }
    const rect = this.cascadeRect();
    this.state.panels[id] = {
      id,
      uid: "",
      title: opts?.title ?? id,
      mode: "float",
      x: rect.x,
      y: rect.y,
      w: rect.w,
      h: rect.h,
      z: this.state.nextZ++,
    };
    this.materialize(id);
    this.float(id);
  }
```

`boot` loop becomes:

```ts
  boot(createPanel: (id: string) => HTMLElement): void {
    this.createPanel = createPanel;
    this.applySlotWidths();
    for (const id of Object.keys(this.state.panels)) {
      if (this.state.closed.includes(id)) continue;
      this.materialize(id);
    }
    this.renderTabs();
    this.renderTaskbar();
    this.applyOverlayChrome();
    // existing listeners unchanged
```

Do not touch `onPointerMove`.

- [ ] **Step 5: Run engine tests**

Run: `npm test -- packages/compositor/src/engine.test.ts`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/compositor/src/types.ts packages/compositor/src/engine.ts packages/compositor/src/engine.test.ts packages/compositor/src/index.ts packages/desktop-shell/src/index.ts
git commit -m "feat: WorkspaceEngine.open creates, focuses, and restores windows"
```

---

### Task 3: Demo task catalog and `fillWindow`

**Files:**
- Create: `apps/shell-demo/src/tasks.ts`
- Create: `apps/shell-demo/src/tasks.test.ts`
- Create: `apps/shell-demo/src/windows/task-window.ts`
- Create: `apps/shell-demo/src/windows/task-window.test.ts`
- Modify: `apps/shell-demo/src/windows/task-104.ts` (keep `fillTask104`; `fillWindow` calls it)

- [ ] **Step 1: Write catalog test**

`apps/shell-demo/src/tasks.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { TASKS, taskById } from "./tasks";

describe("TASKS", () => {
  it("has four lanes and includes task-104", () => {
    const lanes = [...new Set(TASKS.map((t) => t.lane))];
    expect(lanes).toEqual([
      "Backlog / Ideias",
      "Em Progresso (Sprint 04)",
      "Revisão",
      "Concluído",
    ]);
    expect(taskById("task-104")?.title).toMatch(/Pipelines de Renderização Neural/);
    expect(TASKS.every((t) => t.id.startsWith("task-"))).toBe(true);
  });
});
```

- [ ] **Step 2: Run catalog test to verify it fails**

Run: `npm test -- apps/shell-demo/src/tasks.test.ts`

Expected: FAIL — cannot find module `./tasks`.

- [ ] **Step 3: Add `tasks.ts`**

Move the current kanban copy into records. Preserve titles, tags, and bodies. Ids: `task-112`, `task-115`, `task-118`, `task-104`, `task-082`, `task-098`, `task-101`, `task-077`, `task-071`, `task-065`, `task-058`.

```ts
export type TaskRecord = {
  id: string;
  lane: string;
  tag: string;
  title: string;
  body?: string;
};

export const TASKS: TaskRecord[] = [
  {
    id: "task-112",
    lane: "Backlog / Ideias",
    tag: "Arquitetura",
    title: "Suporte nativo a WebGPU compute shaders",
    body: "Avaliar fallback transparente para sistemas legados sem suporte a float16.",
  },
  {
    id: "task-115",
    lane: "Backlog / Ideias",
    tag: "Design System",
    title: "Refino dos tokens de reflexão translúcida",
  },
  {
    id: "task-118",
    lane: "Backlog / Ideias",
    tag: "Pesquisa",
    title: "Benchmark de compositor 180 Hz vs VSync",
  },
  {
    id: "task-104",
    lane: "Em Progresso (Sprint 04)",
    tag: "Em Foco",
    title: "Integração de Pipelines de Renderização Neural",
    body: "Conexão direta dos buffers de textura com o pipeline ONNX Runtime Web via SIMD.",
  },
  {
    id: "task-082",
    lane: "Em Progresso (Sprint 04)",
    tag: "Frontend",
    title: "Refatoração Auth & Handshake OIDC",
  },
  {
    id: "task-098",
    lane: "Revisão",
    tag: "DevOps",
    title: "Cluster Kubernetes K3s Edge Autoscaling",
    body: "Testes de carga sob latência de rede simulada com link 4G de alta perda.",
  },
  {
    id: "task-101",
    lane: "Revisão",
    tag: "Backend",
    title: "Contrato gRPC do inspector TASK-104",
  },
  {
    id: "task-077",
    lane: "Concluído",
    tag: "Deploy",
    title: "Mecanismo de Cache WASM L2",
    body: "Redução de overhead em 42ms para inicializações a frio.",
  },
  {
    id: "task-071",
    lane: "Concluído",
    tag: "Shell",
    title: "Shader de vidro para lanes",
  },
  {
    id: "task-065",
    lane: "Concluído",
    tag: "Persistência",
    title: "Layout seed no localStorage",
  },
  {
    id: "task-058",
    lane: "Concluído",
    tag: "Chrome",
    title: "Host overlay-dim / overlay-host",
  },
];

export function taskById(id: string): TaskRecord | undefined {
  return TASKS.find((t) => t.id === id);
}

export function taskTitle(id: string): string {
  return id.replace(/^task-/, "TASK-").toUpperCase();
}
```

- [ ] **Step 4: Write `fillWindow` test**

`apps/shell-demo/src/windows/task-window.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { fillWindow } from "./task-window";

describe("fillWindow", () => {
  it("keeps the TASK-104 inspector", () => {
    const host = document.createElement("div");
    fillWindow("task-104", host);
    expect(host.querySelector(".inspector")).toBeTruthy();
  });

  it("fills other tasks as a document body", () => {
    const host = document.createElement("div");
    fillWindow("task-112", host);
    expect(host.querySelector(".inspector")).toBeNull();
    expect(host.querySelector(".task-doc")?.textContent).toMatch(/WebGPU/);
    expect(host.querySelector(".task-doc")?.textContent).toMatch(/TASK-112/);
  });

  it("leaves unknown ids empty", () => {
    const host = document.createElement("div");
    fillWindow("nope", host);
    expect(host.childNodes.length).toBe(0);
  });
});
```

- [ ] **Step 5: Run fillWindow test to verify it fails**

Run: `npm test -- apps/shell-demo/src/windows/task-window.test.ts`

Expected: FAIL — cannot find module `./task-window`.

- [ ] **Step 6: Implement `fillWindow`**

`apps/shell-demo/src/windows/task-window.ts`:

```ts
import { fillTask104 } from "./task-104";
import { taskById, taskTitle } from "../tasks";

export function fillWindow(id: string, host: HTMLElement): void {
  if (id === "task-104") {
    fillTask104(host);
    return;
  }
  const task = taskById(id);
  if (!task) return;
  host.replaceChildren();
  const doc = document.createElement("div");
  doc.className = "task-doc";
  const kicker = document.createElement("p");
  kicker.className = "task-doc-id";
  kicker.textContent = taskTitle(id);
  const h1 = document.createElement("h1");
  h1.textContent = task.title;
  const meta = document.createElement("p");
  meta.className = "task-doc-meta";
  meta.textContent = `${task.lane} · ${task.tag}`;
  doc.append(kicker, h1, meta);
  if (task.body) {
    const p = document.createElement("p");
    p.textContent = task.body;
    doc.append(p);
  }
  host.append(doc);
}
```

- [ ] **Step 7: Run demo unit tests**

Run: `npm test -- apps/shell-demo/src/tasks.test.ts apps/shell-demo/src/windows/task-window.test.ts`

Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add apps/shell-demo/src/tasks.ts apps/shell-demo/src/tasks.test.ts apps/shell-demo/src/windows/task-window.ts apps/shell-demo/src/windows/task-window.test.ts
git commit -m "feat: demo task catalog and fillWindow bodies"
```

---

### Task 4: Kanban clicks and boot wiring

**Files:**
- Modify: `apps/shell-demo/src/widgets/kanban.ts`
- Modify: `apps/shell-demo/src/widgets/kanban.test.ts`
- Modify: `apps/shell-demo/src/main.ts`
- Modify: `apps/shell-demo/src/demo.css`

- [ ] **Step 1: Extend the kanban test**

Replace `apps/shell-demo/src/widgets/kanban.test.ts` with:

```ts
import { describe, expect, it, vi } from "vitest";
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
    expect(layer.querySelector("[data-task-id='task-104']")).toBeTruthy();
  });

  it("clicking a card calls open with id and chrome title", () => {
    const open = vi.fn();
    const root = document.createElement("div");
    document.body.append(root);
    mountKanban(root, { open });
    const card = root.querySelector<HTMLElement>("[data-task-id='task-112']");
    expect(card).toBeTruthy();
    card!.click();
    expect(open).toHaveBeenCalledWith("task-112", "TASK-112");
  });
});
```

- [ ] **Step 2: Run kanban tests to verify click fails**

Run: `npm test -- apps/shell-demo/src/widgets/kanban.test.ts`

Expected: FAIL — no `[data-task-id='task-112']` or click does not call `open`.

- [ ] **Step 3: Render kanban from catalog**

Rewrite `apps/shell-demo/src/widgets/kanban.ts` to iterate `TASKS` grouped by lane. Each card is a `button.kanban-card` with `data-task-id`. If `opts.open` is set, click calls `open(id, taskTitle(id))`.

```ts
import { TASKS, taskTitle } from "../tasks";

export type KanbanOptions = {
  open?: (id: string, title: string) => void;
};

const LANES = [
  "Backlog / Ideias",
  "Em Progresso (Sprint 04)",
  "Revisão",
  "Concluído",
] as const;

export function mountKanban(host: HTMLElement, opts: KanbanOptions = {}): void {
  host.replaceChildren();
  const board = document.createElement("div");
  board.id = "kanban";
  board.dataset.purpose = "kanban-lanes-container";
  for (const lane of LANES) {
    const items = TASKS.filter((t) => t.lane === lane);
    const section = document.createElement("section");
    section.dataset.purpose = "kanban-lane";
    section.className = "kanban-lane";
    const head = document.createElement("div");
    head.className = "kanban-lane-head";
    const h2 = document.createElement("h2");
    h2.textContent = lane;
    const count = document.createElement("span");
    count.className = "kanban-count";
    count.textContent = String(items.length);
    head.append(h2, count);
    const body = document.createElement("div");
    body.className = "kanban-lane-body";
    for (const task of items) {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "kanban-card";
      card.dataset.taskId = task.id;
      if (task.id === "task-104") card.dataset.purpose = "active-target-card";
      const meta = document.createElement("div");
      meta.className = "kanban-card-meta";
      const tag = document.createElement("span");
      tag.textContent = task.tag;
      const idEl = document.createElement("span");
      idEl.textContent = taskTitle(task.id);
      meta.append(tag, idEl);
      const h3 = document.createElement("h3");
      h3.textContent = task.title;
      card.append(meta, h3);
      if (task.body) {
        const p = document.createElement("p");
        p.textContent = task.body;
        card.append(p);
      }
      if (opts.open) {
        card.addEventListener("click", () => opts.open!(task.id, taskTitle(task.id)));
      }
      body.append(card);
    }
    section.append(head, body);
    board.append(section);
  }
  host.append(board);
}
```

- [ ] **Step 4: Card CSS**

Append to `apps/shell-demo/src/demo.css`:

```css
button.kanban-card {
  display: block;
  width: 100%;
  text-align: left;
  font: inherit;
  color: inherit;
  cursor: pointer;
}

button.kanban-card:hover {
  transform: translateY(-1px);
  border-color: rgba(78, 230, 224, 0.45);
}

button.kanban-card:focus-visible {
  outline: 2px solid var(--cyan);
  outline-offset: 2px;
}

.task-doc {
  padding: 20px 24px;
  color: var(--text, #e8eef7);
}

.task-doc-id {
  margin: 0 0 8px;
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--cyan, #4ee6e0);
}

.task-doc h1 {
  margin: 0 0 8px;
  font-family: var(--font-display, inherit);
  font-size: 20px;
  font-weight: 600;
}

.task-doc-meta {
  margin: 0 0 16px;
  font-size: 12px;
  opacity: 0.7;
}
```

Existing `.kanban-card` rules still apply (button also has that class).

- [ ] **Step 5: Wire `main.ts`**

```ts
import { createDesktop } from "@workshell/desktop-shell";
import "@workshell/compositor/compositor.css";
import "@workshell/desktop-shell/shell.css";
import "@workshell/theme-aetheris/tokens.css";
import "./demo.css";
import { seedLayout } from "./seed";
import { mountKanban } from "./widgets/kanban";
import { fillWindow } from "./windows/task-window";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("#app missing");

const host = createDesktop(app);
const engine = host.boot({
  theme: "aetheris",
  seed: seedLayout,
  fillWidgetLayer(el) {
    mountKanban(el, {
      open(id, title) {
        host.engine.open(id, { title });
      },
    });
  },
  fillPanelBody(id, el) {
    fillWindow(id, el);
  },
});

Object.assign(window, { workshell: engine });
```

- [ ] **Step 6: Run kanban + full suite**

Run: `npm test`

Expected: all tests PASS, including existing host tests (unknown body stays empty because `fillPanelBody` in those tests is still a no-op).

- [ ] **Step 7: Commit**

```bash
git add apps/shell-demo/src/widgets/kanban.ts apps/shell-demo/src/widgets/kanban.test.ts apps/shell-demo/src/main.ts apps/shell-demo/src/demo.css
git commit -m "feat: kanban cards open compositor windows"
```

---

### Task 5: README + typecheck

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update acceptance demo**

Add after item 1 (desktop shows TASK-104):

```
1b. Click another card (e.g. TASK-112) — a second window opens, offset from the first. Click the same card again — that window focuses. Close it, click the card — it reopens.
```

- [ ] **Step 2: Typecheck packages**

Run from the worktree:

```
npx tsc -p packages/compositor --noEmit
npx tsc -p packages/desktop-shell --noEmit
npx tsc -p apps/shell-demo --noEmit
npm test
```

Expected: clean tsc, all tests pass.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: card-open windows in the acceptance demo"
```
