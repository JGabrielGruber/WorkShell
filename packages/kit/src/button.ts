export type ButtonKind = "primary" | "neutral" | "danger";

export type ButtonOpts = {
  label: string;
  kind?: ButtonKind;
  disabled?: boolean;
  onClick?: () => void;
};

export function button(opts: ButtonOpts): HTMLButtonElement {
  const el = document.createElement("button");
  el.type = "button";
  const kind = opts.kind ?? "neutral";
  el.className = `ws-btn ws-btn-${kind}`;
  el.textContent = opts.label;
  if (opts.disabled) el.disabled = true;
  if (opts.onClick) el.addEventListener("click", opts.onClick);
  return el;
}
