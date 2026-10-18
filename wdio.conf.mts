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

	// 10 parallel Obsidian instances by default locally (measured flake-free,
	// ~8x faster than sequential); CI pins its own value via the env var.
	maxInstances: Number(env.WDIO_MAX_INSTANCES || 10),

	capabilities: [
		...desktopVersions.map<WebdriverIO.Capabilities>(([appVersion, installerVersion]) => ({
			browserName: "obsidian",
			"wdio:obsidianOptions": {
				appVersion,
				installerVersion,
				plugins: ["."],
				vault: "test/vaults/simple",
			},
		})),
		// The plugin is not desktop-only, so the suite also runs once in
		// Obsidian's mobile emulation (phone layout) on the newest version.
		// It emulates the mobile UI on the desktop app, not the real mobile
		// runtime, which is enough while the plugin avoids Node/Electron APIs.
		{
			browserName: "obsidian",
			"wdio:obsidianOptions": {
				appVersion: desktopVersions[desktopVersions.length - 1][0],
				installerVersion: desktopVersions[desktopVersions.length - 1][1],
				emulateMobile: true,
				plugins: ["."],
				vault: "test/vaults/simple",
			},
			"goog:chromeOptions": {
				mobileEmulation: {
					deviceMetrics: { width: 390, height: 844 },
				},
			},
		},
	],

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
