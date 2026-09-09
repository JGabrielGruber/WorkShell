# Workshell

Compositor-first vanilla TypeScript desktop. Not a SPA. Not a WebGPU renderer. Interactive session first, not a demo.

Packages: `@workshell/compositor`, `@workshell/session`, `@workshell/desktop`, `@workshell/kit`, `@workshell/navigator`, `@workshell/theme-aetheris-glass`, `@workshell/theme-aetheris-prism`. App: `@workshell/session-app`.

## Run

```bash
npm install
npm run dev
```

Opens an empty desktop (wallpaper, taskbar, Menu, no windows). Layout key: `localStorage["workshell.layout.v1"]` (`version: 2`). Prefs key `workshell.prefs.v1` appears only after `session.setTheme`. Clear both keys to restore empty seed + glass.

## Test

```bash
npm test
```

## Acceptance

1. `npm run dev` serves the empty OS session: wallpaper, taskbar, Menu, no windows.
2. Reload: still empty, still Glass. Prefs key `workshell.prefs.v1` is **absent** until `session.setTheme`.
3. Console `session.setTheme(workspace, "aetheris-prism")` restyles; reload stays Prism. Layout key `workshell.layout.v1` stays geometry-only.
4. Leftover demo layout ids (`probe`, `task-104`) do not reappear as windows.
5. Menu is empty (no Settings/Probe/kanban). No Glass/Prism buttons on the bar.
6. Clear both `workshell.layout.v1` and `workshell.prefs.v1` to restore empty seed + glass.
