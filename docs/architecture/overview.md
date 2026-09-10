# Workshell Architecture Overview

Workshell is a compositor-first vanilla TypeScript desktop OS layer. It is not an SPA, not a WebGPU canvas renderer, and not a demo. It provides an interactive multi-window session environment.

Aim (living vision, not this file): [`docs/vision/os.md`](../vision/os.md). This document is **law** — layers, import graph, concepts as they stand.

## 1. System Layers

```
+-------------------------------------------------------------+
| Guest Applications (@workshell/settings, product apps)      |
+-------------------------------------------------------------+
| Navigator (@workshell/navigator: chrome, docks, history)    |
+-------------------------------------------------------------+
| Form Kit (@workshell/kit: tree, list, tabs, dialog, fields) |
+-------------------------------------------------------------+
| Desktop Shell (@workshell/desktop: taskbar, menu, clock)   |
+-------------------------------------------------------------+
| Session Engine (@workshell/session: registry, prefs hive)   |
+-------------------------------------------------------------+
| Theme Engine (@workshell/theme: uxtheme, catalog, base)     |
+-------------------------------------------------------------+
| Compositor Kernel (@workshell/compositor: windows, mount)   |
+-------------------------------------------------------------+
```

## 2. Package Boundaries & Import Rules

To prevent coupling and architectural erosion, package imports are strictly unidirectional:

| Package | Role | Allowed Dependencies | Prohibited Dependencies |
|---|---|---|---|
| `@workshell/compositor` | Window manager, spatial desktops, z-order, reparenting (`mount`) | `@workshell/theme` (for tokens) | Desktop, Kit, Navigator, Session, Settings |
| `@workshell/theme` | Engine, catalog, `apply()`, builtin `base` tokens | None (self-contained) | Any UI package |
| `@workshell/session` | Application registry, layout/prefs storage | Compositor, Theme | Desktop, Kit, Navigator, Settings |
| `@workshell/desktop` | Wallpaper, taskbar, menu, panel chrome | Compositor, Session, Theme | Kit, Navigator, Settings |
| `@workshell/kit` | System form controls (tree, list, button, tabs) | Theme | Compositor, Desktop, Navigator, Settings |
| `@workshell/navigator` | Address bar, history, 3-dock layout | Kit, Theme | Compositor, Desktop, Session, Settings |
| `@workshell/settings` | First guest application (Appearance CPL) | Kit, Navigator, Session | Compositor, Desktop, Theme directly |
| `apps/session` | Top-level host entrypoint | Session, Desktop, Settings | Ad-hoc CSS, raw tokens |

## 3. Core Architectural Concepts

### Reparenting without Destruction (`mount`)
Windows in the compositor are reparentable DOM nodes. When a window is minimized, restored, maximized, or moved between docks and spatial desktops, the host node is moved using DOM reparenting (`mount()`). The interior application node is **never destroyed or recreated**.

### Surfaces, Not Inner Pages
A view is a **surface** that a dock, the compositor, or an overlay can hold. A view does not know whether it sits in a dock column, a narrow-mode drawer, or a floating desktop panel.

### Closed Theme Token System
Theme variables follow modern semantic token conventions (`--color-base-100`, `--color-base-content`, `--shadow`, `--radius-box`). Packages declare structure and reference `var(--token)`. No package hardcodes hex colors or creates private visual tokens.
