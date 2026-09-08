import { describe, expect, it, vi } from "vitest";
import { mountThemeSwitch } from "./theme-switch";

describe("theme switch", () => {
  it("prepends Glass/Prism and calls setTheme", () => {
    const taskbar = document.createElement("nav");
    const pill = document.createElement("button");
    pill.className = "task-pill";
    taskbar.append(pill);
    const setTheme = vi.fn();
    mountThemeSwitch(taskbar, setTheme);
    const group = taskbar.firstElementChild as HTMLElement;
    expect(group.className).toBe("theme-switch");
    expect(group.getAttribute("role")).toBe("group");
    const buttons = [...group.querySelectorAll("button")];
    expect(buttons.map((b) => b.textContent)).toEqual(["Glass", "Prism"]);
    expect(buttons[0].getAttribute("aria-pressed")).toBe("true");
    expect(buttons[1].getAttribute("aria-pressed")).toBe("false");
    buttons[1].click();
    expect(setTheme).toHaveBeenCalledWith("aetheris-prism");
    expect(buttons[0].getAttribute("aria-pressed")).toBe("false");
    expect(buttons[1].getAttribute("aria-pressed")).toBe("true");
    buttons[0].click();
    expect(setTheme).toHaveBeenCalledWith("aetheris-glass");
    expect(taskbar.querySelector(".task-pill")).toBe(pill);
  });
});
