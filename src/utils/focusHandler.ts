import {App, Notice, TFile} from "obsidian";

/**
 * Handles the logic for when a note loses focus.
 * Triggers a notice if the note was modified.
 *
 * @param previousNote - The file path of the note that lost focus (if any).
 * @param app - The Obsidian app instance.
 * @param lastModifiedMap - A map of files to their last known modification times.
 */
export function handleFocusLoss(
	previousNote: string | null,
	app: App,
	lastModifiedMap: Map<string, number>
) {
	if (previousNote) {
		const previousFile = app.vault.getAbstractFileByPath(previousNote) as TFile;
		if (previousFile) {
			const previousMtime = previousFile.stat.mtime;
			const lastTrackedModified = lastModifiedMap.get(previousFile.path);

			// Trigger a notice if the note has been modified
			if (lastTrackedModified !== undefined && previousMtime !== lastTrackedModified) {
				new Notice(`Note ${previousFile.name} has lost focus and was modified.`);
			}
		}
	}
}
