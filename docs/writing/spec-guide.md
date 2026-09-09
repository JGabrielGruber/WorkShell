# Spec & Plan Authoring Guide

All architectural evolution in Workshell follows **Spec-Driven Development (SDD)**. Code is not written until a design spec is authored, reviewed, and translated into an actionable implementation plan.

---

## 1. Lifecycle of a Feature

```
[Need Identified]
       │
       ▼
[Design Spec: docs/superpowers/specs/YYYY-MM-DD-<name>-design.md]
       │  (Reviewed & Approved)
       ▼
[Implementation Plan: docs/superpowers/plans/YYYY-MM-DD-<name>.md]
       │  (Task-by-task execution via TDD)
       ▼
[Code & Invariant Tests Land]
```

---

## 2. Design Spec Template

Every design spec must contain the following required sections:

```markdown
# Workshell <Feature Name> Design

Date: YYYY-MM-DD
Status: Draft | Approved in conversation | Superseded
Project: workshell (test prototype)

Depends on: <antecedent spec 1>, <antecedent spec 2>

This spec does **not** change: <explicit list of boundaries left intact>

## Goal
A clear 2-3 sentence statement of what this spec delivers.

Success:
1. Verifiable acceptance step 1
2. Verifiable acceptance step 2

## Non-goals (this spec)
- Explicit list of related items that are out of scope for this spec.

## Product locks
- Invariants that remain in force (e.g. pointer path laws, package boundaries).

## Key decisions
| Decision | Rationale |
|---|---|
| <What was decided> | <Why alternatives were rejected> |

## Architecture / Interface sketches
Concrete TypeScript types, DOM structures, or data models.
```

---

## 3. Implementation Plan Template

An implementation plan translates the spec into strict, testable tasks for human or agentic workers:

```markdown
# <Feature Name> Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** <Summary>
**Spec:** `docs/superpowers/specs/YYYY-MM-DD-<name>-design.md`
**Worktree:** Create via `using-git-worktrees`. Run `npm test` from the worktree.

## File map
| File | Responsibility |
|---|---|
| `packages/...` | Create / Edit / Delete |

---

### Task 1: <Subsystem>
**Files:**
- Create: `...`
- Test: `...`

- [ ] **Step 1: Write test for <behavior>**
- [ ] **Step 2: Implement <behavior>**
- [ ] **Step 3: Verify test passes**
```
