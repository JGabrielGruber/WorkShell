import { describe, expect, it } from "vitest";
import { fieldsPage } from "./pages";

describe("fieldsPage", () => {
  it("mounts the same factory on two hosts", () => {
    const a = document.createElement("div");
    const b = document.createElement("div");
    a.append(fieldsPage());
    b.append(fieldsPage());
    expect(a.querySelector(".ws-page")).toBeTruthy();
    expect(b.querySelector(".ws-page")).toBeTruthy();
    expect(a.querySelectorAll("input")).toHaveLength(3);
    expect(a.querySelector("input:disabled")).toBeTruthy();
    expect(a.querySelector(".ws-btn-primary")).toBeTruthy();
  });
});
