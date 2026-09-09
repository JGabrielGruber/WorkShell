# Workshell

Compositor-first vanilla TypeScript desktop. Not a SPA. Not a WebGPU renderer. Interactive session first, not a demo.

Packages: `@workshell/compositor`, `@workshell/session`, `@workshell/desktop`, `@workshell/kit`, `@workshell/navigator`, `@workshell/theme`, `@workshell/settings`, `@workshell/theme-aetheris-glass`, `@workshell/theme-aetheris-prism`. App: `@workshell/session-app`. Aetheris packages remain in the tree unregistered.

## Run

```bash
npm install
npm run dev
```

Opens an empty desktop (wallpaper, taskbar, Menu, no windows). Layout key: `localStorage["workshell.layout.v1"]` (`version: 2`). Prefs key `workshell.prefs.v1` appears only after `session.setTheme`. Clear both keys to restore empty seed + base.

## Test

```bash
npm test
```

## Acceptance

1. `npm run dev` serves teal desktop, chiseled chrome, Menu → Settings. No photo, no blur.
2. Appearance lists Base. Idle boot: prefs key **absent**. Clicking Base writes `workshell.prefs.v1`.
3. Console `session.setTheme("nope")` throws; desktop unchanged.
4. Console `session.setTheme("base")` writes prefs; reload stays base.
5. Layout key stays geometry-only. Leftover demo ids do not reappear.
6. Clear both `workshell.layout.v1` and `workshell.prefs.v1` to restore empty seed + base.
