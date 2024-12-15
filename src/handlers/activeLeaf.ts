import {App, TFile} from 'obsidian';

interface FileTrackingInfo {
	path: string;
	lastModified: number;
	lastOpened: number;
	ignoreNextModification?: boolean;
	firstTimeOpened?: boolean;
}

export function registerActiveLeafChange(
	app: App,
	onFileChanged?: (file: TFile, app: App, triggerType: 'firstOpen' | 'modification') => void
) {
	let lastActiveLeaf: FileTrackingInfo | null = null;
	const openedFiles = new Map<string, FileTrackingInfo>();

	app.workspace.on('active-leaf-change', (leaf) => {
		if (!leaf) return;

		// Type assertion to bypass TypeScript's strict typing
		const file = (leaf.view as any)?.file as TFile;

		if (!file) return;

		const currentTime = Date.now();
		const filePath = file.path;

		// Tracking info for the current file
		let fileInfo = openedFiles.get(filePath);
		if (!fileInfo) {
			// First time opening this note
			fileInfo = {
				path: filePath,
				lastModified: file.stat.mtime,
				lastOpened: currentTime,
				firstTimeOpened: true
			};
			openedFiles.set(filePath, fileInfo);

			// Call the handler for first-time opening
			if (onFileChanged) {
				// Mark to ignore the next modification before calling the handler
				fileInfo.ignoreNextModification = true;
				onFileChanged(file, app, 'firstOpen');
			}
		}

		// Detect if the file has changed since last opened
		if (fileInfo.lastModified !== file.stat.mtime) {
			// Check if this modification should be ignored
			if (fileInfo.ignoreNextModification) {
				fileInfo.ignoreNextModification = false;
			} else {
				// Allow custom handling when file changes
				if (onFileChanged) {
					// Mark to ignore the next modification before calling the handler
					fileInfo.ignoreNextModification = true;
					onFileChanged(file, app, 'modification');
				}
			}

			// Update the last modified time
			fileInfo.lastModified = file.stat.mtime;
			// Reset first-time opened flag
			fileInfo.firstTimeOpened = false;
		}

		// Rest of the existing code remains the same...
		lastActiveLeaf = fileInfo;
	});
}
