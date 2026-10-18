import { browser, expect } from "@wdio/globals";
import { describe, it, beforeEach } from "mocha";
import { obsidianPage } from "wdio-obsidian-service";
import { setActions, createNote, openNote, openNoteInNewTab, openNoteInSplit, focusNote, isPhone, frontmatterOf, waitForProperty } from "./helpers.js";

const SETTLE = Number(process.env.OBSIDIAN_E2E_SETTLE ?? 400);

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

	// Regression for #16 ("view counter starts at 2"): opening a note into a
	// new tab emits two active-leaf-change events, and both used to count as
	// an access. Fixed by the same-file duplicate guard in leafChangeHandler.
	it("counts a first open into a new tab as one view", async function () {
		await setActions([
			{ when: "everyOpen", what: "property", propertyName: "views", propertyValue: "{{increment}}" },
		]);
		await createNote("A.md", "# A\n");
		await createNote("B.md", "# B\n");

		await openNote("A.md");
		await openNoteInNewTab("B.md");
		await waitForProperty("B.md", "views", 1);
		await browser.pause(SETTLE);

		expect((await frontmatterOf("B.md"))?.views).toBe(1);
	});

	// Deliberate behavior agreed in #2: while a split view is open, moving
	// between panes is not counted as accessing a note. #17 asked for the
	// opposite, so this guards the decision against a well-meant "fix".
	it("does not fire Accessing a note while a split view is open", async function () {
		if (await isPhone()) {
			this.skip(); // the phone layout has no split panes
		}
		await setActions([
			{ when: "everyOpen", what: "property", propertyName: "views", propertyValue: "{{increment}}" },
			// Control: proves B's open was processed at all. firstOpen is
			// once per session, hence note names no other test uses.
			{ when: "firstOpen", what: "property", propertyName: "seen", propertyValue: "yes" },
		]);
		await createNote("SplitA.md", "# A\n");
		await createNote("SplitB.md", "# B\n");

		await openNote("SplitA.md");
		await waitForProperty("SplitA.md", "views", 1);

		await openNoteInSplit("SplitB.md");
		await waitForProperty("SplitB.md", "seen", "yes");
		await focusNote("SplitA.md");
		await browser.pause(SETTLE);

		expect((await frontmatterOf("SplitB.md"))?.views).toBe(undefined);
		expect((await frontmatterOf("SplitA.md"))?.views).toBe(1);
	});
});
