import { describe, expect, it } from "vitest";
import { buildWorkspace } from "./chrome";

describe("buildWorkspace", () => {
  it("builds desktop layers with empty wallpaper and empty widget layer", () => {
    const root = document.createElement("div");
    const hosts = buildWorkspace(root);
    expect(hosts.workspace.id).toBe("workspace");
    expect(hosts.wallpaper.id).toBe("wallpaper");
    expect(hosts.wallpaper.querySelector("img")).toBeNull();
    expect(hosts.widgetLayer.id).toBe("widget-layer");
    expect(hosts.widgetLayer.children.length).toBe(0);
    expect(hosts.floatLayer.id).toBe("float-layer");
    expect(hosts.snapPreview.id).toBe("snap-preview");
    expect(hosts.overlayDim.id).toBe("overlay-dim");
    expect(hosts.overlayHost.id).toBe("overlay-host");
    expect(hosts.taskbar.id).toBe("taskbar");
    expect(root.querySelector("#dock-row")).toBeNull();
    expect(root.querySelector("#topbar")).toBeNull();
    const kids = [...hosts.workspace.children].map((el) => el.id);
    expect(kids).toEqual([
      "wallpaper",
      "widget-layer",
      "float-layer",
      "taskbar",
      "overlay-dim",
      "overlay-host",
    ]);
    const dimIndex = kids.indexOf("overlay-dim");
    const hostIndex = kids.indexOf("overlay-host");
    const barIndex = kids.indexOf("taskbar");
    expect(hostIndex).toBeGreaterThan(dimIndex);
    expect(barIndex).toBeLessThan(dimIndex);
    expect(hosts.floatLayer.style.pointerEvents).toBe("none");
    expect(hosts.left).toBeUndefined();
  });
});
