export type DialogOpts = { title: string; body: HTMLElement; actions?: HTMLElement };

export function dialogFrame(opts: DialogOpts): HTMLElement {
  const el = document.createElement("div");
  el.className = "ws-dialog";
  const title = document.createElement("h2");
  title.className = "ws-dialog-title";
  title.textContent = opts.title;
  el.append(title, opts.body);
  if (opts.actions) el.append(opts.actions);
  return el;
}
