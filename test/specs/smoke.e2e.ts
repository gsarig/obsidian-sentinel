import { browser, expect } from "@wdio/globals";
import { describe, it } from "mocha";

describe("Sentinel e2e smoke", function () {
	it("loads and enables the plugin", async function () {
		const loaded = await browser.executeObsidian(
			({ app }) => !!(app as unknown as { plugins: { plugins: Record<string, unknown> } }).plugins.plugins["sentinel"],
		);
		expect(loaded).toBe(true);
	});
});
