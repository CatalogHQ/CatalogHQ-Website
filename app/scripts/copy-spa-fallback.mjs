import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const distDir = resolve(import.meta.dirname, "..", "dist");
const indexPath = resolve(distDir, "index.html");
const fallbackPath = resolve(distDir, "404.html");

if (!existsSync(indexPath)) {
  console.error("copy-spa-fallback: dist/index.html not found. Run vite build first.");
  process.exit(1);
}

copyFileSync(indexPath, fallbackPath);
console.log("copy-spa-fallback: wrote dist/404.html for SPA reload support");
