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
    include: [
      "src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "testing/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"
    ],
    exclude: ["node_modules/", "dist/", "build/", "supabase/"],
    outputFile: {
      html: "./testing/reports/test-report.html",
      junit: "./testing/reports/junit.xml",
      json: "./testing/reports/test-results.json"
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov", "cobertura"],
      exclude: [
        "node_modules/",
        "testing/utils/",
        "testing/fixtures/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/coverage/**",
        "dist/",
        "build/",
        "supabase/",
        "Junk/",
      ],
      reportsDirectory: "./testing/coverage",
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    },
    pool: 'forks',
  },
}));
