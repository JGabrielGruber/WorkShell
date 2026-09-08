import { fillTask104 } from "./task-104";
import { taskById, taskTitle } from "../tasks";

export function fillWindow(id: string, host: HTMLElement): void {
  if (id === "task-104") {
    fillTask104(host);
    return;
  }
  const task = taskById(id);
  if (!task) return;
  host.replaceChildren();
  const doc = document.createElement("div");
  doc.className = "task-doc";
  const kicker = document.createElement("p");
  kicker.className = "task-doc-id";
  kicker.textContent = taskTitle(id);
  const h1 = document.createElement("h1");
  h1.textContent = task.title;
  const meta = document.createElement("p");
  meta.className = "task-doc-meta";
  meta.textContent = `${task.lane} · ${task.tag}`;
  doc.append(kicker, h1, meta);
  if (task.body) {
    const p = document.createElement("p");
    p.textContent = task.body;
    doc.append(p);
  }
  host.append(doc);
}
