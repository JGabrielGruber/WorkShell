# Development Workflow & Operations

This document describes standard development, testing, and execution procedures for human contributors and autonomous AI agents.

---

## 1. Environment & Safe Behaviors

- **Git Worktrees:** For non-trivial features, create an isolated worktree under `.worktrees/<branch-name>`. Never commit half-finished experiments directly to `master`.
- **Background Servers:** Do **not** kill running Vite dev servers (`npm run dev`).
- **Git Push:** Do **not** run `git push` or `git push --force` without explicit instruction.
- **Node/NPM:** Workspaces are configured in root `package.json` (`packages/*`, `packages/themes/*`, `apps/*`). Run installs from the workspace root.

---

## 2. Test-Driven Feedback Loop

Vitest runs under the `happy-dom` environment. Tests must pass 100% cleanly before committing.

### Full Test Suite
```bash
npm test
```

### Targeted Package Testing (Low noise, high speed)
```bash
# Run tests for a specific package:
npx vitest run packages/theme
npx vitest run packages/session
npx vitest run packages/navigator
npx vitest run packages/kit
npx vitest run packages/desktop
```

### TypeScript Validation
```bash
npm run typecheck
# or:
npx tsc --noEmit
```

---

## 3. Resetting State During Development

Workshell persists state across reloads via two `localStorage` keys:
1. `workshell.layout.v1`: Window geometry and placement.
2. `workshell.prefs.v1`: Theme preference (appears only after explicit `session.setTheme`).

To restore a completely clean empty baseline:
- Open DevTools Console in the browser:
  ```js
  localStorage.removeItem("workshell.layout.v1");
  localStorage.removeItem("workshell.prefs.v1");
  location.reload();
  ```
- Or clear site storage in DevTools Application tab.
