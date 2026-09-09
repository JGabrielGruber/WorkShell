import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "kit.css"), "utf8");

describe("kit.css pigment", () => {
  it("uses tokens only", () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/rgba?\(/);
    expect(css).not.toMatch(/hsla?\(/);
    expect(css).not.toMatch(/--glass/);
    expect(css).not.toMatch(/--taskbar-h/);
    expect(css).not.toMatch(/--left-w/);
    expect(css).not.toMatch(/--right-w/);
    expect(css).not.toMatch(/--wallpaper/);
  });

  it("declares the self-style recipes", () => {
    expect(css).toContain("var(--color-base-100)");
    expect(css).toContain("var(--color-base-200)");
    expect(css).toContain("var(--color-base-300)");
    expect(css).toContain("var(--color-base-content)");
    expect(css).toContain("var(--color-primary)");
    expect(css).toContain("var(--color-primary-content)");
    expect(css).toContain("var(--color-error)");
    expect(css).toContain("var(--color-error-content)");
    expect(css).toContain("var(--font-sans)");
    expect(css).toContain("var(--font-display)");
    expect(css).toContain("var(--radius-box)");
    expect(css).toContain("var(--radius-field)");
    expect(css).toContain("var(--radius-selector)");
    expect(css).toContain("var(--border)");
    expect(css).toContain("color-mix(in srgb, var(--color-primary) 35%, var(--color-base-200))");
  });
});
