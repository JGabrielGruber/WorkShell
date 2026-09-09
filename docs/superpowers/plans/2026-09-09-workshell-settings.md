# Settings + Theme Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `@workshell/theme` (engine + builtin `base` + catalog), rewire session hive persist onto it, paint chrome/kit with the new token list, and boot Settings as the first guest.

**Architecture:** `@workshell/theme` is uxtheme: `createTheme()`, `register`/`list`/`apply`, auto-registers `base`. Session owns one `Theme`, remembers workspace, writes `workshell.prefs.v1`. Settings is a package that mounts Navigator at `settings:/appearance`. Entry is JS-only.

**Tech Stack:** npm workspaces, TypeScript, Vitest + happy-dom, vanilla CSS. No Tailwind in theme/session/desktop/settings/entry.

**Spec:** `docs/superpowers/specs/2026-09-09-workshell-settings-design.md`

**Worktree:** Create via `using-git-worktrees` at execution time. Run `npm test` / `npx tsc --noEmit` from the worktree. Do not kill José's Vite. Do not push. Do not force-push.

**Pointer-path rules:** no `getBoundingClientRect` / `offsetWidth` / `clientWidth` / `localStorage` / class toggles on `pointermove`.

**Do not:** redo aetheris-glass/prism; extra Settings pages; overlay UI; `session.registerTheme`; `setTheme(workspace, name)`; `import "*.css"` in `apps/session`; new geometry tokens; unregister; register-after-boot; `mount(el, ctx)`; kit `specimen()`.

**Order:** Tasks 1–2 (`@workshell/theme`) sequential. Task 3 (session) needs the engine. Task 4 (CSS graph) needs the engine import. Task 5 (Settings) needs session arity. Task 6 (entry) last. Do not parallelize later tasks onto an unfinished engine.

**Call sites that must move with Task 3** (search these; do not leave old arity):

- `packages/session/src/session.ts` / `session.test.ts`
- `packages/desktop/src/host.test.ts` / `menu.test.ts`
- `apps/session/src/main.ts`

---

## File map

| File | Responsibility |
|---|---|
| `packages/theme/package.json` | `@workshell/theme` |
| `packages/theme/tsconfig.json` | extends repo base |
| `packages/theme/src/css.d.ts` | `declare module "*.css"` |
| `packages/theme/src/theme.ts` | `createTheme`, catalog, `apply` |
| `packages/theme/src/theme.test.ts` | list/register/apply |
| `packages/theme/src/base/tokens.css` | `[data-theme="base"]` closed list + hatches |
| `packages/theme/src/tokens.test.ts` | contract on base CSS |
| `packages/theme/src/index.ts` | import tokens.css; re-export |
| `packages/themes/contract.test.ts` | skip glass/prism this spec |
| `packages/session/src/session.ts` | own `Theme`; `setTheme(name)` |
| `packages/session/src/session.test.ts` | allowlist, no workspace arg |
| `packages/session/src/index.ts` | re-export `Theme` types if needed (optional) |
| `packages/session/package.json` | depend on `@workshell/theme` |
| `packages/compositor/src/index.ts` | `import "@workshell/theme"` + `./compositor.css` |
| `packages/compositor/src/css.d.ts` | `declare module "*.css"` |
| `packages/compositor/package.json` | depend on `@workshell/theme` |
| `packages/desktop/src/index.ts` | same CSS graph |
| `packages/desktop/src/shell.css` | drop `--glass*`; chrome mapping |
| `packages/desktop/src/shell.css.test.ts` | no `--glass`, no hex, has `var(--shadow)` |
| `packages/kit/src/index.ts` | CSS graph |
| `packages/kit/src/kit.css` | `box-shadow: var(--shadow*)` |
| `packages/kit/src/kit.css.test.ts` | assert `--shadow`, still no `--glass` |
| `packages/navigator/src/index.ts` | CSS graph |
| `packages/settings/` | `@workshell/settings` |
| `apps/session/src/main.ts` | JS only; register Settings |
| `apps/session/index.html` | drop Google Fonts |
| `apps/session/package.json` | settings; drop aetheris deps |
| `README.md` | Base + Settings acceptance |

Root `workspaces` already includes `packages/*`. No glob change.

---

### Task 1: Theme engine (catalog + apply)

**Files:**
- Create: `packages/theme/package.json`
- Create: `packages/theme/tsconfig.json`
- Create: `packages/theme/src/css.d.ts`
- Create: `packages/theme/src/theme.ts`
- Create: `packages/theme/src/theme.test.ts`
- Create: `packages/theme/src/base/tokens.css` (stub — real tokens in Task 2)
- Create: `packages/theme/src/index.ts`

- [ ] **Step 1: Scaffold package**

`packages/theme/package.json`:

```json
{
  "name": "@workshell/theme",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./tokens.css": "./src/base/tokens.css"
  }
}
```

`packages/theme/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "noEmit": true },
  "include": ["src"]
}
```

`packages/theme/src/css.d.ts`:

```ts
declare module "*.css";
```

`packages/theme/src/base/tokens.css` (stub so the side-effect import type-checks):

```css
[data-theme="base"] {
  color-scheme: light;
}
```

`packages/theme/src/index.ts`:

```ts
import "./base/tokens.css";
export { createTheme, baseTheme } from "./theme";
export type { Theme, ThemeRegistration } from "./theme";
```

Run: `npm install` at repo root.

- [ ] **Step 2: Write failing engine tests**

`packages/theme/src/theme.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { baseTheme, createTheme } from "./theme";

describe("createTheme", () => {
  it("auto-registers base first", () => {
    const theme = createTheme();
    expect(theme.list()).toEqual([baseTheme]);
    expect(baseTheme.id).toBe("base");
    expect(baseTheme.title).toBe("Base");
    expect(baseTheme.description.length).toBeGreaterThan(0);
  });

  it("apply stamps a registered id", () => {
    const theme = createTheme();
    const el = document.createElement("div");
    theme.apply(el, "base");
    expect(el.dataset.theme).toBe("base");
  });

  it("apply unknown id throws and does not stamp", () => {
    const theme = createTheme();
    const el = document.createElement("div");
    expect(() => theme.apply(el, "nope")).toThrow(/theme/);
    expect(el.dataset.theme).toBeUndefined();
  });

  it("duplicate register throws", () => {
    const theme = createTheme();
    expect(() => theme.register(baseTheme)).toThrow(/already registered/);
  });

  it("register empty fields throw", () => {
    const theme = createTheme();
    expect(() => theme.register({ id: "", title: "X", description: "X" })).toThrow();
    expect(() => theme.register({ id: "x", title: "", description: "X" })).toThrow();
    expect(() => theme.register({ id: "x", title: "X", description: "" })).toThrow();
  });

  it("register extra skin then apply", () => {
    const theme = createTheme();
    const prism = { id: "prism", title: "Prism", description: "x" };
    theme.register(prism);
    expect(theme.list()).toEqual([baseTheme, prism]);
    const el = document.createElement("div");
    theme.apply(el, "prism");
    expect(el.dataset.theme).toBe("prism");
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run packages/theme/src/theme.test.ts`

Expected: FAIL (module `./theme` missing).

- [ ] **Step 4: Implement engine**

`packages/theme/src/theme.ts`:

```ts
export type ThemeRegistration = {
  id: string;
  title: string;
  description: string;
};

export const baseTheme: ThemeRegistration = {
  id: "base",
  title: "Base",
  description: "Opaque classic chrome. No photo, no blur.",
};

export type Theme = {
  register(theme: ThemeRegistration): void;
  list(): ThemeRegistration[];
  apply(el: HTMLElement, id: string): void;
};

export function createTheme(): Theme {
  const catalog: ThemeRegistration[] = [];

  const api: Theme = {
    register(theme) {
      if (!theme.id || !theme.title || !theme.description) {
        throw new Error("id, title, and description required");
      }
      if (catalog.some((t) => t.id === theme.id)) {
        throw new Error("already registered");
      }
      catalog.push(theme);
    },
    list() {
      return [...catalog];
    },
    apply(el, id) {
      if (!catalog.some((t) => t.id === id)) throw new Error("theme");
      el.dataset.theme = id;
    },
  };

  api.register(baseTheme);
  return api;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run packages/theme/src/theme.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/theme
git commit -m "feat: add theme engine with builtin base catalog"
```

---

### Task 2: Base tokens + contract; skip aetheris

**Files:**
- Modify: `packages/theme/src/base/tokens.css`
- Create: `packages/theme/src/tokens.test.ts`
- Modify: `packages/themes/contract.test.ts`

- [ ] **Step 1: Write failing contract test**

`packages/theme/src/tokens.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "base/tokens.css"),
  "utf8",
);

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
  "--color-muted",
  "--font-sans",
  "--font-display",
  "--font-mono",
  "--font-serif",
  "--text-xs",
  "--text-sm",
  "--text-md",
  "--text-lg",
  "--text-xl",
  "--leading",
  "--tracking",
  "--radius-box",
  "--radius-field",
  "--radius-selector",
  "--border",
  "--shadow-sm",
  "--shadow",
  "--shadow-md",
  "--shadow-lg",
  "--shadow-inner",
  "--blur",
  "--blur-sm",
  "--wallpaper",
  "--space-2",
  "--space-4",
  "--space-6",
  "--space-8",
  "--space-12",
  "--space-16",
  "--space-24",
] as const;

const GEOMETRY = ["--taskbar-h", "--taskbar-gap", "--left-w", "--right-w"];

describe("base tokens", () => {
  it("defines the closed list on [data-theme=base]", () => {
    expect(css).not.toMatch(/:root/);
    expect(css).toContain('[data-theme="base"]');
    expect(css).toContain("color-scheme: light");
    for (const name of CONTRACT_VARS) {
      expect(css, `missing ${name}`).toContain(name);
    }
    for (const name of GEOMETRY) {
      expect(css, `must not define ${name}`).not.toContain(name);
    }
    expect(css).not.toMatch(/--glass/);
    expect(css).toMatch(/--wallpaper:\s*none/);
    expect(css).not.toMatch(/url\(/);
    expect(css).toMatch(/--radius-box:\s*0/);
    expect(css).toMatch(/--radius-field:\s*0/);
    expect(css).toMatch(/--radius-selector:\s*0/);
    expect(css).toMatch(/--blur:\s*0px/);
    expect(css).toMatch(/--blur-sm:\s*0px/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run packages/theme/src/tokens.test.ts`

Expected: FAIL (stub CSS missing names).

- [ ] **Step 3: Write tokens + hatches**

Replace `packages/theme/src/base/tokens.css` with:

```css
[data-theme="base"] {
  color-scheme: light;
  --color-base-100: #ffffff;
  --color-base-200: #c0c0c0;
  --color-base-300: #808080;
  --color-base-content: #000000;
  --color-primary: #000080;
  --color-primary-content: #ffffff;
  --color-secondary: #1084d0;
  --color-secondary-content: #ffffff;
  --color-accent: #008080;
  --color-accent-content: #ffffff;
  --color-neutral: #c0c0c0;
  --color-neutral-content: #000000;
  --color-info: #000080;
  --color-info-content: #ffffff;
  --color-success: #008000;
  --color-success-content: #ffffff;
  --color-warning: #808000;
  --color-warning-content: #000000;
  --color-error: #800000;
  --color-error-content: #ffffff;
  --color-muted: #808080;
  --font-sans: Tahoma, "MS Sans Serif", Arial, sans-serif;
  --font-display: Tahoma, "MS Sans Serif", Arial, sans-serif;
  --font-mono: Consolas, "Courier New", monospace;
  --font-serif: "Times New Roman", Times, serif;
  --text-xs: 9px;
  --text-sm: 11px;
  --text-md: 12px;
  --text-lg: 13px;
  --text-xl: 16px;
  --leading: 1.2;
  --tracking: 0;
  --radius-box: 0;
  --radius-field: 0;
  --radius-selector: 0;
  --border: 1px;
  --shadow-sm: inset 1px 1px #808080, inset -1px -1px #ffffff;
  --shadow: inset -1px -1px #000000, inset 1px 1px #ffffff, inset -2px -2px #808080, inset 2px 2px #dfdfdf;
  --shadow-inner: inset 1px 1px #808080, inset -1px -1px #ffffff, inset 2px 2px #000000, inset -2px -2px #dfdfdf;
  --shadow-md: inset -1px -1px #000000, inset 1px 1px #ffffff, inset -3px -3px #808080, inset 3px 3px #dfdfdf;
  --shadow-lg: inset -1px -1px #000000, inset 1px 1px #ffffff, inset -2px -2px #808080, inset 2px 2px #dfdfdf, 1px 1px 0 #000000;
  --blur: 0px;
  --blur-sm: 0px;
  --wallpaper: none;
  --space-2: 2px;
  --space-4: 4px;
  --space-6: 6px;
  --space-8: 8px;
  --space-12: 12px;
  --space-16: 16px;
  --space-24: 24px;
}

[data-theme="base"] .panel[data-focus="true"] .panel-titlebar {
  background: linear-gradient(to right, var(--color-primary), var(--color-secondary));
  color: var(--color-primary-content);
}

[data-theme="base"] .panel:not([data-focus="true"]) .panel-titlebar {
  background: var(--color-base-300);
  color: var(--color-muted);
}

[data-theme="base"] #wallpaper::after {
  background: none;
}

[data-theme="base"] .menu-row:hover,
[data-theme="base"] .menu-row:focus-visible {
  background: var(--color-primary);
  color: var(--color-primary-content);
}
```

- [ ] **Step 4: Skip aetheris contract tests**

In `packages/themes/contract.test.ts`, wrap the two `it(...)` blocks with `it.skip` (keep the file; do not delete glass/prism CSS):

```ts
describe("theme contract", () => {
  it.skip("glass defines the closed list (stale until redo-skins)", () => {
    const css = load("aetheris-glass/tokens.css");
    assertContract(css, "aetheris-glass", "dark");
  });

  it.skip("prism defines the closed list (stale until redo-skins)", () => {
    const css = load("aetheris-prism/tokens.css");
    assertContract(css, "aetheris-prism", "light");
  });
});
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run packages/theme/src/tokens.test.ts packages/themes/contract.test.ts`

Expected: PASS (skipped tests listed, base contract green).

- [ ] **Step 6: Commit**

```bash
git add packages/theme/src/base/tokens.css packages/theme/src/tokens.test.ts packages/themes/contract.test.ts
git commit -m "feat: harvest Win32 base tokens into theme engine"
```

---

### Task 3: Session owns Theme; setTheme arity dies

**Files:**
- Modify: `packages/session/package.json` (add `"@workshell/theme": "*"`)
- Modify: `packages/session/src/session.ts`
- Modify: `packages/session/src/session.test.ts`
- Modify: `packages/session/src/index.ts` (re-export `Theme` / `ThemeRegistration` from `@workshell/theme` so Settings types stay one import if useful — **do** re-export types)
- Modify: `packages/desktop/src/host.test.ts`
- Modify: `packages/desktop/src/menu.test.ts`

Run `npm install` after package.json change.

- [ ] **Step 1: Rewrite session tests (they must fail on old arity)**

Replace `packages/session/src/session.test.ts` helpers and cases. Keep `fakeHosts`, `createPanel`, `mem`, `leftover`. **Delete** `glassSession`. **Delete** the “throws when defaultTheme is missing” test. Keep empty-string throw.

New / changed cases (full file):

```ts
import { describe, expect, it } from "vitest";
import { STORAGE_KEY, type EngineHosts } from "@workshell/compositor";
import { emptyLayout } from "./empty";
import { PREFS_KEY } from "./prefs";
import { createSession, type SessionOptions } from "./session";

function fakeHosts(): EngineHosts {
  const workspace = document.createElement("div");
  workspace.id = "workspace";
  const floatLayer = document.createElement("div");
  const snapPreview = document.createElement("div");
  floatLayer.append(snapPreview);
  return {
    workspace,
    wallpaper: document.createElement("div"),
    widgetLayer: document.createElement("div"),
    floatLayer,
    overlayHost: document.createElement("div"),
    overlayDim: document.createElement("div"),
    snapPreview,
    taskbar: document.createElement("div"),
  };
}

function createPanel(id: string, title: string): HTMLElement {
  const el = document.createElement("section");
  el.dataset.id = id;
  el.dataset.uid = id;
  el.innerHTML = `<div class="panel-title">${title}</div><div class="panel-body"></div>`;
  return el;
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

const leftover = {
  version: 2,
  slots: {
    left: { width: 320, order: ["probe"], activeId: "probe" },
    center: { width: 0, order: [], activeId: null },
    right: { width: 360, order: ["task-104"], activeId: "task-104" },
  },
  panels: {
    probe: { id: "probe", uid: "", title: "Probe", mode: "float", x: 1, y: 1, w: 100, h: 100, z: 1 },
    fake: { id: "fake", uid: "", title: "Fake", mode: "float", x: 2, y: 2, w: 100, h: 100, z: 2 },
  },
  overlay: { id: "probe", restore: { mode: "float" as const } },
  closed: ["task-104", "fake"],
  nextZ: 4,
};

function boot(session: ReturnType<typeof createSession>, hosts = fakeHosts()) {
  return {
    engine: session.boot({
      hosts,
      workspace: hosts.workspace,
      seed: emptyLayout,
      createPanel,
    }),
    hosts,
  };
}

describe("createSession", () => {
  it("throws when defaultTheme is empty", () => {
    expect(() => createSession({ defaultTheme: "" })).toThrow(/defaultTheme/);
  });

  it("exposes theme catalog with base and no registerTheme", () => {
    const session = createSession({ storage: mem() });
    expect(session.theme.list()[0]?.id).toBe("base");
    expect(session).not.toHaveProperty("registerTheme");
    expect(session).not.toHaveProperty("themes");
  });

  it("setTheme before boot throws", () => {
    const session = createSession({ storage: mem() });
    expect(() => session.setTheme("base")).toThrow(/boot/);
  });

  it("setTheme stamps and writes prefs", () => {
    const storage = mem();
    const session = createSession({ storage });
    const { hosts } = boot(session);
    session.setTheme("base");
    expect(hosts.workspace.dataset.theme).toBe("base");
    expect(session.getTheme()).toBe("base");
    expect(JSON.parse(storage.getItem(PREFS_KEY)!)).toEqual({ version: 1, theme: "base" });
  });

  it("setTheme unknown throws; no stamp; no write", () => {
    const storage = mem();
    const session = createSession({ storage });
    const { hosts } = boot(session);
    expect(() => session.setTheme("nope")).toThrow(/theme/);
    expect(hosts.workspace.dataset.theme).toBe("base");
    expect(storage.getItem(PREFS_KEY)).toBeNull();
  });

  it("getTheme is undefined before boot", () => {
    const session = createSession({ storage: mem() });
    expect(session.getTheme()).toBeUndefined();
  });

  it("list is live after register", () => {
    const session = createSession({ storage: mem() });
    expect(session.list()).toEqual([]);
    session.register({ id: "fake", title: "Fake", mount: () => {} });
    expect(session.list()).toEqual([{ id: "fake", title: "Fake" }]);
  });
});

describe("boot", () => {
  it("stamps base when prefs are missing and does not write PREFS_KEY", () => {
    const storage = mem();
    const writes: string[] = [];
    const setItem = storage.setItem.bind(storage);
    storage.setItem = (k, v) => {
      if (k === PREFS_KEY) writes.push(v);
      setItem(k, v);
    };
    const session = createSession({ storage });
    const { hosts } = boot(session);
    expect(hosts.workspace.dataset.theme).toBe("base");
    expect(writes).toEqual([]);
    expect(storage.getItem(PREFS_KEY)).toBeNull();
  });

  it("unknown stored theme falls back to default without write", () => {
    const storage = mem();
    const raw = JSON.stringify({ version: 1, theme: "ghost" });
    storage.setItem(PREFS_KEY, raw);
    const session = createSession({ storage });
    const { hosts } = boot(session);
    expect(hosts.workspace.dataset.theme).toBe("base");
    expect(storage.getItem(PREFS_KEY)).toBe(raw);
  });

  it("stamps stored prefs theme when registered", () => {
    const storage = mem();
    storage.setItem(PREFS_KEY, JSON.stringify({ version: 1, theme: "prism" }));
    const session = createSession({ storage });
    session.theme.register({ id: "prism", title: "Prism", description: "x" });
    const { hosts } = boot(session);
    expect(hosts.workspace.dataset.theme).toBe("prism");
  });

  it("boot throws when defaultTheme is not in the catalog", () => {
    const session = createSession({ defaultTheme: "prism", storage: mem() });
    expect(() => boot(session)).toThrow(/defaultTheme/);
    session.theme.register({ id: "prism", title: "Prism", description: "x" });
    const { hosts } = boot(session);
    expect(hosts.workspace.dataset.theme).toBe("prism");
  });

  it("drops leftover probe when the registry is empty", () => {
    const storage = mem();
    storage.setItem(STORAGE_KEY, JSON.stringify(leftover));
    const session = createSession({ storage });
    const { engine } = boot(session);
    expect(engine.state.panels.probe).toBeUndefined();
    expect(engine.state.panels).toEqual({});
  });

  it("keeps registered leftover fake and drops probe", () => {
    const storage = mem();
    storage.setItem(STORAGE_KEY, JSON.stringify(leftover));
    const session = createSession({ storage });
    session.register({ id: "fake", title: "Fake", mount: () => {} });
    const { engine } = boot(session);
    expect(engine.state.panels.fake).toBeDefined();
    expect(engine.state.panels.probe).toBeUndefined();
  });

  it("throws on a second boot", () => {
    const session = createSession({ storage: mem() });
    boot(session);
    expect(() => boot(session)).toThrow(/already/);
  });

  it("throws when createPanel result has no .panel-body", () => {
    const storage = mem();
    storage.setItem(STORAGE_KEY, JSON.stringify(leftover));
    const session = createSession({ storage });
    session.register({ id: "probe", title: "Probe", mount: () => {} });
    const hosts = fakeHosts();
    expect(() =>
      session.boot({
        hosts,
        workspace: hosts.workspace,
        seed: emptyLayout,
        createPanel: (id) => {
          const el = document.createElement("section");
          el.dataset.id = id;
          el.dataset.uid = id;
          return el;
        },
      }),
    ).toThrow(/panel-body/);
  });
});
```

- [ ] **Step 2: Run session tests — expect FAIL**

Run: `npx vitest run packages/session/src/session.test.ts`

Expected: FAIL (arity / missing `theme`).

- [ ] **Step 3: Implement session**

`packages/session/package.json` dependencies:

```json
"dependencies": {
  "@workshell/compositor": "*",
  "@workshell/theme": "*"
}
```

Replace `packages/session/src/session.ts` with:

```ts
import {
  WorkspaceEngine,
  type EngineHosts,
  type LayoutState,
} from "@workshell/compositor";
import { createTheme, type Theme } from "@workshell/theme";
import { wrapLayoutStorage } from "./layout-storage";
import { readPrefs, writePrefs } from "./prefs";
import { AppRegistry, type AppRegistration } from "./registry";

export type SessionOptions = {
  defaultTheme?: string;
  storage?: Storage;
  theme?: Theme;
};

export type SessionBoot = {
  hosts: EngineHosts;
  workspace: HTMLElement;
  seed: () => LayoutState;
  createPanel: (id: string, title: string) => HTMLElement;
};

export type WorkshellSession = {
  readonly storage: Storage;
  readonly theme: Theme;
  register(app: AppRegistration): void;
  list(): Array<{ id: string; title: string }>;
  mount(id: string, el: HTMLElement): void;
  setTheme(name: string): void;
  getTheme(): string | undefined;
  boot(opts: SessionBoot): WorkspaceEngine;
};

export function createSession(opts: SessionOptions = {}): WorkshellSession {
  if (opts.defaultTheme === "") throw new Error("defaultTheme required");
  const storage = opts.storage ?? localStorage;
  const defaultTheme = opts.defaultTheme ?? "base";
  const theme = opts.theme ?? createTheme();
  const registry = new AppRegistry();
  let booted = false;
  let workspace: HTMLElement | undefined;

  const ids = () => new Set(theme.list().map((t) => t.id));

  const session: WorkshellSession = {
    storage,
    theme,
    register(app) {
      registry.register(app);
    },
    list() {
      return registry.list();
    },
    mount(id, el) {
      registry.mount(id, el);
    },
    setTheme(name) {
      if (!workspace) throw new Error("boot required");
      theme.apply(workspace, name);
      writePrefs(storage, name);
    },
    getTheme() {
      return workspace?.dataset.theme;
    },
    boot({ hosts, workspace: ws, seed, createPanel }) {
      if (booted) throw new Error("already booted");
      if (!ids().has(defaultTheme)) throw new Error("defaultTheme");
      workspace = ws;
      const wrapped = wrapLayoutStorage(storage, () => registry.ids());
      const prefs = readPrefs(storage);
      const name = prefs?.theme && ids().has(prefs.theme) ? prefs.theme : defaultTheme;
      theme.apply(ws, name);
      const engine = new WorkspaceEngine(hosts, wrapped, seed);
      engine.boot((id) => {
        const title = engine.state.panels[id]?.title ?? registry.title(id) ?? id;
        const el = createPanel(id, title);
        const body = el.querySelector(".panel-body");
        if (!(body instanceof HTMLElement)) throw new Error("panel-body missing");
        session.mount(id, body);
        return el;
      });
      booted = true;
      return engine;
    },
  };

  return session;
}
```

`packages/session/src/index.ts` — add:

```ts
export type { Theme, ThemeRegistration } from "@workshell/theme";
```

Keep existing exports.

- [ ] **Step 4: Patch desktop tests to `createSession({ storage: mem() })`**

In `packages/desktop/src/host.test.ts` and `packages/desktop/src/menu.test.ts`:

- Replace `glassSession` with:

```ts
function session(storage: Storage = mem()) {
  return createSession({ storage });
}
```

- Replace every `glassSession(...)` call with `session(...)`.
- Change `expect(workspace.dataset.theme).toBe("aetheris-glass")` to `"base"` (both `dataset.theme` and `getAttribute("data-theme")`).
- Rename the test `"stamps glass and does not write prefs"` → `"stamps base and does not write prefs"`.

Do **not** pass a workspace into `setTheme`/`getTheme` anywhere.

- [ ] **Step 5: Run tests**

Run: `npx vitest run packages/session/src/session.test.ts packages/desktop/src/host.test.ts packages/desktop/src/menu.test.ts`

Expected: PASS.

If CSS side-effect import of `@workshell/theme` blows up Vitest (`Unknown file extension ".css"`), add to `vitest.config.ts`:

```ts
export default defineConfig({
  test: {
    environment: "happy-dom",
    passWithNoTests: true,
    include: ["packages/**/*.test.ts", "apps/**/*.test.ts"],
  },
});
```

Vitest uses Vite; CSS imports should already work. If they do not, add `css: { preprocessorOptions: {} }` is **wrong** — instead keep the `declare module "*.css"` and ensure the import path is the package name. Do not stub-out the engine.

- [ ] **Step 6: Commit**

```bash
git add packages/session packages/desktop/src/host.test.ts packages/desktop/src/menu.test.ts package-lock.json
git commit -m "feat: session persists theme via engine apply"
```

---

### Task 4: CSS graph + chrome rewrite

**Files:**
- Modify: `packages/compositor/package.json` (dep `@workshell/theme`)
- Create: `packages/compositor/src/css.d.ts` (`declare module "*.css"`)
- Modify: `packages/compositor/src/index.ts`
- Modify: `packages/desktop/package.json` (dep `@workshell/theme`)
- Create: `packages/desktop/src/css.d.ts`
- Modify: `packages/desktop/src/index.ts`
- Modify: `packages/desktop/src/shell.css` (full replace of pigment)
- Create: `packages/desktop/src/shell.css.test.ts`
- Modify: `packages/kit/package.json`
- Create: `packages/kit/src/css.d.ts`
- Modify: `packages/kit/src/index.ts`
- Modify: `packages/kit/src/kit.css`
- Modify: `packages/kit/src/kit.css.test.ts`
- Modify: `packages/navigator/package.json`
- Create: `packages/navigator/src/css.d.ts`
- Modify: `packages/navigator/src/index.ts`
- Modify: `packages/navigator/src/navigator.css` (add `box-shadow: var(--shadow)` on `.nav`)
- Modify: `packages/navigator/src/navigator.css.test.ts` if it should assert `--shadow`

`css.d.ts` in every package that imports CSS:

```ts
declare module "*.css";
```

- [ ] **Step 1: Failing pigment tests for desktop**

`packages/desktop/src/shell.css.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "shell.css"), "utf8");
const index = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "index.ts"), "utf8");

describe("shell.css pigment", () => {
  it("imports the theme engine and own css from JS", () => {
    expect(index).toContain('import "@workshell/theme"');
    expect(index).toContain('import "./shell.css"');
  });

  it("uses tokens only; no glass", () => {
    expect(css).not.toMatch(/--glass/);
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/rgba?\(/);
    expect(css).toContain("var(--color-accent)");
    expect(css).toContain("var(--wallpaper)");
    expect(css).toContain("var(--shadow)");
    expect(css).toContain("var(--shadow-md)");
    expect(css).toContain("var(--shadow-lg)");
    expect(css).toContain("var(--blur)");
    expect(css).toContain("background-color: var(--color-accent)");
  });
});
```

Add the same import assertion to kit and compositor via small tests, **or** fold compositor into:

`packages/compositor/src/index.ts.test.ts` is unnecessary if you add to an existing file. Create `packages/compositor/src/css-graph.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const dir = dirname(fileURLToPath(import.meta.url));
const index = readFileSync(join(dir, "index.ts"), "utf8");
const css = readFileSync(join(dir, "compositor.css"), "utf8");

describe("compositor css graph", () => {
  it("imports theme + own css; no glass", () => {
    expect(index).toContain('import "@workshell/theme"');
    expect(index).toContain('import "./compositor.css"');
    expect(css).not.toMatch(/--glass/);
  });
});
```

Kit: extend `kit.css.test.ts`:

```ts
const index = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "index.ts"), "utf8");

it("imports theme engine from JS", () => {
  expect(index).toContain('import "@workshell/theme"');
  expect(index).toContain('import "./kit.css"');
});
```

And in the pigment test, add:

```ts
expect(css).toContain("var(--shadow)");
expect(css).toContain("var(--shadow-inner)");
```

Keep the existing `color-mix` assertion **only if** kit.css still contains that exact string. After the kit rewrite below it will **not** — **drop** the `color-mix...primary 35%` expect; selected rows use `--color-primary` / `--color-primary-content`.

Navigator `navigator.css.test.ts`: add index import asserts (read `index.ts`) and `expect(css).toContain("var(--shadow)")`.

- [ ] **Step 2: Run pigment tests — expect FAIL**

Run: `npx vitest run packages/desktop/src/shell.css.test.ts packages/kit/src/kit.css.test.ts packages/navigator/src/navigator.css.test.ts packages/compositor/src/css-graph.test.ts`

Expected: FAIL (`--glass` still in shell.css; missing imports).

- [ ] **Step 3: Wire JS indexes + package.json deps**

Each of compositor / desktop / kit / navigator `package.json` `dependencies` must include `"@workshell/theme": "*"`. Kit already has no deps — add theme. Navigator already depends on kit — **also** depend on theme (spec: every CSS-owning package imports the engine).

Compositor `src/index.ts` **first lines**:

```ts
import "@workshell/theme";
import "./compositor.css";
```

Desktop `src/index.ts` first lines:

```ts
import "@workshell/theme";
import "./shell.css";
```

Kit `src/index.ts` first lines:

```ts
import "@workshell/theme";
import "./kit.css";
```

Navigator `src/index.ts` first lines:

```ts
import "@workshell/theme";
import "./navigator.css";
```

Then existing exports.

Run `npm install`.

- [ ] **Step 4: Rewrite `packages/desktop/src/shell.css`**

Replace the **entire** file with this (geometry kept; pigment is the mapping table; **no** `--glass`, **no** hex, **no** `rgba(`):

```css
#workspace {
  --taskbar-h: 64px;
  --taskbar-gap: 12px;
  --left-w: 320px;
  --right-w: 360px;
  background: transparent;
  color: var(--color-base-content);
  font-family: var(--font-sans);
}

#wallpaper {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  background-color: var(--color-accent);
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
  border-radius: var(--radius-box);
  padding: 2px 10px;
  font-size: var(--text-sm);
  cursor: pointer;
  border: var(--border) solid var(--color-base-300);
  background: transparent;
  color: var(--color-muted);
}

.slot-tab[data-active="true"] {
  color: var(--color-base-content);
  background: var(--color-base-200);
  box-shadow: var(--shadow);
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
  background: var(--color-base-200);
  color: var(--color-base-content);
  box-shadow: var(--shadow);
  backdrop-filter: blur(var(--blur));
}

#taskbar [data-slot="pills"] {
  display: flex;
  align-items: center;
  gap: 8px;
}

#taskbar [data-slot="menu"] {
  display: flex;
  align-items: center;
  position: relative;
}

.menu-button {
  padding: 6px 14px;
  font-size: var(--text-sm);
  cursor: pointer;
  border: none;
  background: var(--color-base-200);
  color: var(--color-base-content);
  border-radius: var(--radius-selector);
  font-family: var(--font-display);
  box-shadow: var(--shadow);
}

.menu-list {
  position: absolute;
  left: 0;
  bottom: calc(100% + 8px);
  min-width: 160px;
  display: flex;
  flex-direction: column;
  padding: 6px;
  border-radius: var(--radius-box);
  background: var(--color-base-200);
  box-shadow: var(--shadow-lg);
  z-index: 40;
}

.menu-list[hidden] {
  display: none;
}

.menu-row {
  padding: 6px 12px;
  font-size: var(--text-md);
  text-align: left;
  cursor: pointer;
  border: none;
  background: transparent;
  color: var(--color-base-content);
  border-radius: var(--radius-selector);
  font-family: var(--font-sans);
}

.task-pill {
  padding: 6px 14px;
  font-size: var(--text-sm);
  cursor: pointer;
  border: none;
  background: var(--color-base-200);
  color: var(--color-base-content);
  border-radius: var(--radius-selector);
  font-family: var(--font-display);
  box-shadow: var(--shadow);
}

.task-pill[data-mode="float"],
.task-pill[data-mode="maximized"] {
  box-shadow: var(--shadow-inner);
}

.task-pill[data-mode="hidden"] {
  color: var(--color-muted);
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
  background: color-mix(in srgb, var(--color-base-content) 45%, transparent);
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
  background: var(--color-base-200);
  color: var(--color-base-content);
  border-radius: var(--radius-box);
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(var(--blur));
}

.panel[data-mode="maximized"] {
  border-radius: 0;
}

.panel[data-focus="true"] {
  box-shadow: var(--shadow-lg);
}

.panel.is-dragging,
.panel.is-dragging[data-focus="true"] {
  backdrop-filter: none;
  background: var(--color-base-300);
  box-shadow: var(--shadow);
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
  font-family: var(--font-display);
  font-size: var(--text-lg);
}

.panel-title {
  flex: 1;
  letter-spacing: var(--tracking);
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
  box-shadow: var(--shadow-inner);
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
  font-size: var(--text-xs);
  padding: 2px 6px;
  cursor: pointer;
  border: none;
  background: var(--color-base-200);
  color: var(--color-muted);
  box-shadow: var(--shadow);
}

.panel-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--color-base-100);
  color: var(--color-base-content);
  box-shadow: var(--shadow-inner);
}

.panel-body:not(:has(.inspector)) {
  overflow: auto;
  padding: 10px;
}

.resize-handle {
  background: color-mix(in srgb, var(--color-primary) 35%, transparent);
}
```

`color-mix` is allowed (uses tokens). Hex is not.

- [ ] **Step 5: Rewrite kit.css pigment**

Replace `packages/kit/src/kit.css` with:

```css
.ws-page,
.ws-tree,
.ws-list,
.ws-icons,
.ws-dialog {
  background: var(--color-base-200);
  color: var(--color-base-content);
  font-family: var(--font-sans);
  box-shadow: var(--shadow);
  border-radius: var(--radius-box);
}

.ws-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  padding: var(--space-12);
  min-height: 100%;
  box-sizing: border-box;
}

.ws-page-title,
.ws-dialog-title {
  font-family: var(--font-display);
  font-size: var(--text-lg);
}

.ws-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  font-family: var(--font-sans);
  color: var(--color-base-content);
}

.ws-field input[type="text"] {
  background: var(--color-base-100);
  color: var(--color-base-content);
  border: none;
  border-radius: var(--radius-field);
  font-family: var(--font-sans);
  padding: var(--space-6) var(--space-8);
  box-shadow: var(--shadow-inner);
}

.ws-field input:focus-visible,
.ws-btn:focus-visible,
.ws-treeitem:focus-visible,
.ws-option:focus-visible,
.ws-tab:focus-visible,
.ws-icon:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.ws-field:has([disabled]),
.ws-btn:disabled {
  color: var(--color-muted);
  pointer-events: none;
}

.ws-treeitem:hover,
.ws-option:hover,
.ws-icon:hover {
  background: var(--color-base-300);
}

.ws-treeitem[aria-selected="true"],
.ws-option[aria-selected="true"] {
  background: var(--color-primary);
  color: var(--color-primary-content);
}

.ws-btn {
  font-family: var(--font-sans);
  border: none;
  border-radius: var(--radius-field);
  padding: var(--space-6) var(--space-12);
  cursor: pointer;
  background: var(--color-base-200);
  color: var(--color-base-content);
  box-shadow: var(--shadow);
}

.ws-btn-primary {
  background: var(--color-primary);
  color: var(--color-primary-content);
}

.ws-btn-neutral {
  background: var(--color-base-200);
  color: var(--color-base-content);
}

.ws-btn-danger {
  background: var(--color-error);
  color: var(--color-error-content);
}

.ws-tablist {
  display: flex;
  gap: var(--space-4);
  border-radius: var(--radius-selector);
}

.ws-tab {
  font-family: var(--font-sans);
  background: var(--color-base-200);
  color: var(--color-base-content);
  border: none;
  border-radius: var(--radius-selector);
  padding: var(--space-4) var(--space-8);
  cursor: pointer;
  box-shadow: var(--shadow);
}

.ws-tab[aria-selected="true"] {
  background: var(--color-base-100);
  box-shadow: var(--shadow-inner);
}

.ws-dialog {
  background: var(--color-base-100);
  border-radius: var(--radius-box);
  padding: var(--space-12);
  box-shadow: var(--shadow-lg);
}

.ws-icon {
  background: var(--color-base-100);
  border-radius: var(--radius-box);
  padding: var(--space-16);
  cursor: pointer;
  list-style: none;
  box-shadow: var(--shadow-inner);
}

.ws-icons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-8);
}

.ws-tree,
.ws-list {
  list-style: none;
  margin: 0;
  padding: var(--space-8);
}
```

Update `kit.css.test.ts` pigment expects to match (tokens listed above; **no** `color-mix` string; **no** `--glass`).

- [ ] **Step 6: Navigator chrome**

Add to `.nav` in `packages/navigator/src/navigator.css`:

```css
  box-shadow: var(--shadow);
  border-radius: var(--radius-box);
```

Keep `--nav-leading-w` / `--nav-trailing-w` (navigator geometry, not theme).

- [ ] **Step 7: Run tests + tsc**

Run: `npm test` and `npx tsc --noEmit`

Expected: all green. Existing compositor engine tests must still pass (CSS import is a side effect).

- [ ] **Step 8: Commit**

```bash
git add packages/compositor packages/desktop packages/kit packages/navigator package-lock.json
git commit -m "feat: paint chrome and kit from theme engine tokens"
```

---

### Task 5: Settings guest

**Files:**
- Create: `packages/settings/package.json`
- Create: `packages/settings/tsconfig.json`
- Create: `packages/settings/src/appearance.ts`
- Create: `packages/settings/src/appearance.test.ts`
- Create: `packages/settings/src/settings.ts`
- Create: `packages/settings/src/settings.test.ts`
- Create: `packages/settings/src/index.ts`

- [ ] **Step 1: Scaffold**

`packages/settings/package.json`:

```json
{
  "name": "@workshell/settings",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "dependencies": {
    "@workshell/kit": "*",
    "@workshell/navigator": "*",
    "@workshell/session": "*"
  }
}
```

`packages/settings/tsconfig.json`: same as session.

Run `npm install`.

- [ ] **Step 2: Failing tests**

`packages/settings/src/settings.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createSession, emptyLayout, PREFS_KEY } from "@workshell/session";
import { STORAGE_KEY } from "@workshell/compositor";
import { createDesktop } from "@workshell/desktop";
import { createSettings } from "./settings";

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

describe("createSettings", () => {
  it("registers as settings", () => {
    const session = createSession({ storage: mem() });
    const app = createSettings(session);
    expect(app.id).toBe("settings");
    expect(app.title).toBe("Settings");
  });

  it("mounts navigator at settings:/appearance and lists catalog", () => {
    const storage = mem();
    const session = createSession({ storage });
    session.register(createSettings(session));
    const { workspace, engine } = createDesktop(document.createElement("div"), session, {
      seed: emptyLayout,
    });
    engine.open("settings", { title: "Settings" });
    const body = engine.node("settings").querySelector(".panel-body")!;
    expect(body.querySelector(".nav")).toBeTruthy();
    const input = body.querySelector(".nav-chrome input") as HTMLInputElement;
    expect(input.value).toBe("settings:/appearance");
    expect(body.textContent).toContain("Appearance");
    expect(body.textContent).toContain("Base");
    const row = [...body.querySelectorAll("[data-id]")].find(
      (el) => (el as HTMLElement).dataset.id === "base",
    ) as HTMLElement;
    expect(row).toBeTruthy();
    row.click();
    expect(workspace.dataset.theme).toBe("base");
    expect(JSON.parse(storage.getItem(PREFS_KEY)!)).toEqual({ version: 1, theme: "base" });
    expect(workspace.querySelector("[data-slot=menu] [aria-label=Menu]")).toBeTruthy();
  });
});
```

Settings must **not** depend on compositor in package.json if you only import it in tests — **add** `@workshell/compositor` and `@workshell/desktop` as `devDependencies` (or dependencies) so the test import resolves. Use:

```json
"devDependencies": {
  "@workshell/compositor": "*",
  "@workshell/desktop": "*"
}
```

Desktop already depends on session; settings tests importing desktop is allowed. Production `createSettings` must **not** import desktop or compositor.

`packages/settings/src/appearance.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createSession, emptyLayout } from "@workshell/session";
import { appearanceView } from "./appearance";

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

describe("appearanceView", () => {
  it("lists session.theme.list titles", () => {
    const session = createSession({ storage: mem() });
    session.boot({
      hosts: {
        workspace: document.createElement("div"),
        wallpaper: document.createElement("div"),
        widgetLayer: document.createElement("div"),
        floatLayer: document.createElement("div"),
        overlayHost: document.createElement("div"),
        overlayDim: document.createElement("div"),
        snapPreview: document.createElement("div"),
        taskbar: document.createElement("div"),
      },
      workspace: document.createElement("div"),
      seed: emptyLayout,
      createPanel: (id) => {
        const el = document.createElement("section");
        el.innerHTML = `<div class="panel-body"></div>`;
        el.dataset.id = id;
        return el;
      },
    });
    const fakeCtx = { url: new URL("settings:/appearance"), go: () => {} };
    const el = appearanceView(fakeCtx, session);
    expect(el.className).toContain("ws-page");
    expect(el.textContent).toContain("Appearance");
    expect(el.querySelector('[data-id="base"]')?.textContent).toContain("Base");
  });
});
```

**Bug to avoid:** `session.boot` remembers the `workspace` argument, not `hosts.workspace`. Pass the **same** node:

```ts
const workspace = document.createElement("div");
session.boot({ hosts: { ... hosts.workspace: workspace }, workspace, seed, createPanel });
```

Fix the appearance test hosts so `hosts.workspace === workspace`.

- [ ] **Step 3: Run tests — expect FAIL**

Run: `npx vitest run packages/settings`

Expected: FAIL (package missing).

- [ ] **Step 4: Implement**

`packages/settings/src/appearance.ts`:

```ts
import { listView, page } from "@workshell/kit";
import type { ViewContext } from "@workshell/navigator";
import type { WorkshellSession } from "@workshell/session";

export function appearanceView(_ctx: ViewContext, session: WorkshellSession): HTMLElement {
  const body = document.createElement("div");
  const render = () => {
    const list = listView({
      items: session.theme.list().map((t) => ({ id: t.id, label: t.title })),
      selectedId: session.getTheme() ?? null,
      onSelect: (id) => {
        session.setTheme(id);
        render();
      },
    });
    body.replaceChildren(list);
  };
  render();
  return page({ title: "Appearance", body });
}
```

`packages/settings/src/settings.ts`:

```ts
import { Navigator } from "@workshell/navigator";
import type { AppRegistration, WorkshellSession } from "@workshell/session";
import { appearanceView } from "./appearance";

export function createSettings(session: WorkshellSession): AppRegistration {
  return {
    id: "settings",
    title: "Settings",
    mount(el) {
      const nav = new Navigator(el, { initialUrl: "settings:/appearance" });
      nav.register({
        scheme: "settings",
        views: { appearance: (ctx) => appearanceView(ctx, session) },
        rules: [{ path: "/", docks: { center: "appearance" } }],
      });
    },
  };
}
```

`packages/settings/src/index.ts`:

```ts
export { createSettings } from "./settings";
export { appearanceView } from "./appearance";
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run packages/settings`

Expected: PASS.

Also add a desktop-level case in `packages/desktop/src/host.test.ts` (or keep it only in settings tests): Menu lists Settings after `session.register(createSettings(session))`. The settings.test already opens via `engine.open`. Add this to `host.test.ts`:

```ts
import { createSettings } from "@workshell/settings";

it("menu lists Settings and opens the panel", () => {
  const s = session();
  s.register(createSettings(s));
  const { workspace, engine } = createDesktop(document.createElement("div"), s, { seed: emptyLayout });
  const btn = workspace.querySelector("[data-slot=menu] [aria-label=Menu]") as HTMLElement;
  btn.click();
  const list = btn.nextElementSibling as HTMLElement;
  const row = [...list.querySelectorAll("*")].find((el) => el.textContent === "Settings") as HTMLElement;
  expect(row).toBeTruthy();
  row.click();
  expect(engine.state.panels.settings).toBeDefined();
  expect(workspace.querySelector("[data-slot=menu] [aria-label=Menu]")).toBeTruthy();
});
```

That makes `@workshell/desktop` depend on `@workshell/settings` **for tests only**. Prefer **not** adding that production dep. Keep the menu assertion inside `packages/settings/src/settings.test.ts` instead (query `[data-slot=menu]` after register+createDesktop, click Menu, find Settings, click). **Do not** import settings from desktop production code.

Extend the existing settings test with the menu path (click Menu, then Settings) **in addition to** `engine.open`, or replace `engine.open` with the menu click so Task 6 acceptance is covered here:

After `createDesktop`:

```ts
const btn = workspace.querySelector("[data-slot=menu] [aria-label=Menu]") as HTMLElement;
btn.click();
const menuList = btn.nextElementSibling as HTMLElement;
const settingsRow = [...menuList.querySelectorAll("*")].find((el) => el.textContent === "Settings") as
  | HTMLElement
  | undefined;
expect(settingsRow).toBeTruthy();
settingsRow!.click();
```

Then assert panel + appearance as above.

- [ ] **Step 6: Commit**

```bash
git add packages/settings package-lock.json
git commit -m "feat: add Settings guest with Appearance catalog"
```

---

### Task 6: Entry JS-only; README

**Files:**
- Modify: `apps/session/src/main.ts`
- Modify: `apps/session/index.html`
- Modify: `apps/session/package.json`
- Create: `apps/session/src/main.test.ts` (assert no `.css` in main.ts via readFileSync)
- Modify: `README.md`

- [ ] **Step 1: Failing entry test**

`apps/session/src/main.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const dir = dirname(fileURLToPath(import.meta.url));
const main = readFileSync(join(dir, "main.ts"), "utf8");
const html = readFileSync(join(dir, "../index.html"), "utf8");

describe("session entry", () => {
  it("is JS-only and registers Settings", () => {
    expect(main).not.toMatch(/\.css/);
    expect(main).toContain("@workshell/settings");
    expect(main).toContain("createSettings");
    expect(main).toContain("createSession()");
    expect(html).not.toMatch(/fonts.googleapis.com/);
  });
});
```

- [ ] **Step 2: Run — expect FAIL** (main still imports CSS / glass)

Run: `npx vitest run apps/session/src/main.test.ts`

- [ ] **Step 3: Implement entry**

`apps/session/src/main.ts`:

```ts
import { createSession, emptyLayout } from "@workshell/session";
import { createDesktop } from "@workshell/desktop";
import { createSettings } from "@workshell/settings";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("#app missing");

const session = createSession();
session.register(createSettings(session));
const { engine, workspace } = createDesktop(app, session, { seed: emptyLayout });
Object.assign(window, { workshell: engine, session, workspace });
```

`apps/session/index.html` — strip the three Google Font `<link>`s. Keep charset, viewport, title, `#app`, module script.

`apps/session/package.json` dependencies:

```json
"dependencies": {
  "@workshell/desktop": "*",
  "@workshell/session": "*",
  "@workshell/settings": "*"
}
```

Drop compositor and aetheris from the **app** package.json (Vite follows desktop → compositor → theme). If the app build fails resolving compositor CSS from desktop’s JS import, add compositor back — **prefer** letting desktop pull it.

Run `npm install`.

README packages line: add `@workshell/theme`, `@workshell/settings`; keep aetheris as unregistered packages in the tree.

Replace acceptance with:

```
1. `npm run dev` serves teal desktop, chiseled chrome, Menu → Settings. No photo, no blur.
2. Appearance lists Base. Idle boot: prefs key **absent**. Clicking Base writes `workshell.prefs.v1`.
3. Console `session.setTheme("nope")` throws; desktop unchanged.
4. Console `session.setTheme("base")` writes prefs; reload stays base.
5. Layout key stays geometry-only. Leftover demo ids do not reappear.
6. Clear both `workshell.layout.v1` and `workshell.prefs.v1` to restore empty seed + base.
```

Console arity is `session.setTheme("base")` — **no** workspace argument.

- [ ] **Step 4: Run full verify**

Run: `npm test` and `npx tsc --noEmit`

Expected: green. Count will be > 79.

Grep from repo (exclude docs and `packages/themes/aetheris-*`):

```
rg "setTheme\\(workspace" packages apps
rg "registerTheme" packages apps
rg "aetheris-glass" packages apps
rg "import .*\\.css" apps/session
rg "--glass" packages/desktop packages/kit packages/navigator packages/compositor packages/theme packages/session packages/settings apps
```

Expected: no hits in those production paths (aetheris packages may still say glass).

- [ ] **Step 5: Commit**

```bash
git add apps/session README.md package-lock.json
git commit -m "feat: boot Settings on the empty session"
```

---

## Self-review (spec coverage)

| Spec requirement | Task |
|---|---|
| `@workshell/theme` engine + catalog + `apply` | 1 |
| Builtin `base` auto-register | 1 |
| `ThemeRegistration.description` | 1 |
| Closed token list + no `--glass` + no `url(` wallpaper | 2 |
| Hatches (caption gradient, wallpaper veil, menu hover) | 2 |
| Skip aetheris contract | 2 |
| Session owns `theme`; `setTheme(name)`; no write on unknown prefs | 3 |
| `defaultTheme` default `base`; empty string throws | 3 |
| Desktop tests use `base` | 3 |
| Packages import `@workshell/theme` + own CSS | 4 |
| Chrome mapping / kit shadows | 4 |
| Settings package + Appearance `listView` | 5 |
| Menu → Settings | 5 |
| Entry JS-only, no fonts, register Settings | 6 |
| README / console arity | 6 |

No `session.registerTheme`. No overlay. No specimen. No aetheris redo.
