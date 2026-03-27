var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// _worker.js/index.js
import { r as renderers } from "./chunks/_@astro-renderers_BRjisKD6.mjs";
import { c as createExports, s as serverEntrypointModule } from "./chunks/_@astrojs-ssr-adapter_Dz5pBF3X.mjs";
import { manifest } from "./manifest_CI3bmN52.mjs";
globalThis.process ??= {};
globalThis.process.env ??= {};
var serverIslandMap = /* @__PURE__ */ new Map();
var _page0 = /* @__PURE__ */ __name(() => import("./pages/404.astro.mjs"), "_page0");
var _page1 = /* @__PURE__ */ __name(() => import("./pages/about.astro.mjs"), "_page1");
var _page2 = /* @__PURE__ */ __name(() => import("./pages/archive.astro.mjs"), "_page2");
var _page3 = /* @__PURE__ */ __name(() => import("./pages/friends.astro.mjs"), "_page3");
var _page4 = /* @__PURE__ */ __name(() => import("./pages/posts/_---slug_.astro.mjs"), "_page4");
var _page5 = /* @__PURE__ */ __name(() => import("./pages/robots.txt.astro.mjs"), "_page5");
var _page6 = /* @__PURE__ */ __name(() => import("./pages/rss.xml.astro.mjs"), "_page6");
var _page7 = /* @__PURE__ */ __name(() => import("./pages/_---page_.astro.mjs"), "_page7");
var pageMap = /* @__PURE__ */ new Map([
  ["src/pages/404.astro", _page0],
  ["src/pages/about.astro", _page1],
  ["src/pages/archive.astro", _page2],
  ["src/pages/friends.astro", _page3],
  ["src/pages/posts/[...slug].astro", _page4],
  ["src/pages/robots.txt.ts", _page5],
  ["src/pages/rss.xml.ts", _page6],
  ["src/pages/[...page].astro", _page7]
]);
var _manifest = Object.assign(manifest, {
  pageMap,
  serverIslandMap,
  renderers,
  actions: /* @__PURE__ */ __name(() => import("./noop-entrypoint.mjs"), "actions"),
  middleware: /* @__PURE__ */ __name(() => import("./_astro-internal_middleware.mjs"), "middleware")
});
var _args = void 0;
var _exports = createExports(_manifest);
var __astrojsSsrVirtualEntry = _exports.default;
var _start = "start";
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) {
  serverEntrypointModule[_start](_manifest, _args);
}
export {
  __astrojsSsrVirtualEntry as default,
  pageMap
};
//# sourceMappingURL=bundledWorker-0.3223279243294994.mjs.map
