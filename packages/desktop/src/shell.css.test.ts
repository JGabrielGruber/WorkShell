import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "shell.css"), "utf8");
const index = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "index.ts"), "utf8");

describe("shell.css pigment", () => {
  it("imports the theme engine and own css from JS", () => {
    expect(index).toContain('import "@workshell/theme"');
    expect(index).toContain('import "./shell.css"');
  });

  it("uses tokens only; no glass", () => {
    expect(css).not.toMatch(/--glass/);
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/rgba?\(/);
    expect(css).toContain("var(--color-accent)");
    expect(css).toContain("var(--wallpaper)");
    expect(css).toContain("var(--shadow)");
    expect(css).toContain("var(--shadow-md)");
    expect(css).toContain("var(--shadow-lg)");
    expect(css).toContain("var(--blur)");
    expect(css).toContain("background-color: var(--color-accent)");
  });

  it("styles Classic caption buttons, not traffic lights", () => {
    expect(css).not.toMatch(/\.traffic\b/);
    expect(css).not.toMatch(/\.tl-close\b/);
    expect(css).not.toMatch(/\.tl-hide\b/);
    expect(css).not.toMatch(/\.tl-max\b/);
    expect(css).not.toMatch(/(^|})\s*\.tl\s*\{/);
    expect(css).not.toMatch(/\.caption-(btn|min|max|close)[^{]*\{[^}]*--color-(error|warning|success)/);

    expect(css).toContain(".caption-buttons");
    expect(css).toContain(".caption-btn");
    expect(css).toContain("width: 16px");
    expect(css).toContain("height: 14px");
    expect(css).toContain("background: var(--color-base-200)");
    expect(css).toContain("color: var(--color-base-content)");
    expect(css).toContain("border-radius: var(--radius-field)");
    expect(css).toContain("margin-left: var(--space-2)");
    expect(css).toMatch(/\.caption-btn:active[^{]*\{[^}]*var\(--shadow-inner\)/);
    expect(css).toMatch(/\.caption-min::before[^{]*\{/);
    expect(css).toMatch(/\.caption-max::before[^{]*\{/);
    expect(css).toMatch(/\.caption-close::before[^{]*\{[^}]*content:\s*"×"/);
  });
});
