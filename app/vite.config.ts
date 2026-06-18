import path from "path"
import { createRequire } from "node:module"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv, type PluginOption } from "vite"

const require = createRequire(import.meta.url)
const { buildCspMetaTag } = require("./scripts/content-security-policy.mjs") as {
  buildCspMetaTag: (
    apiUrl?: string,
    options?: { allowDataImages?: boolean },
  ) => string
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const isDev = mode === "development"
  const siteUrl = (env.VITE_SITE_URL || "https://cataloghq.store").replace(
    /\/$/,
    "",
  )
  const cspMetaTag = buildCspMetaTag(env.VITE_API_URL, {
    allowDataImages: isDev,
  })
  const inspectPlugin: PluginOption | null = isDev
    ? (require("kimi-plugin-inspect-react") as { inspectAttr: () => PluginOption }).inspectAttr()
    : null

  return {
  base: "/",
  appType: "spa",
  plugins: [
    ...(inspectPlugin ? [inspectPlugin] : []),
    react(),
    {
      name: "inject-csp-meta",
      transformIndexHtml(html) {
        let next = html.replaceAll("__CATALOGHQ_SITE_URL__", siteUrl)
        if (next.includes('http-equiv="Content-Security-Policy"')) {
          return next
        }
        return next.replace("<head>", `<head>\n    ${cspMetaTag}`)
      },
    },
  ],
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  preview: {
    port: 4173,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  };
});
