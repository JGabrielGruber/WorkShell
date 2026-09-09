import { describe, expect, it } from "vitest";
import { dialogFrame } from "./dialog";

describe("dialogFrame", () => {
  it("is chrome, not a modal", () => {
    const body = document.createElement("p");
    body.textContent = "Hello";
    const actions = document.createElement("div");
    actions.className = "acts";
    const el = dialogFrame({ title: "Confirm", body, actions });
    expect(el.classList.contains("ws-dialog")).toBe(true);
    expect(el.querySelector(".ws-dialog-title")?.textContent).toBe("Confirm");
    expect(el.querySelector(".acts")).toBe(actions);
    expect(el.querySelector("dialog")).toBeNull();
  });
});
