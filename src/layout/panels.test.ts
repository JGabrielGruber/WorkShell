import { describe, expect, it } from "vitest";
import { createPanel } from "./panels";

describe("createPanel", () => {
  it("stamps id and uid and never requires a second node for the same call result", () => {
    const el = createPanel("spec");
    expect(el.dataset.id).toBe("spec");
    expect(el.dataset.uid).toMatch(/./);
    expect(el.querySelector(".panel-title")?.textContent).toBe("Spec Viewer");
    expect(el.querySelectorAll("[data-action]").length).toBe(4);
    expect(el.querySelector("pre")).not.toBeNull();
  });

  it("renders placeholder bodies", () => {
    expect(createPanel("backlog").querySelectorAll(".card").length).toBe(2);
    expect(createPanel("sprint").querySelectorAll(".column").length).toBe(2);
    expect(createPanel("chat").querySelectorAll(".msg").length).toBe(3);
    const metrics = createPanel("metrics");
    expect(metrics.textContent).toContain("4.12 ms");
    expect(metrics.textContent).toContain("340 MB");
    expect(metrics.textContent).toContain("144 Hz");
  });

  it("GPU Preview is a black canvas placeholder", () => {
    const el = createPanel("gpu-preview", "GPU Preview");
    expect(el.querySelector("canvas")).not.toBeNull();
    expect(el.textContent).toContain("WebGPU host");
  });
});
