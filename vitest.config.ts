import { defineConfig } from "vitest/config";
import { WxtVitest } from "wxt/testing/vitest-plugin";

export default defineConfig({
	plugins: [WxtVitest()],
	test: {
		setupFiles: ["./vitest.setup.ts"],
		include: ["src/**/*.test.ts", "entrypoints/**/*.test.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "html", "lcov"],
			reportsDirectory: "./coverage",
			include: ["src/**/*.ts", "entrypoints/**/*.ts"],
			exclude: [
				"**/*.test.ts",
				"**/types.ts",
				"entrypoints/popup/main.ts",
				"entrypoints/welcome/main.ts",
			],
			thresholds: {
				// Global minimum threshold
				lines: 70,
				functions: 70,
				branches: 70,
				statements: 70,
			},
		},
	},
});
