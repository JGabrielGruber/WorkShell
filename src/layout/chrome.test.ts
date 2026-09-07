import { describe, expect, it } from "vitest";
import { buildWorkspace } from "./chrome";

describe("buildWorkspace", () => {
  it("builds slots, float layer, overlay host above dim, and taskbar", () => {
    const root = document.createElement("div");
    const hosts = buildWorkspace(root);
    expect(hosts.workspace.id).toBe("workspace");
    expect(hosts.left.id).toBe("dock-left");
    expect(hosts.center.id).toBe("dock-center");
    expect(hosts.right.id).toBe("dock-right");
    expect(hosts.floatLayer.id).toBe("float-layer");
    expect(hosts.snapPreview.id).toBe("snap-preview");
    expect(hosts.overlayDim.id).toBe("overlay-dim");
    expect(hosts.overlayHost.id).toBe("overlay-host");
    expect(hosts.taskbar.id).toBe("taskbar");
    expect(root.querySelector("#topbar")?.textContent).toContain("PROJTHREAD OS // ENGINE CORE");
    const dimIndex = [...hosts.workspace.children].indexOf(hosts.overlayDim);
    const hostIndex = [...hosts.workspace.children].indexOf(hosts.overlayHost);
    expect(hostIndex).toBeGreaterThan(dimIndex);
    expect(hosts.floatLayer.style.pointerEvents).toBe("none");
  });
});
