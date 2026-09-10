# Workshell Agent Guide

Operate as a disciplined systems engineer. This codebase uses **Spec-Driven Development (SDD)** with strict architectural layering and zero runtime DOM churn.

## Current State & Navigation

- **Status Manifest:** [`docs/superpowers/STATUS.md`](file:///home/jgabrielgruber/Projects/Tests/workshell/docs/superpowers/STATUS.md)
- **Active Plan:** [`docs/superpowers/plans/2026-09-09-workshell-settings.md`](file:///home/jgabrielgruber/Projects/Tests/workshell/docs/superpowers/plans/2026-09-09-workshell-settings.md)
- **Active Spec:** [`docs/superpowers/specs/2026-09-09-workshell-settings-design.md`](file:///home/jgabrielgruber/Projects/Tests/workshell/docs/superpowers/specs/2026-09-09-workshell-settings-design.md)
- **System Vision:** [`docs/vision/os.md`](file:///home/jgabrielgruber/Projects/Tests/workshell/docs/vision/os.md) (living aim — not a spec; skills cite, do not author)
- **Architecture Overview:** [`docs/architecture/overview.md`](file:///home/jgabrielgruber/Projects/Tests/workshell/docs/architecture/overview.md)
- **Invariants & Performance Laws:** [`docs/architecture/invariants.md`](file:///home/jgabrielgruber/Projects/Tests/workshell/docs/architecture/invariants.md)

## Core Laws for Agents

1. **Spec-First:** Never write architectural code, change package boundaries, or add new tokens without an approved spec in `docs/superpowers/specs/`.
2. **Pointer-Path Invariant:** NEVER call `getBoundingClientRect`, `offsetWidth`, `clientHeight`, `localStorage`, or toggle CSS classes on `pointermove` or during window drags/resizes. Pointer path is 180Hz compositor law.
3. **Closed Token System:** Do not invent ad-hoc CSS variables, colors, or `--glass*` tokens. All pigment comes from `@workshell/theme` via `var(--token)`.
4. **Clean Layering:** 
   - Kernel (`@workshell/compositor`) never imports desktop, kit, navigator, or settings.
   - Applications mount into panels via `AppRegistry`; they do not modify shell chrome.
   - Entry (`apps/session`) is JS-only; packages import their own CSS from JS.
5. **No Tribute Names:** Name things by what they are (`tree`, `icon view`, `panel`, `dock`). No DE product jargon, vendor marketing names, or skin branding in code.

## Verification Commands

- Fast typecheck: `npm run typecheck` (or `npx tsc --noEmit`)
- Run tests: `npm test`
- Targeted test: `npx vitest run packages/<package-name>`
