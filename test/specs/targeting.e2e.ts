import { expect } from "@wdio/globals";
import { describe, it, beforeEach } from "mocha";
import { obsidianPage } from "wdio-obsidian-service";
import { setActions, createNote, createFolder, openNote, frontmatterOf, waitForProperty, waitForCache } from "./helpers.js";

// Open `notePath` with a targeted action plus an all-notes control action, and
// report whether the targeted action fired. The target action is listed first
// so that once the control property lands, the target has already been processed.
async function fires(where: string, notePath: string, tag?: string): Promise<boolean> {
	await setActions([
		{ where, when: "everyOpen", what: "property", propertyName: "hit", propertyValue: "yes" },
		{ where: "", when: "everyOpen", what: "property", propertyName: "control", propertyValue: "yes" },
	]);
	if (tag) {
		await waitForCache(notePath, tag);
	}
	await openNote(notePath);
	await waitForProperty(notePath, "control", "yes");
	return (await frontmatterOf(notePath))?.hit === "yes";
}

describe("Targeting (where)", function () {
	beforeEach(async function () {
		await obsidianPage.resetVault("test/vaults/simple");
		await setActions([]);
	});

	it("matches by #tag", async function () {
		await createNote("Tagged.md", "---\ntags:\n  - t1\n---\n# T\n");
		await createNote("Plain.md", "# P\n");
		expect(await fires("#t1", "Tagged.md", "t1")).toBe(true);
		expect(await fires("#t1", "Plain.md")).toBe(false);
	});

	it("matches by folder/", async function () {
		await createFolder("Target");
		await createFolder("Other");
		await createNote("Target/N.md", "# N\n");
		await createNote("Other/N.md", "# N\n");
		expect(await fires("Target/", "Target/N.md")).toBe(true);
		expect(await fires("Target/", "Other/N.md")).toBe(false);
	});

	it("matches by exact note name (case-insensitive)", async function () {
		await createNote("Exact.md", "# E\n");
		await createNote("Different.md", "# D\n");
		expect(await fires("exact", "Exact.md")).toBe(true);
		expect(await fires("exact", "Different.md")).toBe(false);
	});

	it("matches by /regex/ on the path", async function () {
		await createNote("Rec-1.md", "# R\n");
		await createNote("Plain.md", "# P\n");
		expect(await fires("/^Rec-/", "Rec-1.md")).toBe(true);
		expect(await fires("/^Rec-/", "Plain.md")).toBe(false);
	});

	it("supports ! negation", async function () {
		await createNote("Tagged.md", "---\ntags:\n  - t1\n---\n# T\n");
		await createNote("Plain.md", "# P\n");
		expect(await fires("!#t1", "Plain.md")).toBe(true);
		expect(await fires("!#t1", "Tagged.md", "t1")).toBe(false);
	});

	it("supports comma-separated OR matching", async function () {
		await createFolder("Other");
		await createNote("Tagged.md", "---\ntags:\n  - t1\n---\n# T\n");
		await createNote("Plain.md", "# P\n");
		expect(await fires("#t1,Other/", "Tagged.md", "t1")).toBe(true);
		expect(await fires("#t1,Other/", "Plain.md")).toBe(false);
	});

	it("supports comma-separated negated AND matching", async function () {
		await createFolder("Target");
		await createNote("Plain.md", "# P\n");
		await createNote("Tagged.md", "---\ntags:\n  - t1\n---\n# T\n");
		await createNote("Target/N.md", "# N\n");
		expect(await fires("!#t1,!Target/", "Plain.md")).toBe(true);
		expect(await fires("!#t1,!Target/", "Tagged.md", "t1")).toBe(false);
		expect(await fires("!#t1,!Target/", "Target/N.md")).toBe(false);
	});
});
