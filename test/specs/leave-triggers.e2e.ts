import { browser, expect } from "@wdio/globals";
import { describe, it, beforeEach } from "mocha";
import { obsidianPage } from "wdio-obsidian-service";
import { setActions, createNote, openNote, openNoteInNewTab, focusNote, editNote, frontmatterOf, waitForProperty } from "./helpers.js";

// Give the plugin a beat to store the note's opened content before we edit it,
// so leave-with-changes detection compares against the original.
const SETTLE = Number(process.env.OBSIDIAN_E2E_SETTLE ?? 400);

describe("Leave triggers", function () {
	beforeEach(async function () {
		await obsidianPage.resetVault("test/vaults/simple");
		await setActions([]);
	});

	it("everyLeave fires when switching away from a note", async function () {
		await setActions([
			{ when: "everyLeave", what: "property", propertyName: "left", propertyValue: "yes" },
		]);
		await createNote("A.md", "# A\n");
		await createNote("B.md", "# B\n");
		await openNote("A.md");
		await openNote("B.md");
		await waitForProperty("A.md", "left", "yes");
	});

	it("leaveChanged fires after editing then leaving", async function () {
		await setActions([
			{ when: "leaveChanged", what: "property", propertyName: "edited", propertyValue: "yes" },
		]);
		await createNote("A.md", "# A\n");
		await createNote("B.md", "# B\n");
		await openNote("A.md");
		await browser.pause(SETTLE);
		await editNote("A.md", "# A changed\n");
		await openNote("B.md");
		await waitForProperty("A.md", "edited", "yes");
	});

	it("leaveChangedNoFrontmatter fires on a body edit", async function () {
		await setActions([
			{ when: "leaveChangedNoFrontmatter", what: "property", propertyName: "bodyChanged", propertyValue: "yes" },
		]);
		await createNote("A.md", "# A body\n");
		await createNote("B.md", "# B\n");
		await openNote("A.md");
		await browser.pause(SETTLE);
		await editNote("A.md", "# A body changed\n");
		await openNote("B.md");
		await waitForProperty("A.md", "bodyChanged", "yes");
	});

	it("firstLeave fires only once per note, even after later blurs", async function () {
		await createNote("A.md", "# A\n");
		await createNote("B.md", "# B\n");

		// Open B first, then A, so both end up open in separate tabs with A
		// active and not yet blurred. Opening a file into a brand-new leaf
		// can double-fire active-leaf-change for the file being LEFT (see
		// the final report for this as a standalone finding), but never for
		// the file being newly opened, so this setup leaves A's internal
		// "has blurred" state clean before the real assertions start.
		await openNoteInNewTab("B.md");
		await openNoteInNewTab("A.md");
		await browser.pause(SETTLE);

		await setActions([
			{ when: "firstLeave", what: "property", propertyName: "firstLeft", propertyValue: "{{increment}}" },
			// Control: everyLeave fires on every blur.
			{ when: "everyLeave", what: "property", propertyName: "left", propertyValue: "{{increment}}" },
		]);

		// A blurs for the first time via a plain focus switch between two
		// already-loaded leaves (a clean, single-fire transition).
		await focusNote("B.md");
		await waitForProperty("A.md", "firstLeft", 1);
		await waitForProperty("A.md", "left", 1);

		// A blurs a second time; keep it open throughout, since eventTracker
		// drops tracking (and hasBlurred) for a file once it is no longer
		// open in any leaf, which is what makes the once-only semantics
		// observable.
		await focusNote("A.md");
		await focusNote("B.md");
		await waitForProperty("A.md", "left", 2);
		expect((await frontmatterOf("A.md"))?.firstLeft).toBe(1);
	});

	// Regression test for the new-tab double-fire: a single logical leaf
	// transition emits multiple active-leaf-change events, which previously
	// re-fired leave triggers for the note being left. Fixed in eventTracker
	// (serialized handling, unconditional lastActiveLeaf consume) and
	// leafChangeHandler (same-file duplicate guard); the rapid-succession
	// variant is covered by the next test.
	it("does not double-fire leave triggers when opening a note into a new tab", async function () {
		await setActions([
			{ when: "everyLeave", what: "property", propertyName: "left", propertyValue: "{{increment}}" },
			{ when: "firstLeave", what: "property", propertyName: "firstLeft", propertyValue: "{{increment}}" },
		]);
		await createNote("A.md", "# A\n");
		await createNote("B.md", "# B\n");

		await openNote("A.md");
		await browser.pause(SETTLE);
		// Opening a file into a brand-new leaf fires active-leaf-change
		// twice (once when the empty leaf activates, once when the file
		// loads into it); this must still only count as a single leave for A.
		await openNoteInNewTab("B.md");
		await waitForProperty("A.md", "left", 1);
		await browser.pause(SETTLE);
		expect((await frontmatterOf("A.md"))?.left).toBe(1);
		expect((await frontmatterOf("A.md"))?.firstLeft).toBe(1);
	});

	it("handles rapid back-to-back new-tab opens without duplicate or self leaves", async function () {
		// The racy shape: a single new-tab open emits two active-leaf-change
		// events for the same file, and two opens with no settle between them
		// interleave. Expected: A left once, B left once, C (now active)
		// never left at all.
		await setActions([
			{ when: "everyLeave", what: "property", propertyName: "left", propertyValue: "{{increment}}" },
			{ when: "firstLeave", what: "property", propertyName: "firstLeft", propertyValue: "{{increment}}" },
		]);
		await createNote("A.md", "# A\n");
		await createNote("B.md", "# B\n");
		await createNote("C.md", "# C\n");

		await openNote("A.md");
		await browser.pause(SETTLE);
		await openNoteInNewTab("B.md");
		await openNoteInNewTab("C.md"); // deliberately no settle between the two
		await waitForProperty("A.md", "left", 1);
		await waitForProperty("B.md", "left", 1);
		await browser.pause(SETTLE);

		expect((await frontmatterOf("A.md"))?.left).toBe(1);
		expect((await frontmatterOf("A.md"))?.firstLeft).toBe(1);
		expect((await frontmatterOf("B.md"))?.left).toBe(1);
		expect((await frontmatterOf("B.md"))?.firstLeft).toBe(1);
		// The self-leave check: C just became active and was never left.
		expect((await frontmatterOf("C.md"))?.left).toBe(undefined);
		expect((await frontmatterOf("C.md"))?.firstLeft).toBe(undefined);
	});

	it("leaveChangedNoFrontmatter ignores a frontmatter-only edit", async function () {
		await setActions([
			// Control: leaveChanged still fires on any modification.
			{ when: "leaveChanged", what: "property", propertyName: "changed", propertyValue: "yes" },
			{ when: "leaveChangedNoFrontmatter", what: "property", propertyName: "bodyChanged", propertyValue: "yes" },
		]);
		await createNote("A.md", "# A body\n");
		await createNote("B.md", "# B\n");
		await openNote("A.md");
		await browser.pause(SETTLE);
		await editNote("A.md", "---\nfoo: bar\n---\n# A body\n"); // body unchanged
		await openNote("B.md");
		await waitForProperty("A.md", "changed", "yes"); // control fired
		expect((await frontmatterOf("A.md"))?.bodyChanged).toBe(undefined);
	});
});
