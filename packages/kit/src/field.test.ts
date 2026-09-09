import { describe, expect, it, vi } from "vitest";
import { field } from "./field";

describe("field", () => {
  it("associates a visible label with a text input", () => {
    const el = field({ name: "address", label: "Address", value: "probe:/" });
    expect(el.classList.contains("ws-field")).toBe(true);
    const input = el.querySelector("input");
    const label = el.querySelector("label");
    expect(input).toBeTruthy();
    expect(input?.type).toBe("text");
    expect(input?.id).toBe("ws-field-address");
    expect(label?.htmlFor).toBe("ws-field-address");
    expect(label?.textContent).toBe("Address");
    expect(input?.value).toBe("probe:/");
  });

  it("wires checkbox, disabled, and onChange", () => {
    const onChange = vi.fn();
    const box = field({
      name: "on",
      label: "On",
      kind: "checkbox",
      value: true,
      onChange,
    });
    const input = box.querySelector("input")!;
    expect(input.type).toBe("checkbox");
    expect(input.checked).toBe(true);
    input.checked = false;
    input.dispatchEvent(new Event("change"));
    expect(onChange).toHaveBeenCalledWith(false);

    const dead = field({ name: "x", label: "X", disabled: true });
    expect(dead.querySelector("input")?.disabled).toBe(true);
  });
});
