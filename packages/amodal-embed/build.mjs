import { cp, readFile, writeFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
const root = fileURLToPath(new URL("../../", import.meta.url));
execFileSync(process.execPath, ["sdk/build-packages.mjs"], {
  cwd: root,
  stdio: "inherit",
});
const dist = new URL("./dist/", import.meta.url);
await rm(dist, { recursive: true, force: true });
await cp(root + "sdk/packages/sheet/dist", dist, { recursive: true });
async function patch(name, from, to) {
  const file = new URL(name, dist);
  const text = await readFile(file, "utf8");
  if (!text.includes(from))
    throw new Error("Security patch no longer matches: " + name);
  await writeFile(file, text.replace(from, to));
}
await patch(
  "editor.core.js",
  "const caps = { ...preset, ...capabilityOverrides };",
  'const caps = { ...preset, ...capabilityOverrides, canRunMacros: false, canUseNetwork: false, networkAllowlist: [], canShare: false, ownsFile: true, chrome: "embedded" };',
);
await patch(
  "editor.core.js",
  "export async function collaborate({ url, token, document: documentKey, onStatus, onDocument, onPresence } = {}) {",
  'export async function collaborate({ url, token, document: documentKey, onStatus, onDocument, onPresence } = {}) { throw new Error("Collaboration is owned by Amodal");',
);
await patch(
  "editor.paint.js",
  "export async function registerSuppliedFonts() {",
  "export async function registerSuppliedFonts() { return;",
);
await patch(
  "editor.paint.js",
  'const desktop = typeof window !== "undefined" && (window.__TAURI__ || window.__opencalcNative);',
  "const desktop = false;",
);
await writeFile(new URL("pkg/package.json", dist), '{"type":"module"}\n');
await writeFile(
  new URL("amodal-build.json", dist),
  JSON.stringify({
    source: execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: root,
      encoding: "utf8",
    }).trim(),
    version: "0.1.0",
  }),
);
for (const name of ["LICENSE", "NOTICE"]) {
  try {
    await cp(root + name, new URL(name, import.meta.url));
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
}
await patch(
  "editor.core.js",
  'await initDrafts().catch((err) => console.error("[opencalc] drafts", err));',
  "// Amodal owns drafts and artifact persistence.",
);
await cp(
  new URL("./native-editor.js", import.meta.url),
  new URL("native-editor.js", dist),
);
