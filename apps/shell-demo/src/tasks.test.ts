import { describe, expect, it } from "vitest";
import { TASKS, taskById } from "./tasks";

describe("TASKS", () => {
  it("has four lanes and includes task-104", () => {
    const lanes = [...new Set(TASKS.map((t) => t.lane))];
    expect(lanes).toEqual([
      "Backlog / Ideias",
      "Em Progresso (Sprint 04)",
      "Revisão",
      "Concluído",
    ]);
    expect(taskById("task-104")?.title).toMatch(/Pipelines de Renderização Neural/);
    expect(TASKS.every((t) => t.id.startsWith("task-"))).toBe(true);
  });
});
