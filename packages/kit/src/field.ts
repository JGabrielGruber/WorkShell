export type FieldOpts = {
  name: string;
  label: string;
  kind?: "text" | "checkbox";
  value?: string | boolean;
  disabled?: boolean;
  onChange?: (value: string | boolean) => void;
};

export function field(opts: FieldOpts): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "ws-field";
  const id = `ws-field-${opts.name}`;
  const label = document.createElement("label");
  label.htmlFor = id;
  label.textContent = opts.label;
  const input = document.createElement("input");
  input.id = id;
  input.name = opts.name;
  const kind = opts.kind ?? "text";
  input.type = kind;
  if (opts.disabled) input.disabled = true;
  if (kind === "checkbox") {
    input.checked = Boolean(opts.value);
  } else if (typeof opts.value === "string") {
    input.value = opts.value;
  }
  if (opts.onChange) {
    const eventName = kind === "checkbox" ? "change" : "input";
    input.addEventListener(eventName, () => {
      opts.onChange?.(kind === "checkbox" ? input.checked : input.value);
    });
  }
  wrap.append(label, input);
  return wrap;
}
