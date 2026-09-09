import { Navigator } from "@workshell/navigator";
import { probeApp } from "./app";

export function mountProbe(host: HTMLElement): Navigator {
  const nav = new Navigator(host, { initialUrl: "probe:/" });
  nav.register(probeApp);
  return nav;
}
