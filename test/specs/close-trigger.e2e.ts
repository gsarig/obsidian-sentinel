import { browser, expect } from "@wdio/globals";
import { describe, it, beforeEach } from "mocha";
import { obsidianPage } from "wdio-obsidian-service";
import { setActions, createNote, openNote, openNoteInNewTab, closeNote, frontmatterOf, waitForProperty } from "./helpers.js";

const SETTLE = Number(process.env.OBSIDIAN_E2E_SETTLE ?? 400);

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

	// Regression for #17 ("closing a note doesn't fire"): closing a tab that
	// is not the active one emits no active-leaf-change, so the close was
	// never noticed. Now detected from layout-change in eventTracker.
	it("everyClose fires when a background tab is closed", async function () {
		await setActions([
			{ when: "everyClose", what: "property", propertyName: "closes", propertyValue: "{{increment}}" },
		]);
		await createNote("A.md", "# A\n");
		await createNote("B.md", "# B\n");
		await openNote("A.md");
		await openNoteInNewTab("B.md"); // B is active, A sits in a background tab
		await browser.pause(SETTLE);

		await closeNote("A.md");
		await waitForProperty("A.md", "closes", 1);
		await browser.pause(SETTLE);

		expect((await frontmatterOf("A.md"))?.closes).toBe(1);
		// B was never closed.
		expect((await frontmatterOf("B.md"))?.closes).toBe(undefined);
	});

	it("everyClose fires once when the active tab is closed", async function () {
		await setActions([
			{ when: "everyClose", what: "property", propertyName: "closes", propertyValue: "{{increment}}" },
		]);
		await createNote("A.md", "# A\n");
		await createNote("B.md", "# B\n");
		await openNote("A.md");
		await openNoteInNewTab("B.md");
		await browser.pause(SETTLE);

		// Both active-leaf-change (focus moves to A) and layout-change see B
		// go away; only one of them may fire the close.
		await closeNote("B.md");
		await waitForProperty("B.md", "closes", 1);
		await browser.pause(SETTLE);

		expect((await frontmatterOf("B.md"))?.closes).toBe(1);
		expect((await frontmatterOf("A.md"))?.closes).toBe(undefined);
	});
});
