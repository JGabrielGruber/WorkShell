import { describe, expect, it } from "vitest";
import { STORAGE_KEY } from "@workshell/compositor";
import { createSession, emptyLayout, PREFS_KEY } from "@workshell/session";
import { createDesktop } from "./host";

function mem(): Storage {
  const m = new Map<string, string>();
  return {
    get length() {
      return m.size;
    },
    clear: () => m.clear(),
    getItem: (k: string) => m.get(k) ?? null,
    key: (i: number) => [...m.keys()][i] ?? null,
    removeItem: (k: string) => {
      m.delete(k);
    },
    setItem: (k: string, v: string) => {
      m.set(k, v);
    },
  };
}

const leftover = {
  version: 2,
  slots: {
    left: { width: 320, order: ["probe"], activeId: "probe" },
    center: { width: 0, order: [], activeId: null },
    right: { width: 360, order: [], activeId: null },
  },
  panels: {
    probe: { id: "probe", uid: "", title: "Probe", mode: "float", x: 1, y: 1, w: 100, h: 100, z: 1 },
  },
  overlay: null,
  closed: [],
  nextZ: 2,
};

function glassSession(storage: Storage = mem()) {
  return createSession({ defaultTheme: "aetheris-glass", storage });
}

describe("createDesktop", () => {
  it("stamps glass and does not write prefs", () => {
    const storage = mem();
    const session = glassSession(storage);
    const { workspace } = createDesktop(document.createElement("div"), session, { seed: emptyLayout });
    expect(workspace.dataset.theme).toBe("aetheris-glass");
    expect(workspace.getAttribute("data-theme")).toBe("aetheris-glass");
    expect(storage.getItem(PREFS_KEY)).toBeNull();
  });

  it("leaves widget-layer empty", () => {
    const session = glassSession();
    const { workspace } = createDesktop(document.createElement("div"), session, { seed: emptyLayout });
    expect(workspace.querySelector("#widget-layer")?.children.length).toBe(0);
  });

  it("mounts Menu in the menu slot; empty registry opens to zero rows", () => {
    const session = glassSession();
    const { workspace } = createDesktop(document.createElement("div"), session, { seed: emptyLayout });
    const slot = workspace.querySelector("[data-slot=menu]");
    const btn = slot?.querySelector("[aria-label=Menu]");
    expect(btn).toBeTruthy();
    (btn as HTMLElement).click();
    const list = (btn as HTMLElement).nextElementSibling as HTMLElement;
    expect(list.children.length).toBe(0);
    expect(list.textContent?.trim()).toBe("");
  });

  it("opens a registered app from the menu into a panel body", () => {
    const session = glassSession();
    session.register({
      id: "fake",
      title: "Fake",
      mount(el) {
        el.textContent = "ok";
      },
    });
    const { workspace, engine } = createDesktop(document.createElement("div"), session, {
      seed: emptyLayout,
    });
    const btn = workspace.querySelector("[data-slot=menu] [aria-label=Menu]") as HTMLElement;
    btn.click();
    const list = btn.nextElementSibling as HTMLElement;
    const row = [...list.querySelectorAll("*"), ...list.children].find((el) => el.textContent === "Fake") as
      | HTMLElement
      | undefined;
    expect(row).toBeTruthy();
    row!.click();
    expect(engine.state.panels.fake).toBeDefined();
    expect(engine.node("fake").querySelector(".panel-body")?.textContent).toBe("ok");
    expect(workspace.querySelector("[data-slot=menu] [aria-label=Menu]")).toBeTruthy();
    expect(workspace.querySelector("#taskbar-pills .task-pill")).toBeTruthy();
  });

  it("throws on a second createDesktop with the same session", () => {
    const session = glassSession();
    createDesktop(document.createElement("div"), session, { seed: emptyLayout });
    expect(() => createDesktop(document.createElement("div"), session, { seed: emptyLayout })).toThrow(
      /already/,
    );
  });

  it("drops leftover probe when the registry is empty", () => {
    const storage = mem();
    storage.setItem(STORAGE_KEY, JSON.stringify(leftover));
    const session = glassSession(storage);
    const { workspace, engine } = createDesktop(document.createElement("div"), session, {
      seed: emptyLayout,
    });
    expect(engine.state.panels.probe).toBeUndefined();
    expect(workspace.querySelector("[data-id=probe]")).toBeNull();
  });
});
