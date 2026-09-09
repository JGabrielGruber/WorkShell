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
});
