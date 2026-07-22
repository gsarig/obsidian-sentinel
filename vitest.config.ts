import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// The tested logic imports the `obsidian` module. Alias it to a light mock so
// the unit suite runs without a real Obsidian runtime.
export default defineConfig({
	resolve: {
		alias: {
			obsidian: fileURLToPath(new URL('./test/mocks/obsidian.ts', import.meta.url)),
		},
	},
	test: {
		include: ['test/**/*.test.ts'],
	},
});
