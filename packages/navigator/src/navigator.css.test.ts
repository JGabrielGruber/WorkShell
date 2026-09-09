import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const dir = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(dir, "navigator.css"), "utf8");
const index = readFileSync(join(dir, "index.ts"), "utf8");

describe("navigator.css pigment", () => {
  it("imports the theme engine and own css from JS", () => {
    expect(index).toContain('import "@workshell/theme"');
    expect(index).toContain('import "./navigator.css"');
  });

  it("uses tokens only and no glass effect", () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/rgba?\(/);
    expect(css).not.toMatch(/hsla?\(/);
    expect(css).not.toMatch(/--glass/);
    expect(css).not.toMatch(/--left-w/);
    expect(css).toContain("220px");
    expect(css).toContain("280px");
    expect(css).toContain("var(--shadow)");
  });
});

