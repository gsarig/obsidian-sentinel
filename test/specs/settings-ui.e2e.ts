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

// Find a clickable action row (e.g. "Add action", "Remove action") by its name.
async function actionRow(scope: WebdriverIO.Browser | WebdriverIO.Element, name: string): Promise<WebdriverIO.Element> {
	return scope.$(
		`.//div[${hasClass("setting-item")}][${hasClass("mod-action")}][.//div[${hasClass("setting-item-name")}][normalize-space()="${name}"]]`,
	);
}

async function actionContainers(): Promise<WebdriverIO.Element[]> {
	return Array.from(await $$(".sentinel--action-container"));
}

// Open Sentinel's settings tab and attach WebDriver to it. Obsidian 1.14+
// opens settings in a separate popout window by default (the
// `settingsPopoutWindow` vault config), and WebDriver only sees the DOM of
// the window it is attached to; older versions render a modal in the main
// window.
async function openSettings(): Promise<void> {
	const handlesBefore = await browser.getWindowHandles();
	await browser.executeObsidian(({ app }) => {
		const setting = (app as unknown as {
			setting: { open: () => void; openTabById: (id: string) => void };
		}).setting;
		setting.open();
		setting.openTabById("sentinel");
	});
	const settingsWindow = (await browser.getWindowHandles()).find((h) => !handlesBefore.includes(h));
	if (settingsWindow) {
		await browser.switchToWindow(settingsWindow);
	}
}

// Back to the main window before closing settings: the popout (if any) goes
// away on close, and later steps act on the vault.
async function closeSettings(mainWindow: string): Promise<void> {
	await browser.switchToWindow(mainWindow);
	await browser.executeObsidian(({ app }) => {
		(app as unknown as { setting: { close: () => void } }).setting.close();
	});
}

// The plugin's persisted data.json, as opposed to its in-memory settings.
async function savedActions(): Promise<Array<Record<string, unknown>>> {
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
	return saved.actions;
}

describe("Settings UI", function () {
	let mainWindow: string;

	beforeEach(async function () {
		mainWindow = await browser.getWindowHandle();
		await obsidianPage.resetVault("test/vaults/simple");
		await setActions([]);
	});

	afterEach(async function () {
		// A failed test can leave WebDriver attached to the settings popout,
		// where the Obsidian helpers below are not available.
		await browser.switchToWindow(mainWindow);
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
		await openSettings();

		const addRow = await actionRow(browser, "Add action");
		await addRow.waitForDisplayed({ timeout: 5000 });
		await addRow.click();

		await browser.waitUntil(async () => (await actionContainers()).length === 1, {
			timeout: 5000,
			timeoutMsg: "new action group never appeared",
		});
		const container = (await actionContainers())[0];

		const whenSelect = await settingControl(container, "When");
		await whenSelect.selectByAttribute("value", "everyOpen");

		const propertyNameInput = await settingControl(container, "Property name");
		await propertyNameInput.setValue("uiProp");

		const valueInput = await settingControl(container, "Value");
		await valueInput.setValue("fromUI");

		await closeSettings(mainWindow);

		// Persistence: proves data.json was actually written, not just an
		// in-memory settings object (the other specs seed actions directly
		// in memory via setActions(), which bypasses saveSettings/data.json).
		await browser.waitUntil(
			async () => (await savedActions()).some(
				(a) => a.propertyName === "uiProp" && a.propertyValue === "fromUI" && a.when === "everyOpen",
			),
			{ timeout: 5000, timeoutMsg: "the new action was never saved to data.json" },
		);

		await createNote("UI.md", "# UI\n");
		await openNote("UI.md");
		await waitForProperty("UI.md", "uiProp", "fromUI");
	});

	it("swaps the fields when What changes, and removes an action", async function () {
		await setActions([
			{ where: "", when: "everyOpen", what: "property", propertyName: "stale", propertyValue: "x" },
		]);
		await openSettings();

		await browser.waitUntil(async () => (await actionContainers()).length === 1, {
			timeout: 5000,
			timeoutMsg: "seeded action group never appeared",
		});
		const whatSelect = await settingControl((await actionContainers())[0], "What");
		await whatSelect.selectByAttribute("value", "command");

		// The group is rebuilt: the Command field replaces the property fields.
		await browser.waitUntil(
			async () => (await (await settingControl((await actionContainers())[0], "Command")).isExisting())
				&& !(await (await settingControl((await actionContainers())[0], "Property name")).isExisting()),
			{ timeout: 5000, timeoutMsg: "fields did not swap to the command layout" },
		);
		await closeSettings(mainWindow);

		// A stale property must never run once the action became a command.
		await browser.waitUntil(
			async () => {
				const [action] = await savedActions();
				return action?.what === "command" && action.propertyName === undefined && action.propertyValue === undefined;
			},
			{ timeout: 5000, timeoutMsg: "switching to a command did not clear the property fields" },
		);

		await openSettings();
		const removeRow = await actionRow((await actionContainers())[0], "Remove action");
		await removeRow.waitForDisplayed({ timeout: 5000 });
		await removeRow.click();
		await browser.waitUntil(async () => (await actionContainers()).length === 0, {
			timeout: 5000,
			timeoutMsg: "removed action group is still shown",
		});
		await closeSettings(mainWindow);
		expect(await savedActions()).toEqual([]);
	});
});
