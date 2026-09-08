# Workshell OS vision

Date: 2026-09-08
Status: Vision / roadmap — not an implementation spec
Project: workshell (test prototype)

Depends on (what already exists): compositor in `2026-09-07-workshell-window-manager-design.md`, desktop chrome in `2026-09-07-workshell-desktop-shell-design.md`, package door in `2026-09-07-workshell-package-carve-design.md`, `open()` in `2026-09-08-workshell-card-open-windows-design.md`, theme contract in `2026-09-08-workshell-theme-contract-design.md`.

This document does **not** change persist key `workshell.layout.v1`, layout `version: 2`, the 180 Hz pointer path, `createDesktop` / `boot()` / `open()`, or the closed theme token list. It does not schedule a build. Later work is a **new spec per identifiable need**.

## What this is

Workshell is the **OS layer**: compositor, shell, theme, and the door an application uses to appear. **Desktop presentation** is wallpaper, bar, spatial desktops, many panels. **Narrow presentation** is **only the navigator** filling the viewport — a phone, a kiosk, a popped-out browser tab or window. It is a hosting mode, not a device class. It is not ProjThread. It is not a kanban. It is not “the desktop scaled into a phone.”

ProjThread is the first **product** application that machine should serve — a node graph, not a filesystem, with boards, cards, attachments, and later conversations. Other applications should be able to use the same door. Until the machine can host something that is not a card, it cannot host ProjThread honestly.

This vision is the aim. Implementation stays YAGNI: a place, widget, or API appears when a product need has nowhere to land.

## Naming

Describe the thing. If a common computer-science name already is that description, use it. Coin a name only when the usual word is a vendor product or a lie.

Do not write tribute names into the tree (desktop-environment product jargon, vendor UI products, skin marketing). Conversation may use other systems as references. Specs and code use workshell words, or the generic term people already search for (`tree`, `icon view`, `wizard` when it is literally a wizard).

| Name | Meaning |
|---|---|
| compositor | windows, spatial desktops, `mount()`, optional glass |
| shell | places around applications: panel instance(s), desktop, later an action host |
| slot | a named place a widget may land |
| widget | contributed UI; desktop or bar, distinguished by slot |
| surface | what applications paint (theme tokens) |
| glass | optional compositor (or shell) effect, not a theme name |
| navigator | address, history, view rules, docks |
| narrow presentation | the navigator *is* the chrome (phone, kiosk, popped-out tab or window) |
| page | one form from the system kit (tabs, fields, lists) |
| dock | a slot that holds a view (leading, trailing, later bottom); the view can move between docks |
| drawer | leading dock as an overlay in narrow presentation |
| modal | trailing dock as an overlay; may be full screen |
| detail | trailing dock as a pushed view (master–detail), still the same surface |
| overlay | fourth layer: alert, confirm, snackbar — not a navigator slot |
| Settings | first guest application; pages under the settings namespace |
| panel | a compositor window |
| `mount` | reparent a node onto a host without destroying it |
| floating / overlay / subordinate | window placement |
| follow / pin | how a page binds to selection |
| action | a contributed command on the current node |
| registry | installed applications and widgets declare themselves here |

## Layers

```
compositor     desktop — panels, spatial desktops, z-order, mount, clocks
shell          desktop — wallpaper, slots, panel instance(s), start frame
theme          surfaces + wallpaper; geometry is not a skin
form kit       tree, icon/list view, fields, tabs, dialog, page chrome
navigator      chrome: address, history, docks, view rules
overlay        alert / confirm / snackbar
guest apps     Settings first, product apps later
```

In desktop presentation, compositor and shell are on. In **narrow presentation** they **need not appear**. The navigator is then the shell. That mode is valid on a phone **and** on a desktop (kiosk, a second browser tab, a window that is only this navigator). Views are written so that translation is a change of **host**, not a second application.

The compositor is not an application. Nothing is left to host a window manager that is itself a registry guest.

The shell is not ProjThread. It owns **places**. Applications own **widgets** and **pages** that land in those places.

A **spatial desktop** (numbered switcher on the bar) is a compositor/shell slot: which panels and desktop widgets are on this surface. A **product workspace** (members, projects, board) is an application object. They may be **bound** later. They are not the same word.

## Slots and widgets

The shell publishes a **closed** list of slots. Installed applications **contribute widgets** into them. Uninstall the application, the slot is empty or falls back. Applications do not invent new slots until a spec adds a place because something has nowhere to land.

First slots (already almost real as one-shot fills):

| Slot | Shell owns | A widget might be |
|---|---|---|
| Desktop | layer, z-order, wallpaper | board, later other desktop widgets |
| Bar regions | island geometry; maximized panels do not cover the bar | start, desktop switcher, window list, clock |
| Start columns | open/close, size | pins + search; Settings entries |
| Panel body | chrome, `mount()`, window controls | navigator, a page, later a product view |

**Bar instances** are hosts, not a singleton. One bar is enough until a second bar is a need. Create / delete extra bars is later.

**Actions** (context menu on a node) are a slot we do not have yet. They appear when something must hang a command on a card, a page, or a desktop widget.

Widgets run **in process** with the shell. The 180 Hz pointer path stays on the compositor. A bar or desktop widget is not another document.

## Navigator, pages, form kit

There is no POSIX filesystem in this machine. There is a **graph** and a **URL**. The navigator is addressable interior chrome, not a disk browser.

It is the piece that must be designed so desktop presentation and narrow presentation **share views** without an enormous port. That does **not** mean putting wallpaper, the bar, and many compositor panels on a phone — nor pretending a kiosk is a full desktop. Narrow presentation is **one navigator**, generally able to show **three surfaces at a time** (leading, center, trailing). A **fourth** is the overlay: alert, confirm, snackbar — not a fourth dock.

- Address and history (back, forward, home, reload)
- Breadcrumb from the URL
- **View rules:** URL (and maybe node kind) → which view(s) to mount
- **Docks** that hold surfaces: leading, trailing, later bottom; a view can move between docks or `mount()` into a panel (desktop)
- Actions on the current node, when that slot exists

| Surface | Desktop presentation (inside a panel) | Narrow presentation (the navigator *is* the chrome) |
|---|---|---|
| Leading dock | column | **drawer** |
| Center | main view | main view (the one screen) |
| Trailing dock | column | **modal**, **full-screen modal**, or **detail** (push) |
| Overlay | dialog / snackbar | alert / confirm / snackbar |

The center stays the body. Leading and trailing are the same surfaces in other hosts, not copies. History still applies: closing a modal or a detail is back. Opening the drawer does not have to push a URL; selecting in the tree does.

A view does not know whether it sits in a dock, a drawer, a modal, or a panel. That ignorance is the translation. Dock layout (where a view is attached, moving it between edges) is navigator chrome. Pop-out to a second compositor panel is desktop presentation. Opening the same URL in another tab or window is **narrow presentation** of that navigator — still not a miniature desktop.

Applications **register prefixes and views**. They do not each invent a router.

**Pages** are forms built from a **system kit** (tree, icon/list view, fields, tabs, dialog chrome). Themes skin the kit once. Applications contribute pages; they do not invent a second form language. A page may be shown as:

- docked (leading / center / trailing, later bottom)
- a drawer or a modal / detail in narrow presentation
- a floating panel (`mount()` of the same node) — desktop
- later, a linear wizard (same pages, different chrome)

Chat bubbles are not kit controls. A list of threads may be a list view. That is as far as the OS goes.

## Settings (first guest)

Settings is the first **application**: a window, a start entry, content at a settings URL — not a bar toggle and not the compositor.

It exists to dogfood the machine without a product graph: theme, glass as an optional effect, which widgets are enabled, later bar instances. No conversations. No Postgres.

Aimed interior (a navigator on the settings namespace):

| Slot | Content |
|---|---|
| Leading | tree of settings |
| Center | switchable view of the current node; default **grouped icons** |
| Trailing | the selected section as a **page** (tabs, fields) |

The three docks are not obligatory at every width. In desktop presentation, leading may hide; trailing is empty until something is selected. In narrow presentation there is no squeezed third column: leading is a drawer, trailing is a modal, a full-screen modal, or a detail. Settings in that mode is **the navigator**, not a miniature desktop that contains Settings.

**Discipline:** a page must survive **dock**, **floating panel** (desktop presentation), and **modal / detail** (narrow presentation). If it only works as a right-hand column on a desktop, the page is glued to a layout. Those hosts are not a second Settings.

The taskbar identity of that window (named Settings vs a generic navigator) is **not** locked here. Views are registered either way; URLs are the API.

Inspector vs preview vs “the navigator is the only content app” is **not** locked here. Those names wait until a non-settings object has to open.

## Surfaces, not inner pages

A view is a **surface** a dock, the compositor, or an overlay can hold. Dock, drawer, modal, detail, floating panel, overlay, subordinate — same node, `mount()` (or the navigator’s equivalent reparent) does not destroy it.

A navigator is a **layout of docks**, not a monolith, and not a desktop squeezed into a phone. Tear-out (drag a view out of a dock onto the desktop as a panel; drop it onto a dock) is later and **desktop**. The vision constraint is: do not design a pane that cannot change host without a rewrite.

Narrow presentation is later as a *mode* (phone, kiosk, popped-out tab). The principle is now: pages and views are host-agnostic so that mode is not a rewrite.

**Follow / pin** is a binding, not two window classes. Follow: the page tracks selection. Pin: the page stays on one node. Unpinned is follow; pin freezes it.

Window controls remain minimize, expand/restore, close, plus placement (floating / overlay / subordinate). Current chrome in shell-demo may stay until a chrome spec says otherwise.

## Glass and surface

**Surface** is the theme: tokens applications paint with (`--color-base-100`, `--radius-box`, …). Geometry is not a skin.

**Glass** is an effect the compositor or shell can apply (blur, veil, hologram-like lanes). It is optional, including for cost. Settings is where that switch lives. Applications do not each invent translucency.

## Product applications (later)

ProjThread **mounts** into this machine. It does not become the shell.

It may contribute, when those needs exist:

- a desktop widget (board)
- a bar widget (desktop switcher **bound** to product workspaces, if we bind them)
- start-column widgets (pins, search over the graph)
- views and pages under a product URL prefix (card, attachment, tree)
- later, conversation views — including project-wide channels — as **views of conversation URLs**, not as OS primitives

Identity (who is signed in) may become a shell concern when a second product app needs it. Membership on a board stays the product.

A conversation view may reuse follow/pin, slots, and `mount()`. It must not invent them. Do not grow the demo card window into a chat room in order to discover the OS.

Demo seed content (kanban, TASK-104) stays a stand-in until Settings and the navigator exist. It is not the long-term guest.

## Dogfood order

Grow from identifiable needs. Do not build a desktop-environment catalogue.

```
0  compositor + shell hosts     (largely present)
1  form kit + navigator chrome  (because Settings needs a body)
2  Settings                     first guest; settings URLs; pages dock, float, or modal
3  widget registry              today's fills become contributions
4  product app                  board widget, product URLs, card views
5  others
```

Step 2 is enough to prove an application that is not a card. Step 3 is the door for more than one application. Step 4 is why the OS exists.

## Growth rule

The shell gains a slot, a widget kind, or an API when something real has nowhere to land.

Explicitly **later** (real, not this vision’s build list):

- extra bar instances
- action menus
- search providers in start
- tear-out drag (desktop dock ↔ panel)
- bottom dock
- follow/pin chrome
- overlay kit (alert / confirm / snackbar) as a shared layer
- narrow presentation (navigator as the only chrome: phone, kiosk, popped-out tab or window)
- spatial desktop bound to a product workspace
- conversation application / channels
- iframe or out-of-process widgets
- Angular `apps/spa` (still the planned later fill of the same `boot()` door; see package-carve)

## What “done” looks like for this vision

Not a date. A machine that can:

1. Open Settings as a panel.
2. Navigate a settings tree and icon view to a page.
3. Show that page as a trailing column, a floating panel, or a modal / detail without two implementations.
4. Let a theme restyle those controls because they came from the kit.
5. Register a second application’s widget without editing `desktop-shell` internals.

Until then, `shell-demo` may keep filling hosts directly. Each new spec should make that fill closer to a contribution, or leave it alone.

## Relationship to existing specs

| Spec | Still the law for |
|---|---|
| Window manager | modes, persist, clocks, `mount()`, no pointer-path layout work |
| Desktop shell | layer tree, bar island, chrome, `boot()` |
| Package carve | compositor / desktop-shell / themes / demo; demo owns content |
| Card-open windows | `open(id, { title })`; board is a widget |
| Theme contract | two skins, closed tokens, session-only switcher |

This vision does not supersede those documents. It says what we are aiming the **next** specs at, one need at a time.
