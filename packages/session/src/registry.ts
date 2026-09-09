export type AppRegistration = {
  id: string;
  title: string;
  mount: (el: HTMLElement) => void;
};

export class AppRegistry {
  private apps = new Map<string, AppRegistration>();

  register(app: AppRegistration): void {
    if (!app.id) throw new Error("id required");
    if (!app.title) throw new Error("title required");
    if (typeof app.mount !== "function") throw new Error("mount required");
    if (this.apps.has(app.id)) throw new Error("already registered");
    this.apps.set(app.id, app);
  }

  list(): Array<{ id: string; title: string }> {
    return [...this.apps.values()].map(({ id, title }) => ({ id, title }));
  }

  ids(): Set<string> {
    return new Set(this.apps.keys());
  }

  title(id: string): string | undefined {
    return this.apps.get(id)?.title;
  }

  mount(id: string, el: HTMLElement): void {
    this.apps.get(id)?.mount(el);
  }
}
