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

export type Theme = {
  register(theme: ThemeRegistration): void;
  list(): ThemeRegistration[];
  apply(el: HTMLElement, id: string): void;
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
  };

  api.register(baseTheme);
  return api;
}
