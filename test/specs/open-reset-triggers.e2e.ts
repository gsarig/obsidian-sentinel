import { expect } from "@wdio/globals";
import { describe, it, beforeEach } from "mocha";
import { obsidianPage } from "wdio-obsidian-service";
import { setActions, createNote, openNote, closeNote, frontmatterOf, waitForProperty } from "./helpers.js";

describe("First-open triggers", function () {
	beforeEach(async function () {
		await obsidianPage.resetVault("test/vaults/simple");
		await setActions([]);
	});

	it("firstOpen fires only the first time a note is opened this session", async function () {
		await setActions([
			{ when: "firstOpen", what: "property", propertyName: "firstCount", propertyValue: "{{increment}}" },
			// Control: everyOpen increments on every open so we can tell the reopen was processed.
			{ when: "everyOpen", what: "property", propertyName: "everyCount", propertyValue: "{{increment}}" },
		]);
		const note = "fo-note.md";
		await createNote(note, "# F\n");
		await createNote("fo-scratch.md", "# S\n");

		await openNote(note);
		await waitForProperty(note, "everyCount", 1);

		await openNote("fo-scratch.md");
		await openNote(note);
		await waitForProperty(note, "everyCount", 2); // reopen processed

		expect((await frontmatterOf(note))?.firstCount).toBe(1); // firstOpen fired once
	});

	it("firstOpenWithReset fires again after the note is closed and reopened", async function () {
		await setActions([
			{ when: "firstOpenWithReset", what: "property", propertyName: "opens", propertyValue: "{{increment}}" },
		]);
		const note = "fowr-note.md";
		await createNote(note, "# F\n");

		await openNote(note);
		await waitForProperty(note, "opens", 1);

		await closeNote(note);
		await openNote(note);
		await waitForProperty(note, "opens", 2);
	});
});
