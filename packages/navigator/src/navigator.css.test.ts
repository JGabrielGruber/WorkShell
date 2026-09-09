import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "navigator.css"), "utf8");

describe("navigator.css pigment", () => {
  it("uses tokens only and no glass effect", () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/rgba?\(/);
    expect(css).not.toMatch(/hsla?\(/);
    expect(css).not.toMatch(/--glass/);
    expect(css).not.toMatch(/--left-w/);
    expect(css).toContain("220px");
    expect(css).toContain("280px");
  });
});
