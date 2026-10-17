import { $, $$, browser, expect } from "@wdio/globals";
import { describe, it, beforeEach, afterEach } from "mocha";
import { obsidianPage } from "wdio-obsidian-service";
import { setActions, createNote, openNote, waitForProperty } from "./helpers.js";

// Match a setting-item's exact class token, not a substring (e.g. avoid
// "setting-item-name" matching a "setting-item" lookup).
function hasClass(cls: string): string {
	return `contains(concat(' ', normalize-space(@class), ' '), ' ${cls} ')`;
}

// Within a rendered action container, find the input/select control that
// belongs to the setting-item whose visible name matches.
async function settingControl(container: WebdriverIO.Element, name: string): Promise<WebdriverIO.Element> {
	return container.$(
		`.//div[${hasClass("setting-item")}][.//div[${hasClass("setting-item-name")}][normalize-space()="${name}"]]//*[self::input or self::select]`,
	);
}

describe("Settings UI", function () {
	beforeEach(async function () {
		await obsidianPage.resetVault("test/vaults/simple");
		await setActions([]);
	});

	afterEach(async function () {
		// This spec (uniquely) writes through the real settings UI to
		// data.json, so a plain in-memory reset is not enough cleanup.
		await browser.executeObsidian(({ app }) => {
			const plugin = (app as unknown as {
				plugins: {
					plugins: Record<string, {
						settings: { actions: unknown[] };
						saveSettings: () => Promise<void>;
					}>;
				};
			}).plugins.plugins["sentinel"];
			plugin.settings.actions = [];
			return plugin.saveSettings();
		});
	});

	it("creates an action through the settings form, persists it, and it fires", async function () {
		await browser.executeObsidian(({ app }) => {
			const setting = (app as unknown as {
				setting: { open: () => void; openTabById: (id: string) => void };
			}).setting;
			setting.open();
			setting.openTabById("sentinel");
		});

		const addButton = await $("button=Add action");
		await addButton.waitForDisplayed({ timeout: 5000 });
		await addButton.click();

		await browser.waitUntil(async () => (await $$(".sentinel--action-container")).length === 1, {
			timeout: 5000,
			timeoutMsg: "new action container never appeared",
		});
		const container = (await $$(".sentinel--action-container"))[0];

		const whenSelect = await settingControl(container, "When");
		await whenSelect.selectByAttribute("value", "everyOpen");

		const propertyNameInput = await settingControl(container, "Property name");
		await propertyNameInput.setValue("uiProp");

		const valueInput = await settingControl(container, "Value");
		await valueInput.setValue("fromUI");

		await browser.executeObsidian(({ app }) => {
			(app as unknown as { setting: { close: () => void } }).setting.close();
		});

		// Persistence: proves data.json was actually written, not just an
		// in-memory settings object (the other specs seed actions directly
		// in memory via setActions(), which bypasses saveSettings/data.json).
		const saved = await browser.executeObsidian(({ app }) => {
			const plugin = (app as unknown as {
				plugins: {
					plugins: Record<string, {
						loadData: () => Promise<{ actions: Array<Record<string, unknown>> }>;
					}>;
				};
			}).plugins.plugins["sentinel"];
			return plugin.loadData();
		});
		expect(
			saved.actions.some(
				(a) => a.propertyName === "uiProp" && a.propertyValue === "fromUI" && a.when === "everyOpen",
			),
		).toBe(true);

		await createNote("UI.md", "# UI\n");
		await openNote("UI.md");
		await waitForProperty("UI.md", "uiProp", "fromUI");
	});
});
