import { defineConfig } from "cypress";
import react from "@vitejs/plugin-react";
import importMetaEnv from "@import-meta-env/unplugin";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  allowCypressEnv: false,
  component: {
    specPattern: ["**/*.cy.tsx"],
    devServer: {
      framework: "react",
      bundler: "vite",
      viteConfig: {
        plugins: [
          react(), 
          importMetaEnv.vite({ example: ".env.example", env: ".env.example" })
        ],
        resolve: {
          tsconfigPaths: true,
          alias: {
            "@": path.resolve(__dirname, "./src"),
          },
        },
        define: {
          'import.meta.env.VITE_AUTHENTICATION_PROVIDER': JSON.stringify('entra'),
        },
      },
    },
  },
});
