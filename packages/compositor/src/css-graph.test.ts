import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const dir = dirname(fileURLToPath(import.meta.url));
const index = readFileSync(join(dir, "index.ts"), "utf8");
const css = readFileSync(join(dir, "compositor.css"), "utf8");

describe("compositor css graph", () => {
  it("imports theme + own css; no glass", () => {
    expect(index).toContain('import "@workshell/theme"');
    expect(index).toContain('import "./compositor.css"');
    expect(css).not.toMatch(/--glass/);
  });
});
