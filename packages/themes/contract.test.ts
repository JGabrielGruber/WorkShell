import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const dir = dirname(fileURLToPath(import.meta.url));

export const CONTRACT_VARS = [
  "--color-base-100",
  "--color-base-200",
  "--color-base-300",
  "--color-base-content",
  "--color-primary",
  "--color-primary-content",
  "--color-secondary",
  "--color-secondary-content",
  "--color-accent",
  "--color-accent-content",
  "--color-neutral",
  "--color-neutral-content",
  "--color-info",
  "--color-info-content",
  "--color-success",
  "--color-success-content",
  "--color-warning",
  "--color-warning-content",
  "--color-error",
  "--color-error-content",
  "--glass",
  "--glass-card",
  "--glass-border",
  "--glass-blur",
  "--font-sans",
  "--font-display",
  "--font-mono",
  "--radius-box",
  "--radius-field",
  "--radius-selector",
  "--border",
  "--wallpaper",
] as const;

const GEOMETRY = ["--taskbar-h", "--taskbar-gap", "--left-w", "--right-w"];
const RETIRED = ["--cyan", "--cyan-dim", "--violet", "--green", "--bg-panel", "--muted"];

function load(rel: string): string {
  return readFileSync(join(dir, rel), "utf8");
}

function assertContract(css: string, theme: string, scheme: "dark" | "light") {
  expect(css, `${theme} must not use :root`).not.toMatch(/:root/);
  expect(css).toContain(`[data-theme="${theme}"]`);
  expect(css).toContain(`color-scheme: ${scheme}`);
  for (const name of CONTRACT_VARS) {
    expect(css, `${theme} missing ${name}`).toContain(name);
  }
  for (const name of GEOMETRY) {
    expect(css, `${theme} must not define ${name}`).not.toContain(name);
  }
  for (const name of RETIRED) {
    expect(css, `${theme} retired ${name}`).not.toContain(name);
  }
}

describe("theme contract", () => {
  it("glass defines the closed list", () => {
    const css = load("aetheris-glass/tokens.css");
    assertContract(css, "aetheris-glass", "dark");
  });

  it("prism defines the closed list", () => {
    const css = load("aetheris-prism/tokens.css");
    assertContract(css, "aetheris-prism", "light");
  });
});
