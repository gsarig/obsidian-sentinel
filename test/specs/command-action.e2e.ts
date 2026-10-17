import { browser, expect } from "@wdio/globals";
import { describe, it, beforeEach } from "mocha";
import { obsidianPage } from "wdio-obsidian-service";
import { setActions, createNote, openNote } from "./helpers.js";

// Register a throwaway command that counts its executions on window.
async function registerCounterCommand(id: string): Promise<void> {
	await browser.executeObsidian(
		({ app }, id) => {
			(window as unknown as Record<string, number>)["__sentinelRuns"] = 0;
			(app as unknown as { commands: { addCommand: (c: unknown) => void } }).commands.addCommand({
				id,
				name: "Sentinel e2e counter",
				callback: () => {
					(window as unknown as Record<string, number>)["__sentinelRuns"]++;
				},
			});
		},
		id,
	);
}

async function commandRuns(): Promise<number> {
	return await browser.executeObsidian(() => (window as unknown as Record<string, number>)["__sentinelRuns"] ?? 0);
}

describe("Execute command action", function () {
	beforeEach(async function () {
		await obsidianPage.resetVault("test/vaults/simple");
		await setActions([]);
	});

	it("runs a configured command when the note opens", async function () {
		await registerCounterCommand("sentinel-e2e:counter");
		await setActions([
			{ when: "everyOpen", what: "command", commandId: "sentinel-e2e:counter" },
		]);
		await createNote("Cmd.md", "# C\n");
		await openNote("Cmd.md");
		await browser.waitUntil(async () => (await commandRuns()) >= 1, {
			timeout: 5000,
			timeoutMsg: "configured command never executed",
		});
		expect(await commandRuns()).toBe(1);
	});
});
