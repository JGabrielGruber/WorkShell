import { describe, expect, it, vi } from "vitest";
import { createSession } from "@workshell/session";
import type { WorkspaceEngine } from "@workshell/compositor";
import { mountMenu } from "./menu";

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

function makeSession(storage: Storage = mem()) {
  return createSession({ storage });
}

describe("mountMenu", () => {
  it("opens an empty list with no placeholder", () => {
    const host = document.createElement("div");
    const open = vi.fn();
    mountMenu(host, makeSession(), { open } as unknown as WorkspaceEngine);
    const btn = host.querySelector("[aria-label=Menu]") as HTMLElement;
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    const list = btn.nextElementSibling as HTMLElement;
    expect(list.hidden).toBe(true);
    btn.click();
    expect(btn.getAttribute("aria-expanded")).toBe("true");
    expect(list.hidden).toBe(false);
    expect(list.children.length).toBe(0);
    expect(list.textContent?.trim()).toBe("");
    expect(open).not.toHaveBeenCalled();
  });

  it("rebuilds from live list() on open and opens the app on row click", () => {
    const host = document.createElement("div");
    const session = makeSession();
    const open = vi.fn();
    mountMenu(host, session, { open } as unknown as WorkspaceEngine);
    session.register({ id: "fake", title: "Fake", mount() {} });
    const btn = host.querySelector("[aria-label=Menu]") as HTMLElement;
    const list = btn.nextElementSibling as HTMLElement;
    btn.click();
    expect(list.children.length).toBe(1);
    const row = [...list.querySelectorAll("*"), ...list.children].find((el) => el.textContent === "Fake") as
      | HTMLElement
      | undefined;
    expect(row).toBeTruthy();
    row!.click();
    expect(open).toHaveBeenCalledWith("fake", { title: "Fake" });
    expect(list.hidden).toBe(true);
    expect(btn.getAttribute("aria-expanded")).toBe("false");
  });
});
