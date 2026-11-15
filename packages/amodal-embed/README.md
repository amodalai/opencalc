# Amodal OpenCalc

Amodal's maintained OpenCalc distribution: a native, shadow-scoped spreadsheet
editor and matching WebAssembly engine. Apache-2.0; derived from CasualOffice/OpenCalc.

`assetsDirectory` identifies the self-hosted browser assets; `engineDirectory`
identifies the matching Node-compatible WASM files. Serve the browser files from
the application's own origin, and import `native-editor.js` from that asset URL.
The adapter exposes `mountEditor(host, {assetsUrl, theme, signal})`, `open`,
`exportXlsx`, `revision`, `setTheme`, a save-status slot, change events and teardown.
The host owns storage, access checks, conflict handling and autosave.

Embedded macros, custom-function network access, URL-supplied fonts, third-party
collaboration and standalone recovery drafts are disabled. Normal cell editing,
formulas, formatting, charts and workbook import/export remain available. This
is one editor per page; replacing its workbook must be coordinated by the host.

Build from the repository with `node packages/amodal-embed/build.mjs` after
building `crates/casual-calc-wasm` using wasm-pack. Run
`node --test packages/amodal-embed/security.test.mjs` before releasing.
