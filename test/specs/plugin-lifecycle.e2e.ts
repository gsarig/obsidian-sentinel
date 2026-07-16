import { browser, expect } from "@wdio/globals";
import { describe, it, beforeEach, afterEach } from "mocha";
import { obsidianPage } from "wdio-obsidian-service";
import { createNote, openNote, waitForProperty, frontmatterOf } from "./helpers.js";

type SavedAction = { where?: string; when: string; what: string; propertyName?: string; propertyValue?: string };

// Seed actions through the plugin's own saveSettings, so they land in
// data.json and survive a disable/re-enable cycle, unlike setActions()
// (used elsewhere), which only mutates the live in-memory settings object.
async function seedActions(actions: SavedAction[]): Promise<void> {
	await browser.executeObsidian(({ app }, actions) => {
		const plugin = (app as unknown as {
			plugins: {
				plugins: Record<string, {
					settings: { actions: unknown[] };
					saveSettings: () => Promise<void>;
				}>;
			};
		}).plugins.plugins["sentinel"];
		plugin.settings.actions = actions;
		return plugin.saveSettings();
	}, actions);
}

async function disablePlugin(): Promise<void> {
	await browser.executeObsidian(({ app }) => {
		return (app as unknown as {
			plugins: { disablePlugin: (id: string) => Promise<void> };
		}).plugins.disablePlugin("sentinel");
	});
}

async function enablePlugin(): Promise<void> {
	await browser.executeObsidian(({ app }) => {
		return (app as unknown as {
			plugins: { enablePlugin: (id: string) => Promise<void> };
		}).plugins.enablePlugin("sentinel");
	});
}

describe("Plugin lifecycle", function () {
	beforeEach(async function () {
		await obsidianPage.resetVault("test/vaults/simple");
		await seedActions([]);
	});

	afterEach(async function () {
		// Guard against a failed assertion leaving the plugin disabled for
		// whichever spec runs next.
		await enablePlugin().catch(() => {});
	});

	it("stops firing on disable and resumes on re-enable, without an orphaned listener", async function () {
		await seedActions([
			{ when: "everyOpen", what: "property", propertyName: "touched", propertyValue: "yes" },
		]);
		await createNote("A.md", "# A\n");
		await openNote("A.md");
		await waitForProperty("A.md", "touched", "yes");

		await disablePlugin();

		// With the listener leak, the orphaned active-leaf-change handler
		// from the disabled instance still fires and would set this
		// property; after the fix, no listener remains registered.
		await createNote("C.md", "# C\n");
		await openNote("C.md");
		await browser.pause(1000);
		expect((await frontmatterOf("C.md"))?.touched).toBe(undefined);

		await enablePlugin();
		// Re-enabling loads a fresh plugin instance from data.json; re-seed
		// explicitly rather than relying on what was already saved.
		await seedActions([
			{ when: "everyOpen", what: "property", propertyName: "touched", propertyValue: "yes" },
		]);

		await createNote("D.md", "# D\n");
		await openNote("D.md");
		await waitForProperty("D.md", "touched", "yes");
	});
});
