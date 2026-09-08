const THEMES = [
  { id: "aetheris-glass", label: "Glass" },
  { id: "aetheris-prism", label: "Prism" },
] as const;

export function mountThemeSwitch(
  taskbar: HTMLElement,
  setTheme: (name: string) => void,
  initial = "aetheris-glass",
): void {
  const group = document.createElement("div");
  group.className = "theme-switch";
  group.setAttribute("role", "group");
  group.setAttribute("aria-label", "Theme");
  for (const { id, label } of THEMES) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label;
    btn.dataset.themeId = id;
    btn.setAttribute("aria-pressed", String(id === initial));
    btn.addEventListener("click", () => {
      setTheme(id);
      for (const b of group.querySelectorAll("button")) {
        b.setAttribute("aria-pressed", String(b === btn));
      }
    });
    group.append(btn);
  }
  taskbar.prepend(group);
}
