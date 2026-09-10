import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createTheme } from "./theme";

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "base/tokens.css"),
  "utf8",
);

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
  "--color-muted",
  "--font-sans",
  "--font-display",
  "--font-mono",
  "--font-serif",
  "--text-xs",
  "--text-sm",
  "--text-md",
  "--text-lg",
  "--text-xl",
  "--leading",
  "--tracking",
  "--radius-box",
  "--radius-field",
  "--radius-selector",
  "--border",
  "--shadow-sm",
  "--shadow",
  "--shadow-md",
  "--shadow-lg",
  "--shadow-inner",
  "--blur",
  "--blur-sm",
  "--wallpaper",
  "--space-2",
  "--space-4",
  "--space-6",
  "--space-8",
  "--space-12",
  "--space-16",
  "--space-24",
] as const;

const GEOMETRY = ["--taskbar-h", "--taskbar-gap", "--left-w", "--right-w"];

describe("base tokens", () => {
  it("defines the closed list on [data-theme=base]", () => {
    expect(css).not.toMatch(/:root/);
    expect(css).toContain('[data-theme="base"]');
    expect(css).toContain("color-scheme: light");
    for (const name of CONTRACT_VARS) {
      expect(css, `missing ${name}`).toContain(name);
    }
    for (const name of GEOMETRY) {
      expect(css, `must not define ${name}`).not.toContain(name);
    }
    expect(css).not.toMatch(/--glass/);
    expect(css).toMatch(/--wallpaper:\s*none/);
    expect(css).not.toMatch(/url\(/);
    expect(css).toMatch(/--radius-box:\s*0/);
    expect(css).toMatch(/--radius-field:\s*0/);
    expect(css).toMatch(/--radius-selector:\s*0/);
    expect(css).toMatch(/--blur:\s*0px/);
    expect(css).toMatch(/--blur-sm:\s*0px/);
  });

  it("inspect(base) matches --color-* literals in tokens.css", () => {
    const names = CONTRACT_VARS.filter((n) => n.startsWith("--color-"));
    const inspected = createTheme().inspect("base").colors;
    expect(inspected.map((c) => c.token)).toEqual([...names]);
    for (const { token, value } of inspected) {
      expect(css, `css missing ${token}: ${value}`).toContain(`${token}: ${value}`);
    }
  });
});
