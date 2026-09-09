import { describe, expect, it } from "vitest";
import { createSession, emptyLayout, PREFS_KEY } from "@workshell/session";
import { createDesktop } from "@workshell/desktop";
import { createSettings } from "./settings";

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

describe("createSettings", () => {
  it("registers as settings", () => {
    const session = createSession({ storage: mem() });
    const app = createSettings(session);
    expect(app.id).toBe("settings");
    expect(app.title).toBe("Settings");
  });

  it("mounts navigator at settings:/appearance and lists catalog", () => {
    const storage = mem();
    const session = createSession({ storage });
    session.register(createSettings(session));
    const { workspace, engine } = createDesktop(document.createElement("div"), session, {
      seed: emptyLayout,
    });
    const btn = workspace.querySelector("[data-slot=menu] [aria-label=Menu]") as HTMLElement;
    btn.click();
    const menuList = btn.nextElementSibling as HTMLElement;
    const settingsRow = [...menuList.querySelectorAll("*")].find((el) => el.textContent === "Settings") as
      | HTMLElement
      | undefined;
    expect(settingsRow).toBeTruthy();
    settingsRow!.click();
    expect(engine.state.panels.settings).toBeDefined();
    const body = engine.node("settings").querySelector(".panel-body")!;
    expect(body.querySelector(".nav")).toBeTruthy();
    const input = body.querySelector(".nav-chrome input") as HTMLInputElement;
    expect(input.value).toBe("settings:/appearance");
    expect(body.textContent).toContain("Appearance");
    expect(body.textContent).toContain("Base");
    const row = [...body.querySelectorAll("[data-id]")].find(
      (el) => (el as HTMLElement).dataset.id === "base",
    ) as HTMLElement;
    expect(row).toBeTruthy();
    row.click();
    expect(workspace.dataset.theme).toBe("base");
    expect(JSON.parse(storage.getItem(PREFS_KEY)!)).toEqual({ version: 1, theme: "base" });
    expect(workspace.querySelector("[data-slot=menu] [aria-label=Menu]")).toBeTruthy();
  });
});
