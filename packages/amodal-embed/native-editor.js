export async function mountEditor(host, options) {
  const base = new URL(options.assetsUrl, location.href);
  if (base.origin !== location.origin)
    throw new Error("Editor assets must be same-origin");
  await import(new URL("embed.js", base));
  const sheet = document.createElement("opencalc-sheet");
  sheet.setAttribute("assets-url", base.href);
  sheet.style.cssText = "display:block;width:100%;height:100%;min-height:400px";
  host.replaceChildren(sheet);
  const editor = await sheet.ready;
  options.signal.throwIfAborted();
  sheet.chrome({ header: false });
  sheet.setColorScheme(options.theme ?? "light");
  const statusHost = sheet.shadowRoot.querySelector(".bottom-status");
  statusHost?.replaceChildren();
  const listeners = new Set();
  let last = editor.wasmApi().session_edits_applied();
  let opening = false;
  const revision = () => editor.wasmApi().session_edits_applied();
  const check = () => {
    const next = revision();
    if (next !== last) {
      last = next;
      if (!opening) for (const fn of listeners) fn();
    }
  };
  const timer = setInterval(check, 100);
  const observer = new ResizeObserver(() => {
    editor.invalidateTrackSize();
    editor.resize();
  });
  observer.observe(host);
  const stop = await sheet.on("cellsChanged", check);
  const destroy = () => {
    clearInterval(timer);
    observer.disconnect();
    stop();
    listeners.clear();
    sheet.remove();
  };
  options.signal.addEventListener("abort", destroy, { once: true });
  return {
    root: sheet,
    revision,
    statusHost,
    setTheme(theme) {
      sheet.setColorScheme(theme);
    },
    async open(bytes, name) {
      opening = true;
      try {
        await sheet.open(bytes, name);
        last = revision();
      } finally {
        opening = false;
      }
    },
    exportXlsx() {
      check();
      return { bytes: editor.wasmApi().session_save() };
    },
    markSaved() {},
    destroy,
    session: {
      on(name, fn) {
        listeners.add(fn);
        return () => listeners.delete(fn);
      },
    },
  };
}
