import path from "node:path";
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const config = {
    publicDir: "packages/assets",
    plugins: [solid()],
    resolve: {
      alias: {
        "@app": path.resolve(__dirname, "./apps/frontend"),
        "@pkgs": path.resolve(__dirname, "./packages"),
      },
    },
    clearScreen: false,
    server: {
      port: 1420,
      strictPort: true,
      host: host || false,
      hmr: host
        ? {
            protocol: "ws",
            host,
            port: 1421,
          }
        : undefined,
      watch: {
        ignored: ["**/apps/backend/**"],
      },
    },
  };

  if (mode === "tauri") return config;
  if (mode === "gh-pages") return { ...config, base: "/chromatic-poe/" };

  return config;
});
