import { expect } from "@wdio/globals";
import { describe, it, beforeEach } from "mocha";
import { obsidianPage } from "wdio-obsidian-service";
import { setActions, createNote, openNote, openNoteInNewTab, closeNote, frontmatterOf, waitForProperty } from "./helpers.js";

describe("Close trigger", function () {
	beforeEach(async function () {
		await obsidianPage.resetVault("test/vaults/simple");
		await setActions([]);
	});

	it("everyClose fires when a note is actually closed", async function () {
		await setActions([
			{ when: "everyClose", what: "property", propertyName: "closed", propertyValue: "yes" },
		]);
		await createNote("A.md", "# A\n");
		await openNote("A.md");
		await closeNote("A.md");
		await waitForProperty("A.md", "closed", "yes");
	});

	it("everyClose does not fire on a tab-switch while the note stays open", async function () {
		await setActions([
			// Control: everyLeave fires on the switch, everyClose should not.
			{ when: "everyLeave", what: "property", propertyName: "left", propertyValue: "yes" },
			{ when: "everyClose", what: "property", propertyName: "closed", propertyValue: "yes" },
		]);
		await createNote("A.md", "# A\n");
		await createNote("B.md", "# B\n");
		await openNote("A.md");
		await openNoteInNewTab("B.md"); // A stays open in its own tab
		await waitForProperty("A.md", "left", "yes");
		expect((await frontmatterOf("A.md"))?.closed).toBe(undefined);
	});
});
