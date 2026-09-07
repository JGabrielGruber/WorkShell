# Workshell

Minimal desktop-like window manager (vanilla TypeScript + Vite + Tailwind). Not a full app. Not a WebGPU renderer.

## Run

```bash
npm install
npm run dev
```

Open the local URL. Layout key: `localStorage["workshell.layout.v1"]`. Clear it to restore seed panels.

## Test

```bash
npm test
```

## Acceptance demo

1. Float **Spec Viewer** (titlebar Float, or drag it out of the right dock).
2. Drag it (titlebar) and resize from the bottom-right handle.
3. Dock it back to the right slot (drag to the right edge snap, or Dock).
4. Overlay **Task Thread**, then click the dim to restore.
5. Reload: positions remain.
6. DevTools console: every reparent logs `{ id, uid, isConnected, parent }`. `isConnected` stays true and `uid` does not change across float/dock.

Seed: Backlog left, Sprint + Chat center tabs, Spec right, Metrics floating.
