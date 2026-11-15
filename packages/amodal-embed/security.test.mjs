import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read = (name) =>
  readFile(new URL("dist/" + name, import.meta.url), "utf8");
test("distributed embed enforces network and script restrictions regardless of URL mode", async () => {
  const core = await read("editor.core.js"),
    paint = await read("editor.paint.js");
  assert.match(
    core,
    /canRunMacros: false, canUseNetwork: false, networkAllowlist: \[\], canShare: false/,
  );
  assert.match(core, /throw new Error\("Collaboration is owned by Amodal"\)/);
  assert.match(paint, /registerSuppliedFonts\(\) \{ return;/);
  assert.match(paint, /const desktop = false/);
  assert.doesNotMatch(core, /await initDrafts\(\)/);
  assert.match(await read("editor.js"), /editor.core.js/);
  assert.match(
    await read("native-editor.js"),
    /Editor assets must be same-origin/,
  );
});
test("matching packaged engine calculates, saves and reopens without network imports", async () => {
  const binary = await readFile(
    new URL("dist/pkg/casual_calc_wasm_bg.wasm", import.meta.url),
  );
  const imports = WebAssembly.Module.imports(new WebAssembly.Module(binary));
  assert.ok(
    imports.every(
      (x) => !/fetch|socket|network|file|process|eval/i.test(x.name),
    ),
  );
  const api = await import("./dist/pkg/casual_calc_wasm.js");
  await api.default({ module_or_path: binary });
  api.session_new();
  api.session_set_cell(0, 0, 0, "5");
  api.session_set_cell(0, 0, 1, "=A1*3");
  const bytes = api.session_save();
  api.session_open(bytes);
  assert.equal(api.session_cell_input(0, 0, 1), "=A1*3");
  assert.equal(JSON.parse(api.session_cells(0, 0, 0, 0, 1))[1].t, "15");
});
