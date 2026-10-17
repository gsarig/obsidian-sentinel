import { browser } from "@wdio/globals";

// Shape of a Sentinel action (mirrors src/types/actions.d.ts).
export type SentinelAction = {
	where?: string;
	when: string;
	what: "property" | "command";
	propertyName?: string;
	propertyValue?: string;
	commandId?: string;
	skipExisting?: boolean;
};

// Replace the live plugin's configured actions. The event tracker reads
// `settings.actions` on every event, so mutating the same settings object
// (as the settings UI does) is enough; no reload required.
export async function setActions(actions: SentinelAction[]): Promise<void> {
	await browser.executeObsidian(
		({ app }, actions) => {
			const plugin = (app as unknown as {
				plugins: { plugins: Record<string, { settings: { actions: unknown[] } }> };
			}).plugins.plugins["sentinel"];
			plugin.settings.actions = actions;
		},
		actions,
	);
}

// Create (or overwrite) a note with the given body.
export async function createNote(path: string, content = ""): Promise<void> {
	await browser.executeObsidian(
		async ({ app }, path, content) => {
			const existing = app.vault.getAbstractFileByPath(path);
			if (existing) {
				await app.vault.delete(existing, true);
			}
			await app.vault.create(path, content);
		},
		path,
		content,
	);
}

// Open a note in the active leaf (fires active-leaf-change).
export async function openNote(path: string): Promise<void> {
	await browser.executeObsidian(
		async ({ app, obsidian }, path) => {
			const file = app.vault.getAbstractFileByPath(path);
			if (file instanceof obsidian.TFile) {
				await app.workspace.getLeaf(false).openFile(file);
			}
		},
		path,
	);
}

// Edit a note's body (changes mtime and content, as a user edit would).
export async function editNote(path: string, content: string): Promise<void> {
	await browser.executeObsidian(
		async ({ app, obsidian }, path, content) => {
			const file = app.vault.getAbstractFileByPath(path);
			if (file instanceof obsidian.TFile) {
				await app.vault.modify(file, content);
			}
		},
		path,
		content,
	);
}

// Read a note's parsed frontmatter (via metadataCache), or null.
export async function frontmatterOf(path: string): Promise<Record<string, unknown> | null> {
	return await browser.executeObsidian(
		({ app, obsidian }, path) => {
			const file = app.vault.getAbstractFileByPath(path);
			if (file instanceof obsidian.TFile) {
				return app.metadataCache.getFileCache(file)?.frontmatter ?? null;
			}
			return null;
		},
		path,
	);
}

// Wait until a note's frontmatter property equals the expected value.
export async function waitForProperty(
	path: string,
	property: string,
	expected: unknown,
): Promise<void> {
	await browser.waitUntil(
		async () => {
			const fm = await frontmatterOf(path);
			return fm?.[property] === expected;
		},
		{ timeout: 5000, interval: 100, timeoutMsg: `${path} property "${property}" never became ${String(expected)}` },
	);
}

// Create a folder (no-op if it already exists).
export async function createFolder(path: string): Promise<void> {
	await browser.executeObsidian(async ({ app }, path) => {
		if (!app.vault.getAbstractFileByPath(path)) {
			await app.vault.createFolder(path);
		}
	}, path);
}

// Open a note in a new tab (leaf), leaving existing tabs open.
export async function openNoteInNewTab(path: string): Promise<void> {
	await browser.executeObsidian(
		async ({ app, obsidian }, path) => {
			const file = app.vault.getAbstractFileByPath(path);
			if (file instanceof obsidian.TFile) {
				await app.workspace.getLeaf("tab").openFile(file);
			}
		},
		path,
	);
}

// Focus an already-open leaf showing the given note, without opening a new one
// (fires active-leaf-change against an existing leaf, like clicking its tab).
export async function focusNote(path: string): Promise<void> {
	await browser.executeObsidian(
		({ app, obsidian }, path) => {
			const leaf = app.workspace.getLeavesOfType("markdown").find(
				(leaf) => leaf.view instanceof obsidian.FileView && leaf.view.file?.path === path,
			);
			if (leaf) {
				app.workspace.setActiveLeaf(leaf, { focus: true });
			}
		},
		path,
	);
}

// Close every leaf currently showing the given note (fires a real close).
export async function closeNote(path: string): Promise<void> {
	await browser.executeObsidian(
		({ app, obsidian }, path) => {
			for (const leaf of app.workspace.getLeavesOfType("markdown")) {
				const view = leaf.view;
				if (view instanceof obsidian.FileView && view.file?.path === path) {
					leaf.detach();
				}
			}
		},
		path,
	);
}

// Evaluate the Obsidian moment token the plugin would produce (timezone-safe).
export async function momentToken(format: string): Promise<string> {
	return await browser.executeObsidian(
		({ obsidian }, format) => (obsidian as unknown as { moment: (d?: unknown) => { format: (f: string) => string } }).moment().format(format),
		format,
	);
}

// Wait until metadataCache has indexed the note (and, if given, the tag).
export async function waitForCache(path: string, tag?: string): Promise<void> {
	await browser.waitUntil(
		async () =>
			browser.executeObsidian(
				({ app, obsidian }, path, tag) => {
					const file = app.vault.getAbstractFileByPath(path);
					if (!(file instanceof obsidian.TFile)) {
						return false;
					}
					const cache = app.metadataCache.getFileCache(file);
					if (!cache) {
						return false;
					}
					if (!tag) {
						return true;
					}
					const fmTags = cache.frontmatter?.tags;
					const list = Array.isArray(fmTags) ? fmTags : fmTags === undefined ? [] : [fmTags];
					const inlineTags = (cache.tags ?? []).map((t) => t.tag.replace(/^#/, ""));
					return [...list, ...inlineTags].includes(tag);
				},
				path,
				tag,
			),
		{ timeout: 5000, interval: 100, timeoutMsg: `${path} was not indexed${tag ? ` with tag ${tag}` : ""}` },
	);
}
