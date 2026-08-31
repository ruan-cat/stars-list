import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";

const themeRoot = fileURLToPath(new URL("./docs/.vitepress/theme", import.meta.url));

export default defineConfig({
	plugins: [vue()],
	resolve: {
		alias: {
			"@": themeRoot,
		},
	},
	test: {
		environment: "happy-dom",
		include: ["docs/.vitepress/theme/components/**/*.component.test.ts"],
		clearMocks: true,
		restoreMocks: true,
	},
});
