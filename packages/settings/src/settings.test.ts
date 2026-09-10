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

  it("mounts navigator at settings:/appearance as a section", () => {
    const storage = mem();
    const session = createSession({ storage });
    const setTheme = session.setTheme.bind(session);
    let setThemeCalls = 0;
    session.setTheme = (id) => {
      setThemeCalls += 1;
      return setTheme(id);
    };
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
    settingsRow!.click();
    const body = engine.node("settings").querySelector(".panel-body")!;
    const input = body.querySelector(".nav-chrome input") as HTMLInputElement;
    expect(input.value).toBe("settings:/appearance");
    expect(body.querySelector(".nav-dock[data-dock=leading]")?.textContent).toContain("Appearance");
    expect(body.querySelector(".nav-dock[data-dock=leading]")?.textContent).toContain("Theme");
    expect(body.querySelector(".nav-dock[data-dock=center]")?.textContent).toContain("Theme");
    expect(body.querySelector(".nav-dock[data-dock=trailing]")?.getAttribute("data-empty")).toBe("true");

    const themeIcon = [...body.querySelectorAll("[data-id]")].find(
      (el) => (el as HTMLElement).dataset.id === "theme",
    ) as HTMLElement;
    themeIcon.click();
    expect(input.value).toBe("settings:/appearance/theme");
    expect(body.querySelector(".nav-dock[data-dock=center]")?.textContent).toContain("Base");
    expect(body.querySelector(".nav-dock[data-dock=trailing]")?.getAttribute("data-empty")).toBe("true");

    const baseIcon = [...body.querySelectorAll("[data-id]")].find(
      (el) => (el as HTMLElement).dataset.id === "base",
    ) as HTMLElement;
    baseIcon.click();
    expect(input.value).toBe("settings:/appearance/theme/base");
    expect(setThemeCalls).toBe(0);
    expect(storage.getItem(PREFS_KEY)).toBeNull();
    const trailing = body.querySelector(".nav-dock[data-dock=trailing]")!;
    expect(trailing.getAttribute("data-empty")).toBe("false");
    expect(trailing.textContent).toContain("Colors");
    expect(trailing.textContent).toContain("--color-primary");
    expect(trailing.textContent).toContain("#000080");
  });
});
