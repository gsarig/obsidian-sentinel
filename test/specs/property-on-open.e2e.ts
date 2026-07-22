import { browser, expect } from "@wdio/globals";
import { describe, it, beforeEach } from "mocha";
import { obsidianPage } from "wdio-obsidian-service";
import { setActions, createNote, openNote, frontmatterOf, waitForProperty } from "./helpers.js";

describe("Set property on open", function () {
	beforeEach(async function () {
		await obsidianPage.resetVault("test/vaults/simple");
		await setActions([]);
	});

	it("increments a property each time the note is opened", async function () {
		await setActions([
			{ when: "everyOpen", what: "property", propertyName: "views", propertyValue: "{{increment}}" },
		]);
		await createNote("A.md", "# A\n");
		await createNote("B.md", "# B\n");

		await openNote("A.md");
		await waitForProperty("A.md", "views", 1);

		// Switch away and back so active-leaf-change fires again for A.
		await openNote("B.md");
		await openNote("A.md");
		await waitForProperty("A.md", "views", 2);

		expect((await frontmatterOf("A.md"))?.views).toBe(2);
	});

	it("honors {{increment:initial,step}} params", async function () {
		// initialValue is only used to seed a missing property, so the first
		// open already adds one step on top of it: 100 -> 110, not 100.
		await setActions([
			{ when: "everyOpen", what: "property", propertyName: "views", propertyValue: "{{increment:100,10}}" },
		]);
		await createNote("A.md", "# A\n");
		await createNote("B.md", "# B\n");

		await openNote("A.md");
		await waitForProperty("A.md", "views", 110);

		await openNote("B.md");
		await openNote("A.md");
		await waitForProperty("A.md", "views", 120);
	});
});
