import { describe, expect, it, vi } from "vitest";
import { createDesktop } from "@workshell/desktop-shell";
import { seedLayout } from "../seed";
import { mountKanban } from "./kanban";

describe("kanban widget", () => {
  it("mounts four static lanes and is not a panel", () => {
    const root = document.createElement("div");
    const host = createDesktop(root);
    host.boot({
      theme: "aetheris-glass",
      seed: seedLayout,
      storage: localStorage,
      fillWidgetLayer: mountKanban,
      fillPanelBody() {},
    });
    const layer = host.workspace.querySelector("#widget-layer")!;
    const lanes = layer.querySelectorAll("[data-purpose='kanban-lane']");
    expect(lanes.length).toBe(4);
    const titles = [...lanes].map((l) => l.querySelector("h2")?.textContent);
    expect(titles).toEqual([
      "Backlog / Ideias",
      "Em Progresso (Sprint 04)",
      "Revisão",
      "Concluído",
    ]);
    expect(layer.querySelector("[data-id]")).toBeNull();
    expect(layer.querySelector(".panel")).toBeNull();
    expect(layer.querySelector("[data-task-id='task-104']")).toBeTruthy();
  });

  it("clicking a card calls open with id and chrome title", () => {
    const open = vi.fn();
    const root = document.createElement("div");
    document.body.append(root);
    mountKanban(root, { open });
    const card = root.querySelector<HTMLElement>("[data-task-id='task-112']");
    expect(card).toBeTruthy();
    card!.click();
    expect(open).toHaveBeenCalledWith("task-112", "TASK-112");
  });
});
