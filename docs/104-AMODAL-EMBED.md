# 104 — Amodal embedding

The host owns persistence, version checks, and user/agent edit locks. Publish a
self-contained maintained package from the SDK distribution, with JavaScript
and WASM from the same commit. No iframe: use OpenCalc's shadow-root element.

In this distribution, enforce no macros, no custom-function execution, no
upstream collaboration, and no external font service regardless of page query
parameters. Fonts and engine assets are hosted with the application. These are
functional policy restrictions, not a claim that shadow DOM isolates code.
Normal formulas and native edits remain available. The host saves XLSX bytes
and owns conflict recovery. Do not reload after the host acknowledges a save,
so native undo history survives.

Verify the distributed package, not merely the source checkout. Check network
policy transforms, module completeness, formula/save/reopen behavior and the
embedded editor in a browser. Publishing the package is a separate release.

The adapter observes the artifact container size, so mounting in a closed panel
and subsequently opening or resizing it repaints the canvas. It exposes a footer
slot for the host's save state, replacing the standalone "nothing uploaded" claim.
The Amodal package is released independently with `amodal-v<version>` tags using
`.github/workflows/release-amodal.yml` and the `release` environment's `NPM_TOKEN`.
The workflow builds matching engine bindings, checks the restrictions and a
formula save/reopen, and publishes only `@amodalai/opencalc` with provenance.
