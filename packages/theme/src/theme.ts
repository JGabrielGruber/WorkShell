export type ThemeRegistration = {
  id: string;
  title: string;
  description: string;
};

export const baseTheme: ThemeRegistration = {
  id: "base",
  title: "Base",
  description: "Opaque classic chrome. No photo, no blur.",
};

export const BASE_COLORS: { token: string; value: string }[] = [
  { token: "--color-base-100", value: "#ffffff" },
  { token: "--color-base-200", value: "#c0c0c0" },
  { token: "--color-base-300", value: "#808080" },
  { token: "--color-base-content", value: "#000000" },
  { token: "--color-primary", value: "#000080" },
  { token: "--color-primary-content", value: "#ffffff" },
  { token: "--color-secondary", value: "#1084d0" },
  { token: "--color-secondary-content", value: "#ffffff" },
  { token: "--color-accent", value: "#008080" },
  { token: "--color-accent-content", value: "#ffffff" },
  { token: "--color-neutral", value: "#c0c0c0" },
  { token: "--color-neutral-content", value: "#000000" },
  { token: "--color-info", value: "#000080" },
  { token: "--color-info-content", value: "#ffffff" },
  { token: "--color-success", value: "#008000" },
  { token: "--color-success-content", value: "#ffffff" },
  { token: "--color-warning", value: "#808000" },
  { token: "--color-warning-content", value: "#000000" },
  { token: "--color-error", value: "#800000" },
  { token: "--color-error-content", value: "#ffffff" },
  { token: "--color-muted", value: "#808080" },
];

export type Theme = {
  register(theme: ThemeRegistration): void;
  list(): ThemeRegistration[];
  apply(el: HTMLElement, id: string): void;
  inspect(id: string): { colors: { token: string; value: string }[] };
};

export function createTheme(): Theme {
  const catalog: ThemeRegistration[] = [];

  const api: Theme = {
    register(theme) {
      if (!theme.id || !theme.title || !theme.description) {
        throw new Error("id, title, and description required");
      }
      if (catalog.some((t) => t.id === theme.id)) {
        throw new Error("already registered");
      }
      catalog.push(theme);
    },
    list() {
      return [...catalog];
    },
    apply(el, id) {
      if (!catalog.some((t) => t.id === id)) throw new Error("theme");
      el.dataset.theme = id;
    },
    inspect(id) {
      if (!catalog.some((t) => t.id === id)) throw new Error("theme");
      if (id !== "base") throw new Error("theme");
      return { colors: BASE_COLORS.map((c) => ({ ...c })) };
    },
  };

  api.register(baseTheme);
  return api;
}
