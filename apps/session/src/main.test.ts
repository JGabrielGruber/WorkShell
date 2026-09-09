import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const dir = dirname(fileURLToPath(import.meta.url));
const main = readFileSync(join(dir, "main.ts"), "utf8");
const html = readFileSync(join(dir, "../index.html"), "utf8");

describe("session entry", () => {
  it("is JS-only and registers Settings", () => {
    expect(main).not.toMatch(/\.css/);
    expect(main).toContain("@workshell/settings");
    expect(main).toContain("createSettings");
    expect(main).toContain("createSession()");
    expect(html).not.toMatch(/fonts.googleapis.com/);
  });
});
