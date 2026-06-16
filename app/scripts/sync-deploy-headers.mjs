import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildContentSecurityPolicy } from "./content-security-policy.mjs";

const appRoot = resolve(import.meta.dirname, "..");

function loadEnvFile(path) {
  try {
    const raw = readFileSync(path, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch {
    // Optional env files.
  }
}

loadEnvFile(resolve(appRoot, ".env"));
loadEnvFile(resolve(appRoot, ".env.production"));
loadEnvFile(resolve(appRoot, ".env.local"));

const apiUrl = process.env.VITE_API_URL;
const csp = buildContentSecurityPolicy(apiUrl);

const vercelPath = resolve(appRoot, "vercel.json");
const vercelConfig = JSON.parse(readFileSync(vercelPath, "utf8"));

for (const group of vercelConfig.headers ?? []) {
  for (const header of group.headers ?? []) {
    if (header.key === "Content-Security-Policy") {
      header.value = csp;
    }
  }
}

writeFileSync(vercelPath, `${JSON.stringify(vercelConfig, null, 2)}\n`);

const nginxPath = resolve(appRoot, "nginx.example.conf");
let nginx = readFileSync(nginxPath, "utf8");
nginx = nginx.replace(
  /add_header Content-Security-Policy "[^"]+" always;/,
  `add_header Content-Security-Policy "${csp}" always;`,
);
writeFileSync(nginxPath, nginx);

console.log(
  `sync-deploy-headers: CSP connect-src aligned with VITE_API_URL=${apiUrl ?? "(unset)"}`,
);
