import { fileURLToPath } from "node:url";
export const assetsDirectory = fileURLToPath(
  new URL("./dist/", import.meta.url),
);
export const engineDirectory = fileURLToPath(
  new URL("./dist/pkg/", import.meta.url),
);
