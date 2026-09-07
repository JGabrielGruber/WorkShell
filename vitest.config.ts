import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    passWithNoTests: true,
    include: ["packages/**/*.test.ts", "apps/**/*.test.ts"],
  },
});
