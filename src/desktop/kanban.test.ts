import { describe, expect, it } from "vitest";
import { mountKanban } from "./kanban";
import { buildWorkspace } from "../layout/chrome";

describe("kanban widget", () => {
  it("mounts four static lanes and is not a panel", () => {
    const root = document.createElement("div");
    const hosts = buildWorkspace(root);
    mountKanban(hosts.widgetLayer);
    const lanes = hosts.widgetLayer.querySelectorAll("[data-purpose='kanban-lane']");
    expect(lanes.length).toBe(4);
    const titles = [...lanes].map((l) => l.querySelector("h2")?.textContent);
    expect(titles).toEqual([
      "Backlog / Ideias",
      "Em Progresso (Sprint 04)",
      "Revisão",
      "Concluído",
    ]);
    expect(hosts.widgetLayer.querySelector("[data-id]")).toBeNull();
    expect(hosts.widgetLayer.querySelector(".panel")).toBeNull();
  });
});
