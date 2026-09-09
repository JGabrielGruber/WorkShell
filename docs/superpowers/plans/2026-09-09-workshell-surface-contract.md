# Surface Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the form kit, navigator, and `probe:` guest so a kit page can sit in a navigator dock, restyle from the existing theme contract, and a second prefix can `register()` without editing desktop-shell or compositor.

**Architecture:** New packages `@workshell/kit` (primitives + recipes) and `@workshell/navigator` (address, history, three docks). Theme token list stays frozen. Demo owns `probe:` and seeds a Probe panel. Desktop-shell and compositor stay ignorant of URLs and kit class names. No pointer-path work. No Settings.

**Tech Stack:** npm workspaces, TypeScript, Vitest + happy-dom, vanilla CSS. No daisyUI, no Tailwind inside kit or navigator.

**Spec:** `docs/superpowers/specs/2026-09-09-workshell-surface-contract-design.md`

**Worktree:** Create via `using-git-worktrees` at execution time. Run `npm test` / `npx tsc --noEmit` from the worktree. Do not kill José's Vite.

**Pointer-path rules:** no `getBoundingClientRect` / `offsetWidth` / `clientWidth` / `localStorage` / class toggles on `pointermove`.

**Do not:** add theme tokens, import kit/navigator from desktop-shell or compositor, add `probe.css`, use compositor `slot()` / `dock()` for navigator docks, persist the theme, or build Settings.

**Order:** Tasks 1–4 (kit) are sequential. Tasks 5–6 (navigator) require kit. Tasks 7–9 (probe + demo) require navigator. Do not parallelize a later task onto an unfinished earlier package.

---

## File map

| File | Responsibility |
|---|---|
| `packages/kit/package.json` | `@workshell/kit` exports `.` and `./kit.css` |
| `packages/kit/tsconfig.json` | extends repo base |
| `packages/kit/src/kit.css` | primitive recipes; no hex; no `--glass*` |
| `packages/kit/src/kit.css.test.ts` | pigment contract |
| `packages/kit/src/button.ts` | `button()` |
| `packages/kit/src/button.test.ts` | kind, disabled, click |
| `packages/kit/src/field.ts` | `field()` text/checkbox |
| `packages/kit/src/field.test.ts` | label, disabled, onChange |
| `packages/kit/src/tree.ts` | `tree()` |
| `packages/kit/src/tree.test.ts` | roles, select |
| `packages/kit/src/list.ts` | `listView()` |
| `packages/kit/src/list.test.ts` | listbox select |
| `packages/kit/src/icons.ts` | `iconView()` |
| `packages/kit/src/icons.test.ts` | groups, select |
| `packages/kit/src/tabs.ts` | `tabs()` |
| `packages/kit/src/tabs.test.ts` | hidden panels |
| `packages/kit/src/page.ts` | `page()` |
| `packages/kit/src/page.test.ts` | `.ws-page` |
| `packages/kit/src/dialog.ts` | `dialogFrame()` |
| `packages/kit/src/dialog.test.ts` | `.ws-dialog` |
| `packages/kit/src/index.ts` | public exports |
| `packages/navigator/package.json` | `@workshell/navigator`; depends on kit |
| `packages/navigator/tsconfig.json` | extends repo base |
| `packages/navigator/src/history.ts` | `UrlHistory` |
| `packages/navigator/src/history.test.ts` | push/back/forward |
| `packages/navigator/src/registry.ts` | validate, sort, match rules |
| `packages/navigator/src/registry.test.ts` | throws, longest path |
| `packages/navigator/src/navigator.ts` | `Navigator` |
| `packages/navigator/src/navigator.test.ts` | register/go/history/css |
| `packages/navigator/src/navigator.css` | docks + chrome layout |
| `packages/navigator/src/index.ts` | public exports |
| `apps/shell-demo/src/probe/pages.ts` | `fieldsPage` and other pages |
| `apps/shell-demo/src/probe/pages.test.ts` | host-agnostic `fieldsPage` |
| `apps/shell-demo/src/probe/graph.ts` | in-memory tree |
| `apps/shell-demo/src/probe/app.ts` | `probeApp` registration |
| `apps/shell-demo/src/probe/mount.ts` | `mountProbe` |
| `apps/shell-demo/src/probe/mount.test.ts` | docks + tree → trailing |
| `apps/shell-demo/src/seed.ts` | add `probe` panel |
| `apps/shell-demo/src/seed.test.ts` | expect probe |
| `apps/shell-demo/src/main.ts` | CSS order + fill probe |
| `apps/shell-demo/package.json` | kit + navigator deps |
| `README.md` | packages + acceptance 1d |
| `docs/superpowers/specs/2026-09-09-workshell-surface-contract-design.md` | Status → approved |

Root `package.json` workspaces already include `packages/*`. After adding the two package.json files, run `npm install` so the lockfile links them.

---

### Task 1: Scaffold `@workshell/kit` and freeze kit CSS recipes

**Files:**
- Create: `packages/kit/package.json`
- Create: `packages/kit/tsconfig.json`
- Create: `packages/kit/src/index.ts`
- Create: `packages/kit/src/kit.css.test.ts`
- Create: `packages/kit/src/kit.css`

- [ ] **Step 1: Write the failing CSS contract test**

Create `packages/kit/src/kit.css.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "kit.css"), "utf8");

describe("kit.css pigment", () => {
  it("uses tokens only", () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/rgba?\(/);
    expect(css).not.toMatch(/hsla?\(/);
    expect(css).not.toMatch(/--glass/);
    expect(css).not.toMatch(/--taskbar-h/);
    expect(css).not.toMatch(/--left-w/);
    expect(css).not.toMatch(/--right-w/);
    expect(css).not.toMatch(/--wallpaper/);
  });

  it("declares the self-style recipes", () => {
    expect(css).toContain("var(--color-base-100)");
    expect(css).toContain("var(--color-base-200)");
    expect(css).toContain("var(--color-base-300)");
    expect(css).toContain("var(--color-base-content)");
    expect(css).toContain("var(--color-primary)");
    expect(css).toContain("var(--color-primary-content)");
    expect(css).toContain("var(--color-error)");
    expect(css).toContain("var(--color-error-content)");
    expect(css).toContain("var(--font-sans)");
    expect(css).toContain("var(--font-display)");
    expect(css).toContain("var(--radius-box)");
    expect(css).toContain("var(--radius-field)");
    expect(css).toContain("var(--radius-selector)");
    expect(css).toContain("var(--border)");
    expect(css).toContain("color-mix(in srgb, var(--color-primary) 35%, var(--color-base-200))");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run packages/kit/src/kit.css.test.ts`

Expected: FAIL (cannot read `kit.css` / file missing).

- [ ] **Step 3: Scaffold the package and write `kit.css`**

`packages/kit/package.json`:

```json
{
  "name": "@workshell/kit",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./kit.css": "./src/kit.css"
  }
}
```

`packages/kit/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "noEmit": true },
  "include": ["src"]
}
```

`packages/kit/src/index.ts`:

```ts
export {};
```

`packages/kit/src/kit.css`:

```css
.ws-page,
.ws-tree,
.ws-list,
.ws-icons,
.ws-dialog {
  background: var(--color-base-200);
  color: var(--color-base-content);
  font-family: var(--font-sans);
}

.ws-page {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  min-height: 100%;
  box-sizing: border-box;
}

.ws-page-title,
.ws-dialog-title {
  font-family: var(--font-display);
}

.ws-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-family: var(--font-sans);
  color: var(--color-base-content);
}

.ws-field input[type="text"] {
  background: var(--color-base-100);
  color: var(--color-base-content);
  border: var(--border) solid var(--color-base-300);
  border-radius: var(--radius-field);
  font-family: var(--font-sans);
  padding: 6px 8px;
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
  opacity: 0.45;
  pointer-events: none;
}

.ws-treeitem:hover,
.ws-option:hover,
.ws-icon:hover {
  background: var(--color-base-300);
}

.ws-treeitem[aria-selected="true"],
.ws-option[aria-selected="true"] {
  background: color-mix(in srgb, var(--color-primary) 35%, var(--color-base-200));
  color: var(--color-base-content);
}

.ws-btn {
  font-family: var(--font-sans);
  border: var(--border) solid var(--color-base-300);
  border-radius: var(--radius-field);
  padding: 6px 12px;
  cursor: pointer;
}

.ws-btn-primary {
  background: var(--color-primary);
  color: var(--color-primary-content);
  border-color: var(--color-primary);
}

.ws-btn-neutral {
  background: var(--color-base-300);
  color: var(--color-base-content);
}

.ws-btn-danger {
  background: var(--color-error);
  color: var(--color-error-content);
  border-color: var(--color-error);
}

.ws-tablist {
  display: flex;
  gap: 4px;
  border-radius: var(--radius-selector);
}

.ws-tab {
  font-family: var(--font-sans);
  background: transparent;
  color: var(--color-base-content);
  border: var(--border) solid var(--color-base-300);
  border-radius: var(--radius-selector);
  padding: 4px 10px;
  cursor: pointer;
}

.ws-tab[aria-selected="true"] {
  background: var(--color-base-100);
}

.ws-dialog {
  background: var(--color-base-100);
  border-radius: var(--radius-box);
  padding: 12px;
}

.ws-icon {
  background: var(--color-base-100);
  border-radius: var(--radius-box);
  padding: 16px;
  cursor: pointer;
  list-style: none;
}

.ws-icons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ws-tree,
.ws-list {
  list-style: none;
  margin: 0;
  padding: 8px;
}
```

Then: `npm install`

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run packages/kit/src/kit.css.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/kit package-lock.json
git commit -m "$(cat <<'EOF'
feat: add @workshell/kit package and token-only recipes

EOF
)"
```

---

### Task 2: `button` and `field`

**Files:**
- Create: `packages/kit/src/button.test.ts`
- Create: `packages/kit/src/button.ts`
- Create: `packages/kit/src/field.test.ts`
- Create: `packages/kit/src/field.ts`
- Modify: `packages/kit/src/index.ts`

- [ ] **Step 1: Write the failing tests**

`packages/kit/src/button.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { button } from "./button";

describe("button", () => {
  it("defaults to a neutral type=button", () => {
    const el = button({ label: "Go" });
    expect(el.tagName).toBe("BUTTON");
    expect(el.type).toBe("button");
    expect(el.textContent).toBe("Go");
    expect(el.className).toContain("ws-btn");
    expect(el.className).toContain("ws-btn-neutral");
  });

  it("applies kind, disabled, and click", () => {
    const onClick = vi.fn();
    const el = button({ label: "Save", kind: "primary", onClick });
    expect(el.className).toContain("ws-btn-primary");
    el.click();
    expect(onClick).toHaveBeenCalledOnce();
    const dead = button({ label: "X", kind: "danger", disabled: true, onClick });
    expect(dead.disabled).toBe(true);
    expect(dead.className).toContain("ws-btn-danger");
    dead.click();
    expect(onClick).toHaveBeenCalledOnce();
  });
});
```

`packages/kit/src/field.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { field } from "./field";

describe("field", () => {
  it("associates a visible label with a text input", () => {
    const el = field({ name: "address", label: "Address", value: "probe:/" });
    expect(el.classList.contains("ws-field")).toBe(true);
    const input = el.querySelector("input");
    const label = el.querySelector("label");
    expect(input).toBeTruthy();
    expect(input?.type).toBe("text");
    expect(input?.id).toBe("ws-field-address");
    expect(label?.htmlFor).toBe("ws-field-address");
    expect(label?.textContent).toBe("Address");
    expect(input?.value).toBe("probe:/");
  });

  it("wires checkbox, disabled, and onChange", () => {
    const onChange = vi.fn();
    const box = field({
      name: "on",
      label: "On",
      kind: "checkbox",
      value: true,
      onChange,
    });
    const input = box.querySelector("input")!;
    expect(input.type).toBe("checkbox");
    expect(input.checked).toBe(true);
    input.checked = false;
    input.dispatchEvent(new Event("change"));
    expect(onChange).toHaveBeenCalledWith(false);

    const dead = field({ name: "x", label: "X", disabled: true });
    expect(dead.querySelector("input")?.disabled).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run packages/kit/src/button.test.ts packages/kit/src/field.test.ts`

Expected: FAIL (cannot find module `./button` / `./field`).

- [ ] **Step 3: Implement `button` and `field`**

`packages/kit/src/button.ts`:

```ts
export type ButtonKind = "primary" | "neutral" | "danger";

export type ButtonOpts = {
  label: string;
  kind?: ButtonKind;
  disabled?: boolean;
  onClick?: () => void;
};

export function button(opts: ButtonOpts): HTMLButtonElement {
  const el = document.createElement("button");
  el.type = "button";
  const kind = opts.kind ?? "neutral";
  el.className = `ws-btn ws-btn-${kind}`;
  el.textContent = opts.label;
  if (opts.disabled) el.disabled = true;
  if (opts.onClick) el.addEventListener("click", opts.onClick);
  return el;
}
```

`packages/kit/src/field.ts`:

```ts
export type FieldOpts = {
  name: string;
  label: string;
  kind?: "text" | "checkbox";
  value?: string | boolean;
  disabled?: boolean;
  onChange?: (value: string | boolean) => void;
};

export function field(opts: FieldOpts): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "ws-field";
  const id = `ws-field-${opts.name}`;
  const label = document.createElement("label");
  label.htmlFor = id;
  label.textContent = opts.label;
  const input = document.createElement("input");
  input.id = id;
  input.name = opts.name;
  const kind = opts.kind ?? "text";
  input.type = kind;
  if (opts.disabled) input.disabled = true;
  if (kind === "checkbox") {
    input.checked = Boolean(opts.value);
  } else if (typeof opts.value === "string") {
    input.value = opts.value;
  }
  if (opts.onChange) {
    const eventName = kind === "checkbox" ? "change" : "input";
    input.addEventListener(eventName, () => {
      opts.onChange?.(kind === "checkbox" ? input.checked : input.value);
    });
  }
  wrap.append(label, input);
  return wrap;
}
```

Replace `packages/kit/src/index.ts` with:

```ts
export { button } from "./button";
export type { ButtonKind, ButtonOpts } from "./button";
export { field } from "./field";
export type { FieldOpts } from "./field";
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run packages/kit/src/button.test.ts packages/kit/src/field.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/kit/src
git commit -m "$(cat <<'EOF'
feat: add kit button and field primitives

EOF
)"
```

---

### Task 3: `tree`, `listView`, and `iconView`

**Files:**
- Create: `packages/kit/src/tree.test.ts`
- Create: `packages/kit/src/tree.ts`
- Create: `packages/kit/src/list.test.ts`
- Create: `packages/kit/src/list.ts`
- Create: `packages/kit/src/icons.test.ts`
- Create: `packages/kit/src/icons.ts`
- Modify: `packages/kit/src/index.ts`

- [ ] **Step 1: Write the failing tests**

`packages/kit/src/tree.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { tree } from "./tree";

describe("tree", () => {
  it("renders nested treeitems and reports onSelect", () => {
    const onSelect = vi.fn();
    const el = tree({
      nodes: [
        {
          id: "/",
          label: "Probe",
          children: [{ id: "/fields", label: "Fields" }],
        },
      ],
      selectedId: "/fields",
      onSelect,
    });
    expect(el.getAttribute("role")).toBe("tree");
    expect(el.classList.contains("ws-tree")).toBe(true);
    const items = [...el.querySelectorAll('[role="treeitem"]')];
    expect(items.map((n) => n.getAttribute("data-id"))).toEqual(["/", "/fields"]);
    expect(el.querySelector('[data-id="/fields"]')?.getAttribute("aria-selected")).toBe("true");
    el.querySelector('[data-id="/"]')!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onSelect).toHaveBeenCalledWith("/");
  });
});
```

`packages/kit/src/list.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { listView } from "./list";

describe("listView", () => {
  it("is a listbox and selects by id", () => {
    const onSelect = vi.fn();
    const el = listView({
      items: [
        { id: "a", label: "A" },
        { id: "b", label: "B" },
      ],
      selectedId: "a",
      onSelect,
    });
    expect(el.getAttribute("role")).toBe("listbox");
    expect(el.classList.contains("ws-list")).toBe(true);
    const b = el.querySelector('[data-id="b"]')!;
    expect(b.getAttribute("role")).toBe("option");
    b.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onSelect).toHaveBeenCalledWith("b");
  });
});
```

`packages/kit/src/icons.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { iconView } from "./icons";

describe("iconView", () => {
  it("groups tiles and reports onSelect", () => {
    const onSelect = vi.fn();
    const el = iconView({
      items: [
        { id: "/fields", label: "Fields", group: "Kit" },
        { id: "/tabs", label: "Tabs", group: "Kit" },
      ],
      onSelect,
    });
    expect(el.classList.contains("ws-icons")).toBe(true);
    expect(el.getAttribute("role")).toBe("list");
    expect(el.textContent).toContain("Kit");
    expect(el.textContent).toContain("Fields");
    el.querySelector('[data-id="/tabs"]')!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onSelect).toHaveBeenCalledWith("/tabs");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run packages/kit/src/tree.test.ts packages/kit/src/list.test.ts packages/kit/src/icons.test.ts`

Expected: FAIL (modules missing).

- [ ] **Step 3: Implement the three factories**

`packages/kit/src/tree.ts`:

```ts
export type TreeNode = { id: string; label: string; children?: TreeNode[] };

export type TreeOpts = {
  nodes: TreeNode[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
};

function renderNode(node: TreeNode, selectedId: string | null | undefined, depth: number): HTMLLIElement {
  const li = document.createElement("li");
  li.className = "ws-treeitem";
  li.setAttribute("role", "treeitem");
  li.dataset.id = node.id;
  li.setAttribute("aria-selected", node.id === selectedId ? "true" : "false");
  li.setAttribute("aria-level", String(depth + 1));
  li.style.paddingInlineStart = `${8 + depth * 12}px`;
  li.tabIndex = 0;
  li.textContent = node.label;
  return li;
}

function walk(nodes: TreeNode[], selectedId: string | null | undefined, depth: number, into: HTMLElement): void {
  for (const node of nodes) {
    into.append(renderNode(node, selectedId, depth));
    if (node.children?.length) walk(node.children, selectedId, depth + 1, into);
  }
}

export function tree(opts: TreeOpts): HTMLElement {
  const el = document.createElement("ul");
  el.className = "ws-tree";
  el.setAttribute("role", "tree");
  walk(opts.nodes, opts.selectedId, 0, el);
  if (opts.onSelect) {
    el.addEventListener("click", (e) => {
      const item = (e.target as HTMLElement | null)?.closest("[data-id]");
      const id = item instanceof HTMLElement ? item.dataset.id : undefined;
      if (id) opts.onSelect?.(id);
    });
  }
  return el;
}
```

`packages/kit/src/list.ts`:

```ts
export type ListItem = { id: string; label: string };

export type ListOpts = {
  items: ListItem[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
};

export function listView(opts: ListOpts): HTMLElement {
  const el = document.createElement("ul");
  el.className = "ws-list";
  el.setAttribute("role", "listbox");
  for (const item of opts.items) {
    const li = document.createElement("li");
    li.className = "ws-option";
    li.setAttribute("role", "option");
    li.dataset.id = item.id;
    li.setAttribute("aria-selected", item.id === opts.selectedId ? "true" : "false");
    li.tabIndex = 0;
    li.textContent = item.label;
    el.append(li);
  }
  if (opts.onSelect) {
    el.addEventListener("click", (e) => {
      const item = (e.target as HTMLElement | null)?.closest("[data-id]");
      const id = item instanceof HTMLElement ? item.dataset.id : undefined;
      if (id) opts.onSelect?.(id);
    });
  }
  return el;
}
```

`packages/kit/src/icons.ts`:

```ts
export type IconItem = { id: string; label: string; group?: string };

export type IconOpts = {
  items: IconItem[];
  onSelect?: (id: string) => void;
};

export function iconView(opts: IconOpts): HTMLElement {
  const el = document.createElement("div");
  el.className = "ws-icons";
  el.setAttribute("role", "list");
  const groups = new Map<string, IconItem[]>();
  for (const item of opts.items) {
    const g = item.group ?? "";
    const list = groups.get(g) ?? [];
    list.push(item);
    groups.set(g, list);
  }
  for (const [name, items] of groups) {
    if (name) {
      const h = document.createElement("div");
      h.className = "ws-icon-group";
      h.textContent = name;
      el.append(h);
    }
    for (const item of items) {
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "ws-icon";
      tile.setAttribute("role", "listitem");
      tile.dataset.id = item.id;
      tile.textContent = item.label;
      el.append(tile);
    }
  }
  if (opts.onSelect) {
    el.addEventListener("click", (e) => {
      const item = (e.target as HTMLElement | null)?.closest("[data-id]");
      const id = item instanceof HTMLElement ? item.dataset.id : undefined;
      if (id) opts.onSelect?.(id);
    });
  }
  return el;
}
```

Replace `packages/kit/src/index.ts` with:

```ts
export { button } from "./button";
export type { ButtonKind, ButtonOpts } from "./button";
export { field } from "./field";
export type { FieldOpts } from "./field";
export { tree } from "./tree";
export type { TreeNode, TreeOpts } from "./tree";
export { listView } from "./list";
export type { ListItem, ListOpts } from "./list";
export { iconView } from "./icons";
export type { IconItem, IconOpts } from "./icons";
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run packages/kit/src/tree.test.ts packages/kit/src/list.test.ts packages/kit/src/icons.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/kit/src
git commit -m "$(cat <<'EOF'
feat: add kit tree, list, and icon views

EOF
)"
```

---

### Task 4: `tabs`, `page`, `dialogFrame`

**Files:**
- Create: `packages/kit/src/tabs.test.ts`
- Create: `packages/kit/src/tabs.ts`
- Create: `packages/kit/src/page.test.ts`
- Create: `packages/kit/src/page.ts`
- Create: `packages/kit/src/dialog.test.ts`
- Create: `packages/kit/src/dialog.ts`
- Modify: `packages/kit/src/index.ts`

- [ ] **Step 1: Write the failing tests**

`packages/kit/src/tabs.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { tabs } from "./tabs";

describe("tabs", () => {
  it("shows only the active tabpanel", () => {
    const a = document.createElement("p");
    a.textContent = "A";
    const b = document.createElement("p");
    b.textContent = "B";
    const el = tabs({
      tabs: [
        { id: "one", label: "One", panel: a },
        { id: "two", label: "Two", panel: b },
      ],
      activeId: "one",
    });
    const tablist = el.querySelector('[role="tablist"]');
    expect(tablist).toBeTruthy();
    const panels = [...el.querySelectorAll('[role="tabpanel"]')];
    expect(panels).toHaveLength(2);
    expect(panels[0].hidden).toBe(false);
    expect(panels[1].hidden).toBe(true);
    el.querySelector('[data-id="two"]')!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(panels[0].hidden).toBe(true);
    expect(panels[1].hidden).toBe(false);
  });
});
```

`packages/kit/src/page.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { page } from "./page";

describe("page", () => {
  it("wraps title and body", () => {
    const body = document.createElement("div");
    body.className = "inner";
    const el = page({ title: "Fields", body });
    expect(el.classList.contains("ws-page")).toBe(true);
    expect(el.querySelector(".ws-page-title")?.textContent).toBe("Fields");
    expect(el.querySelector(".inner")).toBe(body);
  });
});
```

`packages/kit/src/dialog.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { dialogFrame } from "./dialog";

describe("dialogFrame", () => {
  it("is chrome, not a modal", () => {
    const body = document.createElement("p");
    body.textContent = "Hello";
    const actions = document.createElement("div");
    actions.className = "acts";
    const el = dialogFrame({ title: "Confirm", body, actions });
    expect(el.classList.contains("ws-dialog")).toBe(true);
    expect(el.querySelector(".ws-dialog-title")?.textContent).toBe("Confirm");
    expect(el.querySelector(".acts")).toBe(actions);
    expect(el.querySelector("dialog")).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run packages/kit/src/tabs.test.ts packages/kit/src/page.test.ts packages/kit/src/dialog.test.ts`

Expected: FAIL (modules missing).

- [ ] **Step 3: Implement the three factories**

`packages/kit/src/tabs.ts`:

```ts
export type Tab = { id: string; label: string; panel: HTMLElement };

export type TabsOpts = { tabs: Tab[]; activeId?: string };

export function tabs(opts: TabsOpts): HTMLElement {
  const root = document.createElement("div");
  root.className = "ws-tabs";
  const list = document.createElement("div");
  list.className = "ws-tablist";
  list.setAttribute("role", "tablist");
  const initial = opts.activeId ?? opts.tabs[0]?.id;
  const buttons: HTMLButtonElement[] = [];
  const panels: HTMLElement[] = [];

  function activate(id: string): void {
    for (const tab of opts.tabs) {
      const on = tab.id === id;
      const btn = buttons.find((b) => b.dataset.id === tab.id);
      const panel = panels[opts.tabs.indexOf(tab)];
      if (btn) {
        btn.setAttribute("aria-selected", on ? "true" : "false");
      }
      if (panel) panel.hidden = !on;
    }
  }

  for (const tab of opts.tabs) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ws-tab";
    btn.setAttribute("role", "tab");
    btn.dataset.id = tab.id;
    btn.textContent = tab.label;
    btn.addEventListener("click", () => activate(tab.id));
    buttons.push(btn);
    list.append(btn);
    const panel = document.createElement("div");
    panel.setAttribute("role", "tabpanel");
    panel.append(tab.panel);
    panels.push(panel);
  }
  root.append(list, ...panels);
  if (initial) activate(initial);
  return root;
}
```

`packages/kit/src/page.ts`:

```ts
export type PageOpts = { title: string; body: HTMLElement };

export function page(opts: PageOpts): HTMLElement {
  const el = document.createElement("div");
  el.className = "ws-page";
  const title = document.createElement("h1");
  title.className = "ws-page-title";
  title.textContent = opts.title;
  el.append(title, opts.body);
  return el;
}
```

`packages/kit/src/dialog.ts`:

```ts
export type DialogOpts = { title: string; body: HTMLElement; actions?: HTMLElement };

export function dialogFrame(opts: DialogOpts): HTMLElement {
  const el = document.createElement("div");
  el.className = "ws-dialog";
  const title = document.createElement("h2");
  title.className = "ws-dialog-title";
  title.textContent = opts.title;
  el.append(title, opts.body);
  if (opts.actions) el.append(opts.actions);
  return el;
}
```

Replace `packages/kit/src/index.ts` with:

```ts
export { button } from "./button";
export type { ButtonKind, ButtonOpts } from "./button";
export { field } from "./field";
export type { FieldOpts } from "./field";
export { tree } from "./tree";
export type { TreeNode, TreeOpts } from "./tree";
export { listView } from "./list";
export type { ListItem, ListOpts } from "./list";
export { iconView } from "./icons";
export type { IconItem, IconOpts } from "./icons";
export { tabs } from "./tabs";
export type { Tab, TabsOpts } from "./tabs";
export { page } from "./page";
export type { PageOpts } from "./page";
export { dialogFrame } from "./dialog";
export type { DialogOpts } from "./dialog";
```

- [ ] **Step 4: Run kit tests**

Run: `npx vitest run packages/kit`

Expected: PASS (all kit tests, including CSS).

- [ ] **Step 5: Commit**

```bash
git add packages/kit/src
git commit -m "$(cat <<'EOF'
feat: add kit tabs, page, and dialog frame

EOF
)"
```

---

### Task 5: `@workshell/navigator` history and registry

**Files:**
- Create: `packages/navigator/package.json`
- Create: `packages/navigator/tsconfig.json`
- Create: `packages/navigator/src/history.test.ts`
- Create: `packages/navigator/src/history.ts`
- Create: `packages/navigator/src/registry.test.ts`
- Create: `packages/navigator/src/registry.ts`

- [ ] **Step 1: Write the failing tests**

`packages/navigator/src/history.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { UrlHistory } from "./history";

describe("UrlHistory", () => {
  it("pushes, backs, forwards, and truncates", () => {
    const h = new UrlHistory("probe:/");
    expect(h.current).toBe("probe:/");
    h.push("probe:/fields");
    expect(h.current).toBe("probe:/fields");
    expect(h.back()).toBe("probe:/");
    expect(h.back()).toBeNull();
    expect(h.forward()).toBe("probe:/fields");
    expect(h.forward()).toBeNull();
    h.back();
    h.push("probe:/tabs");
    expect(h.forward()).toBeNull();
    expect(h.current).toBe("probe:/tabs");
  });
});
```

`packages/navigator/src/registry.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { matchRule, normalizeRegistration } from "./registry";

const views = {
  tree: () => document.createElement("div"),
  icons: () => document.createElement("div"),
  fields: () => document.createElement("div"),
};

describe("normalizeRegistration", () => {
  it("throws on empty scheme, duplicate is the caller's job, unknown view at register", () => {
    expect(() =>
      normalizeRegistration({ scheme: "", views, rules: [] }),
    ).toThrow(/scheme/);
    expect(() =>
      normalizeRegistration({
        scheme: "probe",
        views,
        rules: [{ path: "/", docks: { leading: "nope" } }],
      }),
    ).toThrow(/unknown view/);
  });

  it("sorts rules longest path first", () => {
    const app = normalizeRegistration({
      scheme: "probe",
      views,
      rules: [
        { path: "/", docks: { leading: "tree" } },
        { path: "/fields", docks: { trailing: "fields" } },
      ],
    });
    expect(app.rules.map((r) => r.path)).toEqual(["/fields", "/"]);
  });
});

describe("matchRule", () => {
  const rules = normalizeRegistration({
    scheme: "probe",
    views,
    rules: [
      { path: "/", docks: { leading: "tree", center: "icons" } },
      { path: "/fields", docks: { leading: "tree", trailing: "fields" } },
    ],
  }).rules;

  it("uses longest path and does not steal prefixes", () => {
    expect(matchRule(rules, "/fields")?.path).toBe("/fields");
    expect(matchRule(rules, "/fieldsx")?.path).toBe("/");
    expect(matchRule(rules, "/")?.path).toBe("/");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run packages/navigator/src/history.test.ts packages/navigator/src/registry.test.ts`

Expected: FAIL (package / modules missing).

- [ ] **Step 3: Scaffold navigator and implement history + registry**

`packages/navigator/package.json`:

```json
{
  "name": "@workshell/navigator",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./navigator.css": "./src/navigator.css"
  },
  "dependencies": {
    "@workshell/kit": "*"
  }
}
```

`packages/navigator/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "noEmit": true },
  "include": ["src"]
}
```

`packages/navigator/src/history.ts`:

```ts
export class UrlHistory {
  entries: string[];
  index: number;

  constructor(initial: string) {
    this.entries = [initial];
    this.index = 0;
  }

  get current(): string {
    return this.entries[this.index]!;
  }

  push(href: string): void {
    this.entries = this.entries.slice(0, this.index + 1);
    this.entries.push(href);
    this.index = this.entries.length - 1;
  }

  back(): string | null {
    if (this.index <= 0) return null;
    this.index -= 1;
    return this.current;
  }

  forward(): string | null {
    if (this.index >= this.entries.length - 1) return null;
    this.index += 1;
    return this.current;
  }
}
```

`packages/navigator/src/registry.ts`:

```ts
export type DockId = "leading" | "center" | "trailing";

export type ViewContext = {
  url: URL;
  go: (href: string) => void;
};

export type ViewFactory = (ctx: ViewContext) => HTMLElement;

export type ViewRule = {
  path: string;
  docks: Partial<Record<DockId, string>>;
};

export type AppRegistration = {
  scheme: string;
  views: Record<string, ViewFactory>;
  rules: ViewRule[];
};

export type NormalizedApp = {
  scheme: string;
  views: Record<string, ViewFactory>;
  rules: ViewRule[];
};

export function normalizeRegistration(app: AppRegistration): NormalizedApp {
  if (!app.scheme) throw new Error("scheme required");
  for (const rule of app.rules) {
    for (const name of Object.values(rule.docks)) {
      if (!app.views[name]) throw new Error(`unknown view: ${name}`);
    }
  }
  const rules = [...app.rules].sort((a, b) => b.path.length - a.path.length);
  return { scheme: app.scheme, views: app.views, rules };
}

export function matchRule(rules: ViewRule[], pathname: string): ViewRule | undefined {
  return rules.find((r) => {
    if (r.path === "/") return pathname.startsWith("/");
    return pathname === r.path || pathname.startsWith(`${r.path}/`);
  });
}

export function parseHref(href: string): URL | null {
  try {
    return new URL(href);
  } catch {
    return null;
  }
}

export function canonical(url: URL): string {
  return `${url.protocol}${url.pathname}`;
}

export function schemeOf(url: URL): string {
  return url.protocol.replace(/:$/, "");
}
```

Then: `npm install`

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run packages/navigator/src/history.test.ts packages/navigator/src/registry.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/navigator package-lock.json
git commit -m "$(cat <<'EOF'
feat: add navigator history and view-rule registry

EOF
)"
```

---

### Task 6: `Navigator` chrome, apply, CSS pigment

**Files:**
- Create: `packages/navigator/src/navigator.css`
- Create: `packages/navigator/src/navigator.css.test.ts`
- Create: `packages/navigator/src/navigator.test.ts`
- Create: `packages/navigator/src/navigator.ts`
- Create: `packages/navigator/src/index.ts`

- [ ] **Step 1: Write the failing tests**

`packages/navigator/src/navigator.css.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "navigator.css"), "utf8");

describe("navigator.css pigment", () => {
  it("uses tokens only and no glass effect", () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/rgba?\(/);
    expect(css).not.toMatch(/hsla?\(/);
    expect(css).not.toMatch(/--glass/);
    expect(css).not.toMatch(/--left-w/);
    expect(css).toContain("220px");
    expect(css).toContain("280px");
  });
});
```

`packages/navigator/src/navigator.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { Navigator } from "./navigator";
import type { AppRegistration } from "./registry";

function fixture(): AppRegistration {
  const box = (name: string) => () => {
    const el = document.createElement("div");
    el.dataset.view = name;
    return el;
  };
  return {
    scheme: "probe",
    views: {
      tree: box("tree"),
      icons: box("icons"),
      fields: box("fields"),
    },
    rules: [
      { path: "/", docks: { leading: "tree", center: "icons" } },
      { path: "/fields", docks: { leading: "tree", center: "icons", trailing: "fields" } },
    ],
  };
}

function dock(nav: Navigator, id: string): HTMLElement {
  return nav.root.querySelector(`[data-dock="${id}"]`) as HTMLElement;
}

describe("Navigator", () => {
  it("builds chrome and applies on register", () => {
    const host = document.createElement("div");
    const nav = new Navigator(host, { initialUrl: "probe:/" });
    expect(nav.root.classList.contains("nav")).toBe(true);
    expect(nav.root.querySelectorAll("[data-dock]")).toHaveLength(3);
    expect(dock(nav, "trailing").childElementCount).toBe(0);
    nav.register(fixture());
    expect(dock(nav, "leading").querySelector('[data-view="tree"]')).toBeTruthy();
    expect(dock(nav, "center").querySelector('[data-view="icons"]')).toBeTruthy();
    expect(dock(nav, "trailing").childElementCount).toBe(0);
    const back = nav.root.querySelector('[data-nav="back"]') as HTMLButtonElement;
    const fwd = nav.root.querySelector('[data-nav="forward"]') as HTMLButtonElement;
    expect(back.disabled).toBe(true);
    expect(fwd.disabled).toBe(true);
  });

  it("goes, backs, and does not match stolen prefixes", () => {
    const host = document.createElement("div");
    const nav = new Navigator(host, { initialUrl: "probe:/" });
    nav.register(fixture());
    nav.go("probe:/fields");
    expect(nav.url.pathname).toBe("/fields");
    expect(dock(nav, "trailing").querySelector('[data-view="fields"]')).toBeTruthy();
    const input = nav.root.querySelector(".nav-chrome input") as HTMLInputElement;
    expect(input.value).toBe("probe:/fields");
    nav.go("probe:/fieldsx");
    expect(dock(nav, "trailing").childElementCount).toBe(0);
    nav.back();
    expect(nav.url.pathname).toBe("/fields");
    nav.back();
    expect(nav.url.pathname).toBe("/");
    const back = nav.root.querySelector('[data-nav="back"]') as HTMLButtonElement;
    expect(back.disabled).toBe(true);
  });

  it("no-ops unknown scheme and invalid href; throws on duplicate scheme", () => {
    const host = document.createElement("div");
    const nav = new Navigator(host, { initialUrl: "probe:/" });
    nav.register(fixture());
    nav.go("other:/x");
    expect(nav.url.pathname).toBe("/");
    nav.go(":::");
    expect(nav.url.pathname).toBe("/");
    expect(() => nav.register(fixture())).toThrow(/already registered/);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run packages/navigator/src/navigator.test.ts packages/navigator/src/navigator.css.test.ts`

Expected: FAIL (modules / CSS missing).

- [ ] **Step 3: Implement Navigator, CSS, and index**

`packages/navigator/src/navigator.css`:

```css
.nav {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: var(--color-base-200);
  color: var(--color-base-content);
  font-family: var(--font-sans);
  --nav-leading-w: 220px;
  --nav-trailing-w: 280px;
}

.nav-chrome {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 8px;
  flex: 0 0 auto;
}

.nav-chrome .ws-field {
  flex: 1 1 auto;
}

.nav-docks {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
}

.nav-dock {
  min-width: 0;
  min-height: 0;
  overflow: auto;
}

.nav-dock[data-dock="leading"] {
  flex: 0 0 var(--nav-leading-w);
}

.nav-dock[data-dock="center"] {
  flex: 1 1 auto;
}

.nav-dock[data-dock="trailing"] {
  flex: 0 0 var(--nav-trailing-w);
}
```

`packages/navigator/src/navigator.ts`:

```ts
import { button } from "@workshell/kit";
import { field } from "@workshell/kit";
import { UrlHistory } from "./history";
import {
  type AppRegistration,
  type DockId,
  type NormalizedApp,
  canonical,
  matchRule,
  normalizeRegistration,
  parseHref,
  schemeOf,
} from "./registry";

const DOCKS: DockId[] = ["leading", "center", "trailing"];

export class Navigator {
  readonly root: HTMLElement;
  private readonly history: UrlHistory;
  private readonly apps = new Map<string, NormalizedApp>();
  private readonly backBtn: HTMLButtonElement;
  private readonly fwdBtn: HTMLButtonElement;
  private readonly addressInput: HTMLInputElement;

  constructor(host: HTMLElement, opts: { initialUrl: string }) {
    const parsed = parseHref(opts.initialUrl);
    if (!parsed) throw new Error("initialUrl");
    const initial = canonical(parsed);
    this.history = new UrlHistory(initial);

    host.replaceChildren();
    this.root = document.createElement("div");
    this.root.className = "nav";
    const chrome = document.createElement("div");
    chrome.className = "nav-chrome";
    this.backBtn = button({ label: "Back", kind: "neutral", onClick: () => this.back() });
    this.backBtn.dataset.nav = "back";
    this.backBtn.setAttribute("aria-label", "Back");
    this.fwdBtn = button({ label: "Forward", kind: "neutral", onClick: () => this.forward() });
    this.fwdBtn.dataset.nav = "forward";
    this.fwdBtn.setAttribute("aria-label", "Forward");
    const address = field({ name: "address", label: "Address", value: initial });
    this.addressInput = address.querySelector("input")!;
    this.addressInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.go(this.addressInput.value);
    });
    chrome.append(this.backBtn, this.fwdBtn, address);
    const docks = document.createElement("div");
    docks.className = "nav-docks";
    for (const id of DOCKS) {
      const col = document.createElement("div");
      col.className = "nav-dock";
      col.dataset.dock = id;
      docks.append(col);
    }
    this.root.append(chrome, docks);
    host.append(this.root);
    this.syncChrome();
  }

  get url(): URL {
    return new URL(this.history.current);
  }

  register(app: AppRegistration): void {
    const norm = normalizeRegistration(app);
    if (this.apps.has(norm.scheme)) throw new Error("already registered");
    this.apps.set(norm.scheme, norm);
    if (schemeOf(this.url) === norm.scheme) this.apply(this.history.current);
  }

  go(href: string): void {
    const parsed = parseHref(href);
    if (!parsed) return;
    const next = canonical(parsed);
    if (!this.apps.has(schemeOf(parsed))) return;
    if (next === this.history.current) return;
    this.history.push(next);
    this.apply(next);
  }

  back(): void {
    const href = this.history.back();
    if (href) this.apply(href);
  }

  forward(): void {
    const href = this.history.forward();
    if (href) this.apply(href);
  }

  private apply(href: string): void {
    const url = new URL(href);
    const app = this.apps.get(schemeOf(url));
    const ctx = { url, go: (h: string) => this.go(h) };
    const rule = app ? matchRule(app.rules, url.pathname) : undefined;
    for (const id of DOCKS) {
      const col = this.root.querySelector(`[data-dock="${id}"]`) as HTMLElement;
      const viewName = rule?.docks[id];
      if (app && viewName) {
        col.replaceChildren(app.views[viewName]!(ctx));
      } else {
        col.replaceChildren();
      }
    }
    this.syncChrome();
  }

  private syncChrome(): void {
    this.addressInput.value = this.history.current;
    this.backBtn.disabled = this.history.index <= 0;
    this.fwdBtn.disabled = this.history.index >= this.history.entries.length - 1;
  }
}
```

`packages/navigator/src/index.ts`:

```ts
export { Navigator } from "./navigator";
export type {
  AppRegistration,
  DockId,
  ViewContext,
  ViewFactory,
  ViewRule,
} from "./registry";
```

- [ ] **Step 4: Run navigator tests**

Run: `npx vitest run packages/navigator`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/navigator/src
git commit -m "$(cat <<'EOF'
feat: add Navigator chrome, docks, and view apply

EOF
)"
```

---

### Task 7: Probe pages (host-agnostic `fieldsPage`)

**Files:**
- Create: `apps/shell-demo/src/probe/pages.ts`
- Create: `apps/shell-demo/src/probe/pages.test.ts`

- [ ] **Step 1: Write the failing test**

`apps/shell-demo/src/probe/pages.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { fieldsPage } from "./pages";

describe("fieldsPage", () => {
  it("mounts the same factory on two hosts", () => {
    const a = document.createElement("div");
    const b = document.createElement("div");
    a.append(fieldsPage());
    b.append(fieldsPage());
    expect(a.querySelector(".ws-page")).toBeTruthy();
    expect(b.querySelector(".ws-page")).toBeTruthy();
    expect(a.querySelectorAll("input")).toHaveLength(3);
    expect(a.querySelector("input:disabled")).toBeTruthy();
    expect(a.querySelector(".ws-btn-primary")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run apps/shell-demo/src/probe/pages.test.ts`

Expected: FAIL (module missing).

- [ ] **Step 3: Implement pages**

`apps/shell-demo/src/probe/pages.ts`:

```ts
import { button, dialogFrame, field, listView, page, tabs } from "@workshell/kit";

export function fieldsPage(): HTMLElement {
  const body = document.createElement("div");
  body.append(
    field({ name: "demo-text", label: "Name", value: "Probe" }),
    field({ name: "demo-check", label: "Enabled", kind: "checkbox", value: true }),
    field({ name: "demo-dead", label: "Read-only", value: "locked", disabled: true }),
    button({ label: "Primary", kind: "primary" }),
  );
  return page({ title: "Fields", body });
}

export function tabsPage(): HTMLElement {
  const one = document.createElement("p");
  one.textContent = "Panel one";
  const two = document.createElement("p");
  two.textContent = "Panel two";
  const body = tabs({
    tabs: [
      { id: "one", label: "One", panel: one },
      { id: "two", label: "Two", panel: two },
    ],
    activeId: "one",
  });
  return page({ title: "Tabs", body });
}

export function listPage(): HTMLElement {
  const body = listView({
    items: [
      { id: "r1", label: "Row one" },
      { id: "r2", label: "Row two" },
      { id: "r3", label: "Row three" },
      { id: "r4", label: "Row four" },
    ],
  });
  return page({ title: "List", body });
}

export function dialogPage(): HTMLElement {
  const body = document.createElement("p");
  body.textContent = "A dialog frame, not an overlay.";
  const actions = document.createElement("div");
  actions.append(
    button({ label: "Cancel", kind: "neutral" }),
    button({ label: "Confirm", kind: "primary" }),
  );
  return page({
    title: "Dialog",
    body: dialogFrame({ title: "Example", body, actions }),
  });
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run apps/shell-demo/src/probe/pages.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/shell-demo/src/probe
git commit -m "$(cat <<'EOF'
feat: add probe kit pages with host-agnostic fieldsPage

EOF
)"
```

---

### Task 8: Probe app, seed, and demo wire

**Files:**
- Create: `apps/shell-demo/src/probe/graph.ts`
- Create: `apps/shell-demo/src/probe/app.ts`
- Create: `apps/shell-demo/src/probe/mount.ts`
- Create: `apps/shell-demo/src/probe/mount.test.ts`
- Modify: `apps/shell-demo/src/seed.ts`
- Modify: `apps/shell-demo/src/seed.test.ts`
- Modify: `apps/shell-demo/src/main.ts`
- Modify: `apps/shell-demo/package.json`

- [ ] **Step 1: Write the failing tests**

Replace `apps/shell-demo/src/seed.test.ts` with:

```ts
import { describe, expect, it } from "vitest";
import { CASCADE_PX, DEFAULT_FLOAT } from "@workshell/desktop-shell";
import { KNOWN_IDS, STORAGE_KEY, seedLayout } from "./seed";

describe("seedLayout", () => {
  it("seeds task-104 and probe floating with empty slots", () => {
    const s = seedLayout();
    expect(s.version).toBe(2);
    expect(STORAGE_KEY).toBe("workshell.layout.v1");
    expect([...KNOWN_IDS]).toEqual(["task-104", "probe"]);
    expect(s.slots.left).toEqual({ width: 320, order: [], activeId: null });
    expect(s.slots.center).toEqual({ width: 0, order: [], activeId: null });
    expect(s.slots.right).toEqual({ width: 360, order: [], activeId: null });
    expect(s.overlay).toBeNull();
    expect(s.closed).toEqual([]);
    expect(s.panels["task-104"]).toMatchObject({
      id: "task-104",
      title: "TASK-104",
      mode: "float",
      x: DEFAULT_FLOAT.x,
      y: DEFAULT_FLOAT.y,
      w: DEFAULT_FLOAT.w,
      h: DEFAULT_FLOAT.h,
      z: 2,
    });
    expect(s.panels.probe).toMatchObject({
      id: "probe",
      title: "Probe",
      mode: "float",
      x: DEFAULT_FLOAT.x + CASCADE_PX,
      y: DEFAULT_FLOAT.y + CASCADE_PX,
      w: DEFAULT_FLOAT.w,
      h: DEFAULT_FLOAT.h,
      z: 3,
    });
    expect(s.nextZ).toBe(4);
    expect(s.panels["task-104"].restore).toBeUndefined();
    expect(s.panels.backlog).toBeUndefined();
  });
});
```

`apps/shell-demo/src/probe/mount.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { mountProbe } from "./mount";

describe("mountProbe", () => {
  it("fills three docks and opens Fields in trailing", () => {
    const host = document.createElement("div");
    mountProbe(host);
    expect(host.querySelector(".nav")).toBeTruthy();
    expect(host.querySelectorAll("[data-dock]")).toHaveLength(3);
    expect(host.querySelector('[role="tree"]')).toBeTruthy();
    expect(host.querySelector('[data-dock="trailing"]')?.childElementCount).toBe(0);
    host
      .querySelector('[data-id="/fields"]')!
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(host.querySelector('[data-dock="trailing"] .ws-page-title')?.textContent).toBe("Fields");
    const input = host.querySelector(".nav-chrome input") as HTMLInputElement;
    expect(input.value).toBe("probe:/fields");
  });
});
```

Confirm `CASCADE_PX` is re-exported from `@workshell/desktop-shell` (it is, via `packages/desktop-shell/src/index.ts`). If a test fails on the import, export is already there — do not add a second export.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run apps/shell-demo/src/seed.test.ts apps/shell-demo/src/probe/mount.test.ts`

Expected: FAIL (KNOWN_IDS still `task-104` only; `mountProbe` missing).

- [ ] **Step 3: Implement probe + seed + main**

`apps/shell-demo/src/probe/graph.ts`:

```ts
import type { TreeNode } from "@workshell/kit";

export const probeTree: TreeNode[] = [
  {
    id: "/",
    label: "Probe",
    children: [
      { id: "/fields", label: "Fields" },
      { id: "/tabs", label: "Tabs" },
      { id: "/list", label: "List" },
      { id: "/dialog", label: "Dialog" },
    ],
  },
];

export const probeIcons = [
  { id: "/fields", label: "Fields", group: "Kit" },
  { id: "/tabs", label: "Tabs", group: "Kit" },
  { id: "/list", label: "List", group: "Kit" },
  { id: "/dialog", label: "Dialog", group: "Kit" },
];
```

`apps/shell-demo/src/probe/app.ts`:

```ts
import { iconView, tree } from "@workshell/kit";
import type { AppRegistration, ViewContext } from "@workshell/navigator";
import { probeIcons, probeTree } from "./graph";
import { dialogPage, fieldsPage, listPage, tabsPage } from "./pages";

function probeTreeView(ctx: ViewContext): HTMLElement {
  return tree({
    nodes: probeTree,
    selectedId: ctx.url.pathname,
    onSelect: (id) => ctx.go(`probe:${id}`),
  });
}

function probeIconView(ctx: ViewContext): HTMLElement {
  return iconView({
    items: probeIcons,
    onSelect: (id) => ctx.go(`probe:${id}`),
  });
}

export const probeApp: AppRegistration = {
  scheme: "probe",
  views: {
    "probe-tree": probeTreeView,
    "probe-icons": probeIconView,
    "probe-fields": () => fieldsPage(),
    "probe-tabs": () => tabsPage(),
    "probe-list": () => listPage(),
    "probe-dialog": () => dialogPage(),
  },
  rules: [
    { path: "/fields", docks: { leading: "probe-tree", center: "probe-icons", trailing: "probe-fields" } },
    { path: "/tabs", docks: { leading: "probe-tree", center: "probe-icons", trailing: "probe-tabs" } },
    { path: "/list", docks: { leading: "probe-tree", center: "probe-icons", trailing: "probe-list" } },
    { path: "/dialog", docks: { leading: "probe-tree", center: "probe-icons", trailing: "probe-dialog" } },
    { path: "/", docks: { leading: "probe-tree", center: "probe-icons" } },
  ],
};
```

`apps/shell-demo/src/probe/mount.ts`:

```ts
import { Navigator } from "@workshell/navigator";
import { probeApp } from "./app";

export function mountProbe(host: HTMLElement): Navigator {
  const nav = new Navigator(host, { initialUrl: "probe:/" });
  nav.register(probeApp);
  return nav;
}
```

Replace `apps/shell-demo/src/seed.ts` with:

```ts
import {
  CASCADE_PX,
  DEFAULT_FLOAT,
  DEFAULT_LEFT_W,
  DEFAULT_RIGHT_W,
  type LayoutState,
} from "@workshell/desktop-shell";

export { STORAGE_KEY } from "@workshell/desktop-shell";

export const KNOWN_IDS = ["task-104", "probe"] as const;
export type KnownId = (typeof KNOWN_IDS)[number];

export const PANEL_META: Record<KnownId, { title: string }> = {
  "task-104": { title: "TASK-104" },
  probe: { title: "Probe" },
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
      probe: {
        id: "probe",
        uid: "",
        title: PANEL_META.probe.title,
        mode: "float",
        x: float.x + CASCADE_PX,
        y: float.y + CASCADE_PX,
        w: float.w,
        h: float.h,
        z: 3,
      },
    },
    overlay: null,
    closed: [],
    nextZ: 4,
  };
}
```

In `apps/shell-demo/package.json` add to `dependencies`:

```json
    "@workshell/kit": "*",
    "@workshell/navigator": "*"
```

Keep existing compositor, desktop-shell, and theme deps.

Replace `apps/shell-demo/src/main.ts` with:

```ts
import { createDesktop } from "@workshell/desktop-shell";
import "@workshell/compositor/compositor.css";
import "@workshell/desktop-shell/shell.css";
import "@workshell/theme-aetheris-glass/tokens.css";
import "@workshell/theme-aetheris-prism/tokens.css";
import "@workshell/kit/kit.css";
import "@workshell/navigator/navigator.css";
import "./demo.css";
import { seedLayout } from "./seed";
import { mountKanban } from "./widgets/kanban";
import { mountThemeSwitch } from "./widgets/theme-switch";
import { fillWindow } from "./windows/task-window";
import { mountProbe } from "./probe/mount";

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
    if (id === "probe") {
      mountProbe(el);
      return;
    }
    fillWindow(id, el);
  },
});

const taskbar = host.workspace.querySelector("#taskbar");
if (!(taskbar instanceof HTMLElement)) throw new Error("#taskbar missing");
mountThemeSwitch(taskbar, (name) => host.setTheme(name));

Object.assign(window, { workshell: engine });
```

Do **not** create `apps/shell-demo/src/probe/probe.css`. Do **not** add `.ws-*` or `.nav-*` rules to `demo.css`.

Then: `npm install`

- [ ] **Step 4: Run demo + workspace tests**

Run: `npx vitest run apps/shell-demo packages/kit packages/navigator packages/themes/contract.test.ts`

Expected: PASS. Theme `CONTRACT_VARS` unchanged. Desktop-shell host tests still seed only `task-104` (their own fixture) and stay green.

Then: `npm test`

Expected: PASS (full suite).

Then: `npx tsc --noEmit`

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add apps/shell-demo packages/kit packages/navigator package-lock.json
git commit -m "$(cat <<'EOF'
feat: seed Probe window and register probe: guest

EOF
)"
```

---

### Task 9: README and spec status

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-09-09-workshell-surface-contract-design.md`

- [ ] **Step 1: Update README acceptance**

In `README.md`, change the packages sentence to:

```
Packages: `@workshell/compositor`, `@workshell/desktop-shell`, `@workshell/kit`, `@workshell/navigator`, `@workshell/theme-aetheris-glass`, `@workshell/theme-aetheris-prism`. App: `@workshell/shell-demo`.
```

Change acceptance item 1 to mention both windows:

```
1. Desktop shows wallpaper, four kanban lanes, taskbar, **TASK-104**, and a **Probe** window (navigator: tree + icon tiles, empty trailing). The board stays visible around the windows.
```

Insert after 1c:

```
1d. In Probe, click **Fields** (tree or icon): trailing shows the Fields page; address reads `probe:/fields`. Back returns to empty trailing. Taskbar **Prism** restyles Probe kit chrome as well as TASK-104; **Glass** reverses. Reload returns to Glass.
```

Leave items 2–7 as they are (they apply to any panel, including Probe).

Change the seed sentence to:

```
Seed: kanban widget (not a panel) + floating TASK-104 + floating Probe, filled by the demo through `boot({ fillWidgetLayer, fillPanelBody })`. Overlay and dock APIs exist but are not in the titlebar.
```

- [ ] **Step 2: Mark the spec approved**

In `docs/superpowers/specs/2026-09-09-workshell-surface-contract-design.md`, change Status to:

```
Status: Approved in conversation (José: probe prefix; frozen tokens; self-style kit; write the plan)
```

- [ ] **Step 3: Full verification**

Run: `npm test && npx tsc --noEmit`

Expected: PASS / exit 0.

Manual (worktree `npm run dev`, clear `localStorage["workshell.layout.v1"]`): acceptance 1–1d. Do not kill a Vite process you did not start.

- [ ] **Step 4: Commit**

```bash
git add README.md docs/superpowers/specs/2026-09-09-workshell-surface-contract-design.md
git commit -m "$(cat <<'EOF'
docs: Probe window in acceptance and approve surface contract

EOF
)"
```

---

## Spec coverage (self-check)

| Spec requirement | Task |
|---|---|
| `@workshell/kit` package, no Tailwind, no OS deps | 1 |
| kit.css token-only, no `--glass*` | 1 |
| `button` / `field` | 2 |
| `tree` / `listView` / `iconView` | 3 |
| `tabs` / `page` / `dialogFrame` | 4 |
| `UrlHistory` | 5 |
| register validate/sort/match; `/fields` vs `/fieldsx` | 5 |
| Navigator DOM, docks ≠ compositor slots | 6 |
| `go` / `back` / `forward`; unknown scheme; invalid href; duplicate scheme | 6 |
| navigator.css no `--glass*` | 6 |
| `fieldsPage` two hosts | 7 |
| `probe:` graph, views, rules | 8 |
| seed `probe` offset by `CASCADE_PX` | 8 |
| `fillPanelBody("probe")`; CSS import order | 8 |
| no `probe.css`; demo.css leaves `.ws-*` alone | 8 |
| theme contract list unchanged | 8 (`contract.test.ts`) |
| README + spec status | 9 |
| desktop-shell / compositor untouched | all |
| Settings / overlay / tear-out / token growth | out of plan |
