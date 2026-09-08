import { TASKS, taskTitle } from "../tasks";

export type KanbanOptions = {
  open?: (id: string, title: string) => void;
};

const LANES = [
  "Backlog / Ideias",
  "Em Progresso (Sprint 04)",
  "Revisão",
  "Concluído",
] as const;

export function mountKanban(host: HTMLElement, opts: KanbanOptions = {}): void {
  host.replaceChildren();
  const board = document.createElement("div");
  board.id = "kanban";
  board.dataset.purpose = "kanban-lanes-container";
  for (const lane of LANES) {
    const items = TASKS.filter((t) => t.lane === lane);
    const section = document.createElement("section");
    section.dataset.purpose = "kanban-lane";
    section.className = "kanban-lane";
    const head = document.createElement("div");
    head.className = "kanban-lane-head";
    const h2 = document.createElement("h2");
    h2.textContent = lane;
    const count = document.createElement("span");
    count.className = "kanban-count";
    count.textContent = String(items.length);
    head.append(h2, count);
    const body = document.createElement("div");
    body.className = "kanban-lane-body";
    for (const task of items) {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "kanban-card";
      card.dataset.taskId = task.id;
      if (task.id === "task-104") card.dataset.purpose = "active-target-card";
      const meta = document.createElement("div");
      meta.className = "kanban-card-meta";
      const tag = document.createElement("span");
      tag.textContent = task.tag;
      const idEl = document.createElement("span");
      idEl.textContent = taskTitle(task.id);
      meta.append(tag, idEl);
      const h3 = document.createElement("h3");
      h3.textContent = task.title;
      card.append(meta, h3);
      if (task.body) {
        const p = document.createElement("p");
        p.textContent = task.body;
        card.append(p);
      }
      if (opts.open) {
        card.addEventListener("click", () => opts.open!(task.id, taskTitle(task.id)));
      }
      body.append(card);
    }
    section.append(head, body);
    board.append(section);
  }
  host.append(board);
}
