/// <reference types="vitest" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import importMetaEnv from "@import-meta-env/unplugin";
import path from "path";

let envFile = ".env";
switch (process.env.NODE_ENV) {
  case "development":
    envFile = ".env.local";
    break;
  case "test":
    envFile = ".env.example";
    break;
  case "production":
    envFile = ".env";
    break;
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const useSSL = env.VITE_USE_DEV_SERVER_SSL === "true";
  const serverConfig = {
    host: true,
    port: 3000,
    strictPort: true,
    ...(useSSL
      ? {
          https: {
            key: "./certs/localhost-key.pem",
            cert: "./certs/localhost-cert.pem",
          },
        }
      : {}),
  };
  return {
    plugins: [
      react(),
      importMetaEnv.vite({ example: ".env.example", env: envFile }),
    ],
    build: {
      outDir: "build",
    },
    optimizeDeps: {},
    resolve: {
      tsconfigPaths: true,
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./vitest.setup.ts",
      typecheck: {
        tsconfig: "./tsconfig.vitest.json",
      },
      pool: "forks",
      forks: {
        singleFork: true,
      },
    },
    server: serverConfig,
  };
});
