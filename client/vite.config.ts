/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({}) => ({
  server: {
    host: "::", // Listen on all IPv4 and IPv6 addresses
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@testing": path.resolve(__dirname, "./testing"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./testing/utils/setup.ts"],
    include: ["testing/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: ["node_modules/", "dist/", "build/"],
    coverage: {
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "testing/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/coverage/**",
        "dist/",
        "build/",
      ],
      reportsDirectory: "./testing/coverage",
    },
    pool: 'forks',
  },
}));
