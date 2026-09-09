# Workshell Project Status & Document Map

Date: 2026-09-09
Project: Workshell (OS Layer Prototype)

This file tracks the status of all specs and plans in `docs/superpowers/`.

---

## 1. System Vision (North Star)

| Document | Date | Type | Description |
|---|---|---|---|
| [`2026-09-08-workshell-os-vision.md`](file:///home/jgabrielgruber/Projects/Tests/workshell/docs/superpowers/specs/2026-09-08-workshell-os-vision.md) | 2026-09-08 | Vision / Roadmap | Layers, naming rules, dogfood order (0: Compositor/Shell -> 1: Kit/Navigator -> 2: Settings -> 3: Registry -> 4: Product App). |

---

## 2. Active Implementation

| Spec | Plan | Status | Scope |
|---|---|---|---|
| [`2026-09-09-workshell-settings-design.md`](file:///home/jgabrielgruber/Projects/Tests/workshell/docs/superpowers/specs/2026-09-09-workshell-settings-design.md) | [`2026-09-09-workshell-settings.md`](file:///home/jgabrielgruber/Projects/Tests/workshell/docs/superpowers/plans/2026-09-09-workshell-settings.md) | **In Progress / Current** | `@workshell/theme` engine + builtin `base` (Win32 Classic), session hive persist, chrome/kit restyle, Settings guest with Appearance catalog. |
| [`2026-09-09-workshell-navigator-dynamic-docks-design.md`](file:///home/jgabrielgruber/Projects/Tests/workshell/docs/superpowers/specs/2026-09-09-workshell-navigator-dynamic-docks-design.md) | [`2026-09-09-workshell-navigator-dynamic-docks.md`](file:///home/jgabrielgruber/Projects/Tests/workshell/docs/superpowers/plans/2026-09-09-workshell-navigator-dynamic-docks.md) | **Complete / Shipped** | `@workshell/navigator`: auto-collapsing empty docks, container query narrow drawer/detail mode, surface keep-alive/reparenting. |

---

## 3. Historical / Base Specs & Plans

All earlier specs remain architectural law unless explicitly amended by later specs:

| Date | Spec | Plan | What it established |
|---|---|---|---|
| 2026-09-07 | [`2026-09-07-workshell-window-manager-design.md`](file:///home/jgabrielgruber/Projects/Tests/workshell/docs/superpowers/specs/2026-09-07-workshell-window-manager-design.md) | [`2026-09-07-workshell-window-manager.md`](file:///home/jgabrielgruber/Projects/Tests/workshell/docs/superpowers/plans/2026-09-07-workshell-window-manager.md) | `@workshell/compositor`: 180Hz pointer path, spatial desktops, z-order, `mount()` reparenting, layout persist `workshell.layout.v1`. |
| 2026-09-07 | [`2026-09-07-workshell-desktop-shell-design.md`](file:///home/jgabrielgruber/Projects/Tests/workshell/docs/superpowers/specs/2026-09-07-workshell-desktop-shell-design.md) | [`2026-09-07-workshell-desktop-shell.md`](file:///home/jgabrielgruber/Projects/Tests/workshell/docs/superpowers/plans/2026-09-07-workshell-desktop-shell.md) | `@workshell/desktop`: layer tree, taskbar island, panel chrome, menu, clock. |
| 2026-09-07 | [`2026-09-07-workshell-package-carve-design.md`](file:///home/jgabrielgruber/Projects/Tests/workshell/docs/superpowers/specs/2026-09-07-workshell-package-carve-design.md) | [`2026-09-07-workshell-package-carve.md`](file:///home/jgabrielgruber/Projects/Tests/workshell/docs/superpowers/plans/2026-09-07-workshell-package-carve.md) | Monorepo package boundaries: compositor, desktop, kit, themes, apps. |
| 2026-09-08 | [`2026-09-08-workshell-card-open-windows-design.md`](file:///home/jgabrielgruber/Projects/Tests/workshell/docs/superpowers/specs/2026-09-08-workshell-card-open-windows-design.md) | [`2026-09-08-workshell-card-open-windows.md`](file:///home/jgabrielgruber/Projects/Tests/workshell/docs/superpowers/plans/2026-09-08-workshell-card-open-windows.md) | `open(id, { title })` door; board widget integration. |
| 2026-09-08 | [`2026-09-08-workshell-theme-contract-design.md`](file:///home/jgabrielgruber/Projects/Tests/workshell/docs/superpowers/specs/2026-09-08-workshell-theme-contract-design.md) | [`2026-09-08-workshell-theme-contract.md`](file:///home/jgabrielgruber/Projects/Tests/workshell/docs/superpowers/plans/2026-09-08-workshell-theme-contract.md) | Closed token contract, invariant tests, contract harvest protocol. |
| 2026-09-09 | [`2026-09-09-workshell-surface-contract-design.md`](file:///home/jgabrielgruber/Projects/Tests/workshell/docs/superpowers/specs/2026-09-09-workshell-surface-contract-design.md) | [`2026-09-09-workshell-surface-contract.md`](file:///home/jgabrielgruber/Projects/Tests/workshell/docs/superpowers/plans/2026-09-09-workshell-surface-contract.md) | Kit form controls (`@workshell/kit`), navigator chrome (`@workshell/navigator`), `probe:` spine test. |
| 2026-09-09 | [`2026-09-09-workshell-os-session-design.md`](file:///home/jgabrielgruber/Projects/Tests/workshell/docs/superpowers/specs/2026-09-09-workshell-os-session-design.md) | [`2026-09-09-workshell-os-session.md`](file:///home/jgabrielgruber/Projects/Tests/workshell/docs/superpowers/plans/2026-09-09-workshell-os-session.md) | `@workshell/session`: app registration, hive layout/prefs persistence, boot lifecycle. |
