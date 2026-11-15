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
  api.session_create_chart(0, 0, 0, 0, 1, "column");
  api.session_open(api.session_save());
  const chart = JSON.parse(api.session_chart_defs(0))[0];
  chart.title = "Retitled after reopening";
  api.session_set_chart(0, 0, JSON.stringify(chart));
  api.session_open(api.session_save());
  const charts = JSON.parse(api.session_chart_defs(0));
  assert.equal(charts.length, 1);
  assert.equal(charts[0].title, "Retitled after reopening");
  api.session_create_chart(0, 0, 0, 0, 1, "pie");
  api.session_open(api.session_save());
  assert.deepEqual(JSON.parse(api.session_chart_defs(0)).map(c => c.kind), ["column", "pie"]);
});


test("canvas pie wedges convert degrees to radians without drawing full circles", async () => {
  const source = (await read("editor.paintlist.js")).replace('import { fontStack } from "./editor.paint.js";', 'const fontStack = value => value;');
  const { paintList } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
  const arcs = [];
  const ctx = { save() {}, restore() {}, beginPath() {}, closePath() {}, fill() {}, moveTo() {}, arc(...args) { arcs.push(args); } };
  paintList(ctx, { items: [
    { wedge: { center: { x: 150, y: 150 }, radius: 150, innerRadius: 0, from: 0, sweep: 90, fill: "0000FF" } },
    { wedge: { center: { x: 150, y: 150 }, radius: 150, innerRadius: 75, from: 90, sweep: 270, fill: "FF0000" } },
  ] });
  assert.equal(arcs[0][3], -Math.PI / 2);
  assert.equal(arcs[0][4], 0);
  assert.equal(arcs[1][3], 0);
  assert.equal(arcs[1][4], Math.PI * 1.5);
  assert.equal(arcs[2][5], true);
});
