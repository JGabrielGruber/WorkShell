# Workshell

Compositor-first desktop shell (vanilla TypeScript) with an Aetheris theme and a seed demo. Not a full SPA. Not a WebGPU renderer.

Packages: `@workshell/compositor`, `@workshell/desktop-shell`, `@workshell/theme-aetheris`. App: `@workshell/shell-demo`.

## Run

```bash
npm install
npm run dev
```

Opens the shell-demo. Layout key: `localStorage["workshell.layout.v1"]` (`version: 2`). Clear it to restore the seed.

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

Seed: kanban widget (not a panel) + floating TASK-104, both filled by the demo through `boot({ fillWidgetLayer, fillPanelBody })`. Overlay and dock APIs exist but are not in the titlebar.
