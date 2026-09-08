# Theme Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `@workshell/theme-aetheris` with `@workshell/theme-aetheris-glass` and `@workshell/theme-aetheris-prism`, a closed DaisyUI-shaped token list, and a demo taskbar switcher so `setTheme` actually changes chrome and widgets.

**Architecture:** Theme packages set variables (no `:root`). Shell/compositor/demo paint with `var()`. Geometry stays on `#workspace`. Demo imports both CSS files, boots `aetheris-glass`, and prepends a Glass/Prism control that only calls `host.setTheme`. Session-only; layout persist unchanged.

**Tech Stack:** npm workspaces, vanilla CSS, TypeScript, Vitest + happy-dom, existing compositor / desktop-shell / shell-demo. No daisyUI package. No Tailwind in compositor/shell.

**Spec:** `docs/superpowers/specs/2026-09-08-workshell-theme-contract-design.md`

**Ownership:** Coordinating session owns `packages/desktop-shell/src/shell.css`. Do not parallelize implementers on that file or on `apps/shell-demo/src/demo.css`. Glass and prism packages have no overlap and may run in parallel after Task 1.

**Worktree:** Create via `using-git-worktrees` at execution time. Run `npm test` / `npx tsc` from the worktree. Do not kill José's Vite.

**Review:** Skip the two-stage reviewer loop. José: prefer subagents for bounded tasks (blank context); coordinating session implements `shell.css` if needed.

**Pointer-path rules:** no `getBoundingClientRect` / `offsetWidth` / `clientWidth` in `pointermove`; no `localStorage` in `pointermove`; no Tailwind class toggles on the moving panel during move.

**Do not** tick these plan checkboxes as work proceeds (no docs theater). Commits are the record.

---

## File map

| File | Responsibility |
|---|---|
| `packages/themes/contract.test.ts` | Required vars present in both skins; no `:root`; no geometry; no retired names; webp exists |
| `packages/themes/aetheris-glass/package.json` | `@workshell/theme-aetheris-glass` |
| `packages/themes/aetheris-glass/tokens.css` | `[data-theme="aetheris-glass"]` vars + veil escape hatch |
| `packages/themes/aetheris-glass/glass.webp` | Copy from `archive/aetheris-glass/glass.webp` |
| `packages/themes/aetheris-prism/package.json` | `@workshell/theme-aetheris-prism` |
| `packages/themes/aetheris-prism/tokens.css` | `[data-theme="aetheris-prism"]` vars + veil + panel shadow escape hatch |
| `packages/themes/aetheris-prism/abstract.webp` | Copy from `archive/aetheris-prism/abstract.webp` |
| `packages/themes/aetheris/` | **Delete** |
| `packages/desktop-shell/src/shell.css` | Geometry + chrome paint via tokens |
| `packages/compositor/src/compositor.css` | `html,body,#app` transparent; no pigment |
| `apps/shell-demo/src/demo.css` | Widgets via tokens only |
| `apps/shell-demo/src/widgets/theme-switch.ts` | Taskbar Glass/Prism control |
| `apps/shell-demo/src/widgets/theme-switch.test.ts` | Click → `setTheme` |
| `apps/shell-demo/src/main.ts` | Import both CSS; boot glass; mount switcher |
| `apps/shell-demo/index.html` | Load Inter |
| `apps/shell-demo/package.json` | Depend on both theme packages |
| `packages/desktop-shell/src/host.test.ts` | `theme: "aetheris-glass"` |
| `apps/shell-demo/src/widgets/kanban.test.ts` | `theme: "aetheris-glass"` |
| `apps/shell-demo/src/windows/task-104.test.ts` | `theme: "aetheris-glass"` |
| `README.md` | Packages + switcher acceptance line |

---

### Task 1: Contract test

**Files:**
- Create: `packages/themes/contract.test.ts`

- [ ] **Step 1: Write the failing contract test**

```ts
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const dir = dirname(fileURLToPath(import.meta.url));

export const CONTRACT_VARS = [
  "--color-base-100",
  "--color-base-200",
  "--color-base-300",
  "--color-base-content",
  "--color-primary",
  "--color-primary-content",
  "--color-secondary",
  "--color-secondary-content",
  "--color-accent",
  "--color-accent-content",
  "--color-neutral",
  "--color-neutral-content",
  "--color-info",
  "--color-info-content",
  "--color-success",
  "--color-success-content",
  "--color-warning",
  "--color-warning-content",
  "--color-error",
  "--color-error-content",
  "--surface",
  "--surface-card",
  "--surface-border",
  "--surface-blur",
  "--font-sans",
  "--font-display",
  "--font-mono",
  "--radius-box",
  "--radius-field",
  "--radius-selector",
  "--border",
  "--wallpaper",
] as const;

const GEOMETRY = ["--taskbar-h", "--taskbar-gap", "--left-w", "--right-w"];
const RETIRED = ["--cyan", "--cyan-dim", "--violet", "--green", "--bg-panel", "--muted"];

function load(rel: string): string {
  return readFileSync(join(dir, rel), "utf8");
}

function assertContract(css: string, theme: string, scheme: "dark" | "light") {
  expect(css, `${theme} must not use :root`).not.toMatch(/:root/);
  expect(css).toContain(`[data-theme="${theme}"]`);
  expect(css).toContain(`color-scheme: ${scheme}`);
  for (const name of CONTRACT_VARS) {
    expect(css, `${theme} missing ${name}`).toContain(name);
  }
  for (const name of GEOMETRY) {
    expect(css, `${theme} must not define ${name}`).not.toContain(name);
  }
  for (const name of RETIRED) {
    expect(css, `${theme} retired ${name}`).not.toContain(name);
  }
}

describe("theme contract", () => {
  it("glass defines the closed list and ships glass.webp", () => {
    const css = load("aetheris-glass/tokens.css");
    assertContract(css, "aetheris-glass", "dark");
    expect(existsSync(join(dir, "aetheris-glass/glass.webp"))).toBe(true);
  });

  it("prism defines the closed list and ships abstract.webp", () => {
    const css = load("aetheris-prism/tokens.css");
    assertContract(css, "aetheris-prism", "light");
    expect(existsSync(join(dir, "aetheris-prism/abstract.webp"))).toBe(true);
  });
});
```

`--bg` is not in RETIRED as a substring check (it would collide with `--color-base-100`? No. `--bg` as `toContain("--bg")` would match nothing in `--color-base-100`. `--bg` would match `--bg` only. Skip `--bg` and `--text` in the retired scan; they are too short. `--bg-panel` is enough.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run packages/themes/contract.test.ts`
Expected: FAIL (ENOENT on tokens.css / webp)

- [ ] **Step 3: Commit the test only**

```bash
git add packages/themes/contract.test.ts
git commit -m "test: theme contract for glass and prism packages"
```

---

### Task 2: Glass package

**Files:**
- Create: `packages/themes/aetheris-glass/package.json`
- Create: `packages/themes/aetheris-glass/tokens.css`
- Create: `packages/themes/aetheris-glass/glass.webp` (copy)

- [ ] **Step 1: Copy the wallpaper**

```bash
mkdir -p packages/themes/aetheris-glass
cp archive/aetheris-glass/glass.webp packages/themes/aetheris-glass/glass.webp
```

- [ ] **Step 2: Write package.json**

```json
{
  "name": "@workshell/theme-aetheris-glass",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "exports": {
    ".": "./tokens.css",
    "./tokens.css": "./tokens.css"
  }
}
```

- [ ] **Step 3: Write tokens.css**

```css
[data-theme="aetheris-glass"] {
  color-scheme: dark;

  --color-base-100: #0b0e14;
  --color-base-200: #121826;
  --color-base-300: #1a2233;
  --color-base-content: #f0f4fa;

  --color-primary: #00f0ff;
  --color-primary-content: #041018;
  --color-secondary: #8a3ffc;
  --color-secondary-content: #f5efff;
  --color-accent: #00ff85;
  --color-accent-content: #04140c;
  --color-neutral: #1a2030;
  --color-neutral-content: #f0f4fa;

  --color-info: #38bdf8;
  --color-info-content: #082f49;
  --color-success: #27c93f;
  --color-success-content: #05210c;
  --color-warning: #ffbd2e;
  --color-warning-content: #3b2a00;
  --color-error: #ff5f56;
  --color-error-content: #3b0a08;

  --surface: rgba(16, 18, 28, 0.45);
  --surface-card: rgba(16, 18, 28, 0.55);
  --surface-border: rgba(255, 255, 255, 0.12);
  --surface-blur: 40px;

  --font-sans: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;

  --radius-box: 16px;
  --radius-field: 8px;
  --radius-selector: 999px;
  --border: 1px;

  --wallpaper: url("./glass.webp");
}

[data-theme="aetheris-glass"] #wallpaper::after {
  background: rgba(5, 10, 20, 0.38);
}
```

- [ ] **Step 4: Run glass contract test**

Run: `npx vitest run packages/themes/contract.test.ts`
Expected: glass test PASS; prism test still FAIL (ENOENT)

- [ ] **Step 5: Commit**

```bash
git add packages/themes/aetheris-glass
git commit -m "feat: add @workshell/theme-aetheris-glass"
```

---

### Task 3: Prism package

**Files:**
- Create: `packages/themes/aetheris-prism/package.json`
- Create: `packages/themes/aetheris-prism/tokens.css`
- Create: `packages/themes/aetheris-prism/abstract.webp` (copy)

May run in parallel with Task 2.

- [ ] **Step 1: Copy the wallpaper**

```bash
mkdir -p packages/themes/aetheris-prism
cp archive/aetheris-prism/abstract.webp packages/themes/aetheris-prism/abstract.webp
```

- [ ] **Step 2: Write package.json**

```json
{
  "name": "@workshell/theme-aetheris-prism",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "exports": {
    ".": "./tokens.css",
    "./tokens.css": "./tokens.css"
  }
}
```

- [ ] **Step 3: Write tokens.css**

```css
[data-theme="aetheris-prism"] {
  color-scheme: light;

  --color-base-100: #f7f9fb;
  --color-base-200: #ffffff;
  --color-base-300: #e2e8f0;
  --color-base-content: #1e293b;

  --color-primary: #0284c7;
  --color-primary-content: #ffffff;
  --color-secondary: #7dd3fc;
  --color-secondary-content: #0c4a6e;
  --color-accent: #c084fc;
  --color-accent-content: #3b0764;
  --color-neutral: #334155;
  --color-neutral-content: #f8fafc;

  --color-info: #0284c7;
  --color-info-content: #ffffff;
  --color-success: #10b981;
  --color-success-content: #ffffff;
  --color-warning: #f59e0b;
  --color-warning-content: #1c1000;
  --color-error: #ba1a1a;
  --color-error-content: #ffffff;

  --surface: rgba(255, 255, 255, 0.55);
  --surface-card: rgba(255, 255, 255, 0.72);
  --surface-border: rgba(255, 255, 255, 0.8);
  --surface-blur: 24px;

  --font-sans: Inter, ui-sans-serif, system-ui, sans-serif;
  --font-display: "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;

  --radius-box: 16px;
  --radius-field: 10px;
  --radius-selector: 999px;
  --border: 1px;

  --wallpaper: url("./abstract.webp");
}

[data-theme="aetheris-prism"] #wallpaper::after {
  background: rgba(247, 249, 251, 0.22);
}

[data-theme="aetheris-prism"] .panel {
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.9),
    0 25px 50px -12px rgba(2, 132, 199, 0.08);
}
```

- [ ] **Step 4: Run both contract tests**

Run: `npx vitest run packages/themes/contract.test.ts`
Expected: PASS (2)

- [ ] **Step 5: Commit**

```bash
git add packages/themes/aetheris-prism
git commit -m "feat: add @workshell/theme-aetheris-prism"
```

---

### Task 4: Shell chrome consumes tokens

**Files:**
- Modify: `packages/desktop-shell/src/shell.css` (replace file)
- Modify: `packages/compositor/src/compositor.css` (html/body background)

Coordinating session owns `shell.css`. Do not start this until Tasks 2 and 3 have landed the token names (they already match the spec).

- [ ] **Step 1: Replace `packages/desktop-shell/src/shell.css` with structure + token paint**

Keep every existing structural rule. Add geometry and paint. Full file:

```css
#workspace {
  --taskbar-h: 64px;
  --taskbar-gap: 12px;
  --left-w: 320px;
  --right-w: 360px;
  background: var(--color-base-100);
  color: var(--color-base-content);
  font-family: var(--font-sans);
}

#wallpaper {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  background-image: var(--wallpaper);
  background-size: cover;
  background-position: center;
}

#wallpaper::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
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
  border: var(--border) solid var(--surface-border);
  background: transparent;
  color: color-mix(in srgb, var(--color-base-content) 55%, transparent);
}

.slot-tab[data-active="true"] {
  color: var(--color-base-content);
  background: var(--surface);
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
  border-radius: var(--radius-box);
  background: var(--surface);
  backdrop-filter: blur(var(--surface-blur)) saturate(190%);
  border: var(--border) solid var(--surface-border);
}

.task-pill {
  padding: 6px 14px;
  font-size: 11px;
  cursor: pointer;
  border: var(--border) solid var(--surface-border);
  background: var(--surface-card);
  color: var(--color-base-content);
  border-radius: var(--radius-selector);
  font-family: var(--font-display);
}

.task-pill[data-mode="float"],
.task-pill[data-mode="maximized"] {
  border-color: var(--color-primary);
  box-shadow: 0 0 12px color-mix(in srgb, var(--color-primary) 35%, transparent);
}

.task-pill[data-mode="hidden"] {
  opacity: 0.7;
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
  border-radius: var(--radius-box);
  left: var(--snap-x, 0px);
  top: var(--snap-y, 0px);
  width: var(--snap-w, 0px);
  height: var(--snap-h, 0px);
  border: var(--border) dashed var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
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
  background: color-mix(in srgb, var(--color-base-100) 62%, transparent);
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
  background: var(--surface);
  color: var(--color-base-content);
  border-radius: var(--radius-box);
  border: var(--border) solid var(--surface-border);
  box-shadow:
    0 24px 64px -12px color-mix(in srgb, var(--color-base-100) 65%, #000),
    inset 0 1px 0 var(--surface-border);
  backdrop-filter: blur(var(--surface-blur)) saturate(210%);
}

.panel[data-mode="maximized"] {
  border-radius: 0;
}

.panel[data-focus="true"] {
  box-shadow:
    0 0 0 1px var(--color-primary),
    0 0 18px color-mix(in srgb, var(--color-primary) 35%, transparent),
    0 24px 64px -12px color-mix(in srgb, var(--color-base-100) 65%, #000);
}

.panel.is-dragging,
.panel.is-dragging[data-focus="true"] {
  backdrop-filter: none;
  background: var(--color-base-100);
  box-shadow: 0 0 0 1px var(--color-primary);
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
  border-bottom: var(--border) solid var(--surface-border);
  font-family: var(--font-display);
  font-size: 13px;
}

.panel-title {
  flex: 1;
  letter-spacing: 0.04em;
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
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.35);
}

.tl-close {
  background: var(--color-error);
}

.tl-hide {
  background: var(--color-warning);
}

.tl-max {
  background: var(--color-success);
}

.panel-actions {
  display: flex;
  gap: 4px;
}

.panel-actions button {
  border-radius: var(--radius-field);
  font-size: 10px;
  padding: 2px 6px;
  cursor: pointer;
  border: var(--border) solid var(--surface-border);
  background: transparent;
  color: color-mix(in srgb, var(--color-base-content) 55%, transparent);
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

.resize-handle {
  background: linear-gradient(
    135deg,
    transparent 50%,
    color-mix(in srgb, var(--color-primary) 35%, transparent) 50%
  );
}
```

Note: compositor.css already defines `.resize-handle` geometry (`display`, `position`, size, cursor). This shell rule only adds the gradient paint. Do not copy `display: none` into shell.

- [ ] **Step 2: In `packages/compositor/src/compositor.css`, keep height lock and add transparent page chrome**

At the top, the existing `html, body, #app` block becomes:

```css
html,
body,
#app {
  height: 100%;
  margin: 0;
  overflow: hidden;
  background: transparent;
}
```

Do not set `color` or `font-family` here — those inherit from `#workspace` after boot.

- [ ] **Step 3: Run compositor + host tests (must stay green)**

Run: `npx vitest run packages/compositor packages/desktop-shell`
Expected: PASS (host still boots with `theme: "aetheris"` as an arbitrary string)

- [ ] **Step 4: Commit**

```bash
git add packages/desktop-shell/src/shell.css packages/compositor/src/compositor.css
git commit -m "feat: paint shell chrome from theme tokens"
```

---

### Task 5: Demo widgets use tokens

**Files:**
- Modify: `apps/shell-demo/src/demo.css` (replace color literals)

- [ ] **Step 1: Replace `apps/shell-demo/src/demo.css`**

```css
#kanban {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(340px, 1fr));
  gap: 16px;
  overflow-x: auto;
}

.kanban-lane {
  display: flex;
  flex-direction: column;
  min-width: 340px;
  min-height: 0;
  overflow: hidden;
  padding: 12px;
  border-radius: var(--radius-box);
  background: var(--surface);
  backdrop-filter: blur(16px) saturate(160%);
  border: var(--border) solid var(--surface-border);
}

.kanban-lane-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 4px 12px;
  margin-bottom: 12px;
  border-bottom: var(--border) solid var(--surface-border);
  flex-shrink: 0;
}

.kanban-lane-head h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.kanban-count {
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 2px 8px;
  border-radius: var(--radius-selector);
  background: color-mix(in srgb, var(--color-primary) 16%, transparent);
  color: var(--color-primary);
  border: var(--border) solid color-mix(in srgb, var(--color-primary) 35%, transparent);
}

.kanban-lane-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.kanban-card {
  padding: 12px;
  border-radius: var(--radius-box);
  background: var(--surface-card);
  backdrop-filter: blur(28px) saturate(190%);
  border: var(--border) solid var(--surface-border);
}

.kanban-card h3 {
  margin: 8px 0 6px;
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
}

.kanban-card p {
  margin: 0;
  font-size: 12px;
  color: color-mix(in srgb, var(--color-base-content) 55%, transparent);
  line-height: 1.45;
}

.kanban-card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: 10px;
}

.kanban-card-meta span:first-child {
  padding: 2px 8px;
  border-radius: var(--radius-field);
  background: color-mix(in srgb, var(--color-accent) 22%, transparent);
  color: var(--color-accent-content);
  border: var(--border) solid color-mix(in srgb, var(--color-accent) 38%, transparent);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-weight: 600;
}

.kanban-card-meta span:last-child {
  color: color-mix(in srgb, var(--color-base-content) 55%, transparent);
}

.kanban-card[data-purpose="active-target-card"] {
  border-color: var(--color-primary);
  box-shadow:
    0 0 0 1px var(--color-primary),
    0 0 24px color-mix(in srgb, var(--color-primary) 35%, transparent);
}

.inspector {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr) 260px;
  flex: 1;
  min-height: 0;
  height: 100%;
}

.inspector-pane {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  border-right: var(--border) solid var(--surface-border);
}

.inspector-pane:last-child {
  border-right: none;
}

.inspector-pane-head {
  flex-shrink: 0;
  padding: 10px 12px;
  font-family: var(--font-display);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-primary);
  border-bottom: var(--border) solid var(--surface-border);
}

.inspector-pane-body,
.inspector-pane .file-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 10px 12px;
}

.inspector-pane[data-pane="chat"] {
  width: 280px;
}

.inspector-pane[data-pane="spec"] {
  min-width: 0;
}

.inspector-pane[data-pane="attachments"] {
  width: 260px;
}

.file-list {
  list-style: none;
  margin: 0;
}

.file-row {
  font-family: var(--font-mono);
  font-size: 12px;
  padding: 8px 10px;
  margin-bottom: 6px;
  border-radius: var(--radius-field);
  border: var(--border) solid var(--surface-border);
  background: var(--surface-card);
}

.cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card,
.msg,
.stat {
  border: var(--border) solid var(--surface-border);
  border-radius: var(--radius-field);
  padding: 8px 10px;
  background: var(--surface-card);
}

.msg {
  margin-bottom: 8px;
}

.msg strong {
  display: block;
  font-size: 12px;
  margin-bottom: 4px;
}

.msg p {
  margin: 0;
  font-size: 13px;
  color: color-mix(in srgb, var(--color-base-content) 55%, transparent);
  line-height: 1.45;
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
  background: var(--color-base-100);
  border-radius: var(--radius-field);
  overflow: auto;
  font-family: var(--font-mono);
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
  background: var(--color-base-100);
  color: color-mix(in srgb, var(--color-base-content) 55%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
}

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
  border-color: color-mix(in srgb, var(--color-primary) 45%, transparent);
}

button.kanban-card:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.task-doc {
  padding: 20px 24px;
  color: var(--color-base-content);
}

.task-doc-id {
  margin: 0 0 8px;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--color-primary);
}

.task-doc h1 {
  margin: 0 0 8px;
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 600;
}

.task-doc-meta {
  margin: 0 0 16px;
  font-size: 12px;
  opacity: 0.7;
}

.theme-switch {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-right: 8px;
  flex-shrink: 0;
}

.theme-switch button {
  font-family: var(--font-display);
  font-size: 11px;
  padding: 6px 10px;
  border-radius: var(--radius-selector);
  border: var(--border) solid var(--surface-border);
  background: transparent;
  color: var(--color-base-content);
  cursor: pointer;
}

.theme-switch button[aria-pressed="true"] {
  background: var(--surface-card);
  border-color: var(--color-primary);
  color: var(--color-primary);
}
```

- [ ] **Step 2: Confirm no retired pigment names remain in demo.css**

```bash
rg -n "var\\(--cyan|var\\(--violet|var\\(--muted|var\\(--text)|#4ee6e0|#00f0ff|#8a3ffc" apps/shell-demo/src/demo.css
```

Expected: no matches

- [ ] **Step 3: Commit**

```bash
git add apps/shell-demo/src/demo.css
git commit -m "feat: demo widgets consume theme roles"
```

---

### Task 6: Theme switcher

**Files:**
- Create: `apps/shell-demo/src/widgets/theme-switch.ts`
- Create: `apps/shell-demo/src/widgets/theme-switch.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it, vi } from "vitest";
import { mountThemeSwitch } from "./theme-switch";

describe("theme switch", () => {
  it("prepends Glass/Prism and calls setTheme", () => {
    const taskbar = document.createElement("nav");
    const pill = document.createElement("button");
    pill.className = "task-pill";
    taskbar.append(pill);
    const setTheme = vi.fn();
    mountThemeSwitch(taskbar, setTheme);
    const group = taskbar.firstElementChild as HTMLElement;
    expect(group.className).toBe("theme-switch");
    expect(group.getAttribute("role")).toBe("group");
    const buttons = [...group.querySelectorAll("button")];
    expect(buttons.map((b) => b.textContent)).toEqual(["Glass", "Prism"]);
    expect(buttons[0].getAttribute("aria-pressed")).toBe("true");
    expect(buttons[1].getAttribute("aria-pressed")).toBe("false");
    buttons[1].click();
    expect(setTheme).toHaveBeenCalledWith("aetheris-prism");
    expect(buttons[0].getAttribute("aria-pressed")).toBe("false");
    expect(buttons[1].getAttribute("aria-pressed")).toBe("true");
    buttons[0].click();
    expect(setTheme).toHaveBeenCalledWith("aetheris-glass");
    expect(taskbar.querySelector(".task-pill")).toBe(pill);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run apps/shell-demo/src/widgets/theme-switch.test.ts`
Expected: FAIL (`mountThemeSwitch` not defined / cannot find module)

- [ ] **Step 3: Implement**

```ts
const THEMES = [
  { id: "aetheris-glass", label: "Glass" },
  { id: "aetheris-prism", label: "Prism" },
] as const;

export function mountThemeSwitch(
  taskbar: HTMLElement,
  setTheme: (name: string) => void,
  initial = "aetheris-glass",
): void {
  const group = document.createElement("div");
  group.className = "theme-switch";
  group.setAttribute("role", "group");
  group.setAttribute("aria-label", "Theme");
  for (const { id, label } of THEMES) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label;
    btn.dataset.themeId = id;
    btn.setAttribute("aria-pressed", String(id === initial));
    btn.addEventListener("click", () => {
      setTheme(id);
      for (const b of group.querySelectorAll("button")) {
        b.setAttribute("aria-pressed", String(b === btn));
      }
    });
    group.append(btn);
  }
  taskbar.prepend(group);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run apps/shell-demo/src/widgets/theme-switch.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/shell-demo/src/widgets/theme-switch.ts apps/shell-demo/src/widgets/theme-switch.test.ts
git commit -m "feat: demo taskbar theme switcher"
```

---

### Task 7: Wire demo, delete old theme, README

**Files:**
- Modify: `apps/shell-demo/package.json`
- Modify: `apps/shell-demo/src/main.ts`
- Modify: `apps/shell-demo/index.html`
- Modify: `packages/desktop-shell/src/host.test.ts`
- Modify: `apps/shell-demo/src/widgets/kanban.test.ts`
- Modify: `apps/shell-demo/src/windows/task-104.test.ts`
- Modify: `README.md`
- Delete: `packages/themes/aetheris/`

- [ ] **Step 1: Update demo `package.json` dependencies**

Replace `"@workshell/theme-aetheris": "*"` with:

```json
    "@workshell/theme-aetheris-glass": "*",
    "@workshell/theme-aetheris-prism": "*"
```

- [ ] **Step 2: Replace `apps/shell-demo/src/main.ts`**

```ts
import { createDesktop } from "@workshell/desktop-shell";
import "@workshell/compositor/compositor.css";
import "@workshell/desktop-shell/shell.css";
import "@workshell/theme-aetheris-glass/tokens.css";
import "@workshell/theme-aetheris-prism/tokens.css";
import "./demo.css";
import { seedLayout } from "./seed";
import { mountKanban } from "./widgets/kanban";
import { mountThemeSwitch } from "./widgets/theme-switch";
import { fillWindow } from "./windows/task-window";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("#app missing");

const host = createDesktop(app);
const engine = host.boot({
  theme: "aetheris-glass",
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

const taskbar = host.workspace.querySelector("#taskbar");
if (!(taskbar instanceof HTMLElement)) throw new Error("#taskbar missing");
mountThemeSwitch(taskbar, (name) => host.setTheme(name));

Object.assign(window, { workshell: engine });
```

- [ ] **Step 3: Add Inter to `apps/shell-demo/index.html` font href**

Replace the fonts `href` with:

```
https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;600&family=Plus+Jakarta+Sans:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap
```

- [ ] **Step 4: Replace `theme: "aetheris"` with `theme: "aetheris-glass"` in**

- `packages/desktop-shell/src/host.test.ts` (all boot calls). The assertion `expect(host.workspace.dataset.theme).toBe("aetheris")` becomes `"aetheris-glass"`. Keep `host.setTheme("other")` → `"other"`.
- `apps/shell-demo/src/widgets/kanban.test.ts`
- `apps/shell-demo/src/windows/task-104.test.ts`

- [ ] **Step 5: Delete the old package**

```bash
rm -rf packages/themes/aetheris
```

- [ ] **Step 6: README**

Packages line:

```
Packages: `@workshell/compositor`, `@workshell/desktop-shell`, `@workshell/theme-aetheris-glass`, `@workshell/theme-aetheris-prism`. App: `@workshell/shell-demo`.
```

Add after item 1b:

```
1c. Taskbar **Glass** / **Prism** switches the skin for this session (reload returns to Glass). Layout persist does not store the theme.
```

- [ ] **Step 7: Install + test + tsc**

```bash
npm install
npx vitest run
npx tsc -p packages/compositor --noEmit
npx tsc -p packages/desktop-shell --noEmit
npx tsc -p apps/shell-demo --noEmit
```

Expected: all tests PASS (contract 2 + previous suite + theme-switch). No `@workshell/theme-aetheris` left in `package.json` files (lockfile will drop it after install).

- [ ] **Step 8: Commit**

```bash
git add apps/shell-demo packages/desktop-shell/src/host.test.ts README.md
git add -u packages/themes/aetheris
git commit -m "feat: boot glass, switch prism, remove theme-aetheris"
```

---

## Self-review (plan vs spec)

| Spec item | Task |
|---|---|
| Family packages + webp | 2, 3 |
| Closed token list / no `:root` / no geometry in theme | 1, 2, 3 |
| Status traffic lights | 4 |
| Shell owns chrome paint | 4 |
| Demo widgets tokens only | 5 |
| Taskbar switcher, session-only, boot glass | 6, 7 |
| Delete `@workshell/theme-aetheris` | 7 |
| Fonts: Inter + Jakarta | 7 |
| README 1c | 7 |
| No persist key change / no spa / no pointer-path | none (non-goals) |
| Angular later uses same door | documented in spec only |

Prism warning `#F59E0B` is the spec pick (DESIGN.md has no warning swatch).
