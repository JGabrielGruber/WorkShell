import { describe, expect, it } from "vitest";
import { UrlHistory } from "./history";

describe("UrlHistory", () => {
  it("pushes, backs, forwards, and truncates", () => {
    const h = new UrlHistory("probe:/");
    expect(h.current).toBe("probe:/");
    h.push("probe:/fields");
    expect(h.current).toBe("probe:/fields");
    expect(h.back()).toBe("probe:/");
    expect(h.back()).toBeNull();
    expect(h.forward()).toBe("probe:/fields");
    expect(h.forward()).toBeNull();
    h.back();
    h.push("probe:/tabs");
    expect(h.forward()).toBeNull();
    expect(h.current).toBe("probe:/tabs");
  });
});
