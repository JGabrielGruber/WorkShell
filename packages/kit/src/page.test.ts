import { describe, expect, it } from "vitest";
import { page } from "./page";

describe("page", () => {
  it("wraps title and body", () => {
    const body = document.createElement("div");
    body.className = "inner";
    const el = page({ title: "Fields", body });
    expect(el.classList.contains("ws-page")).toBe(true);
    expect(el.querySelector(".ws-page-title")?.textContent).toBe("Fields");
    expect(el.querySelector(".inner")).toBe(body);
  });
});
