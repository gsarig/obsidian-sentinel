import { browser, expect } from "@wdio/globals";
import { describe, it, beforeEach } from "mocha";
import { obsidianPage } from "wdio-obsidian-service";
import { setActions, createNote, openNote, frontmatterOf, waitForProperty, momentToken } from "./helpers.js";

describe("Set property values", function () {
	beforeEach(async function () {
		await obsidianPage.resetVault("test/vaults/simple");
		await setActions([]);
	});

	it("writes a hardcoded value", async function () {
		await setActions([
			{ when: "everyOpen", what: "property", propertyName: "status", propertyValue: "reviewed" },
		]);
		await createNote("Note.md", "# Note\n");
		await openNote("Note.md");
		await waitForProperty("Note.md", "status", "reviewed");
	});

	it("resolves {{title}} to the note basename", async function () {
		await setActions([
			{ when: "everyOpen", what: "property", propertyName: "heading", propertyValue: "{{title}}" },
		]);
		await createNote("MyTitle.md", "# X\n");
		await openNote("MyTitle.md");
		await waitForProperty("MyTitle.md", "heading", "MyTitle");
	});

	it("resolves {{date}} to today", async function () {
		const today = await momentToken("YYYY-MM-DD");
		await setActions([
			{ when: "everyOpen", what: "property", propertyName: "created", propertyValue: "{{date}}" },
		]);
		await createNote("Dated.md", "# D\n");
		await openNote("Dated.md");
		await waitForProperty("Dated.md", "created", today);
	});

	it("resolves {{time}} to the current time", async function () {
		const before = await momentToken("HH:mm");
		await setActions([
			{ when: "everyOpen", what: "property", propertyName: "openedAt", propertyValue: "{{time}}" },
		]);
		await createNote("Timed.md", "# T\n");
		await openNote("Timed.md");
		await browser.waitUntil(
			async () => (await frontmatterOf("Timed.md"))?.openedAt !== undefined,
			{ timeout: 5000, interval: 100, timeoutMsg: "Timed.md property \"openedAt\" was never set" },
		);
		const after = await momentToken("HH:mm");
		// Guards the minute-boundary race: accept either sample.
		expect([before, after]).toContain((await frontmatterOf("Timed.md"))?.openedAt);
	});

	it("overwrites an existing property by default", async function () {
		await setActions([
			{ when: "everyOpen", what: "property", propertyName: "status", propertyValue: "new" },
		]);
		await createNote("Over.md", "---\nstatus: original\n---\n# O\n");
		await openNote("Over.md");
		await waitForProperty("Over.md", "status", "new");
	});

	it("keeps an existing property when skipExisting is set", async function () {
		await setActions([
			{ when: "everyOpen", what: "property", propertyName: "status", propertyValue: "new", skipExisting: true },
			// Control: proves the trigger fired, so the assertion below is meaningful.
			{ when: "everyOpen", what: "property", propertyName: "touched", propertyValue: "yes" },
		]);
		await createNote("Keep.md", "---\nstatus: original\n---\n# K\n");
		await openNote("Keep.md");
		await waitForProperty("Keep.md", "touched", "yes");
		expect((await frontmatterOf("Keep.md"))?.status).toBe("original");
	});
});
