import * as path from "path";
import { parseObsidianVersions } from "wdio-obsidian-service";
import { env } from "process";

// wdio-obsidian-service downloads sandboxed Obsidian versions into this dir.
const cacheDir = path.resolve(".obsidian-cache");

const desktopVersions = await parseObsidianVersions(
	env.OBSIDIAN_VERSIONS ?? "latest/latest",
	{ cacheDir },
);

if (env.CI) {
	// Print the resolved Obsidian versions to use as the workflow cache key
	// (see .github/workflows/ci.yml).
	console.log("obsidian-cache-key:", JSON.stringify(desktopVersions));
}

export const config: WebdriverIO.Config = {
	runner: "local",
	framework: "mocha",

	specs: ["./test/specs/**/*.e2e.ts"],

	maxInstances: Number(env.WDIO_MAX_INSTANCES || 1),

	capabilities: desktopVersions.map<WebdriverIO.Capabilities>(([appVersion, installerVersion]) => ({
		browserName: "obsidian",
		"wdio:obsidianOptions": {
			appVersion,
			installerVersion,
			plugins: ["."],
			vault: "test/vaults/simple",
		},
	})),

	services: ["obsidian"],
	reporters: ["obsidian"],

	mochaOpts: {
		ui: "bdd",
		timeout: 60 * 1000,
		retries: env.CI ? 2 : 0,
	},

	waitforInterval: 250,
	waitforTimeout: 5 * 1000,
	logLevel: "warn",
	cacheDir: cacheDir,
	injectGlobals: false,
};
