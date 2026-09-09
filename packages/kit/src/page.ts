export type PageOpts = { title: string; body: HTMLElement };

export function page(opts: PageOpts): HTMLElement {
  const el = document.createElement("div");
  el.className = "ws-page";
  const title = document.createElement("h1");
  title.className = "ws-page-title";
  title.textContent = opts.title;
  el.append(title, opts.body);
  return el;
}
