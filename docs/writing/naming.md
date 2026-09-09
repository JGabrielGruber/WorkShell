# Naming Discipline & Vocabulary

In Workshell, names describe what things *are*. Do not coin custom jargon when an established computer-science term exists.

---

## 1. Core Principles

1. **Describe the thing:** If a common computer-science or GUI name already exists, use it (`tree`, `list view`, `panel`, `dock`, `dialog`).
2. **No tribute names:** Avoid desktop-environment product jargon (e.g. Windows/macOS/GNOME specific skin terms), vendor branding, or marketing names in the codebase.
3. **Coin only when necessary:** Introduce a new term only when the existing word is inaccurate or a vendor trademark.

---

## 2. Workshell Lexicon

| Term | Meaning |
|---|---|
| **compositor** | Window manager, z-order, spatial desktop switching, `mount()`, placement modes. |
| **shell** | Places around applications: desktop wallpaper, bar island, start frame. |
| **slot** | A named container where a widget can land. |
| **widget** | Contributed UI component landing in a desktop or bar slot. |
| **surface** | What applications paint on (composed of theme tokens). |
| **navigator** | Interior window chrome: address bar, breadcrumb, history stack, docks. |
| **dock** | A named slot inside a navigator holding a view (leading, trailing, bottom). |
| **drawer** | Leading dock presented as an overlay (e.g. in narrow presentation). |
| **detail** | Trailing dock presented as a pushed view. |
| **panel** | A compositor top-level window. |
| **mount** | Reparenting a DOM node from one host container to another without destroying it. |
| **follow / pin** | Page binding to selection: unpinned tracks selection; pinned freezes to current node. |
| **registry** | Central catalog where applications and widgets register themselves (`AppRegistry`). |
| **glass** | An optional compositor/shell visual effect (blur, veil), **not** a theme name. |
