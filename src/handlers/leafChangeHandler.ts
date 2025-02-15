import {App, TFile, WorkspaceLeaf, FileView} from 'obsidian';
import {FileTrackingInfo} from '../types/FileTrackingInfo';
import {safeReadFile} from './fileContentHandler';
import {Action} from '../types/actions';
import {isSplitViewActive} from '../utils/isSplitViewActive';

export async function handleLeafChange(
	leaf: WorkspaceLeaf,
	app: App,
	lastActiveLeaf: FileTrackingInfo | null,
	openedFiles: Map<string, FileTrackingInfo>,
	onFileChanged: (file: TFile, triggerType: Action['when']) => void
) {
	// Handle leave event for the previous file
	if (lastActiveLeaf) {
		const previousFile = app.vault.getAbstractFileByPath(lastActiveLeaf.path);
		if (previousFile instanceof TFile) {
			const previousFileInfo = openedFiles.get(lastActiveLeaf.path);

			// Detect if the previous file has been modified.
			if (
				previousFileInfo &&
				previousFileInfo.lastModified !== previousFile.stat.mtime
			) {
				// Trigger leaveChanged when exiting a note with changes
				onFileChanged(previousFile, 'leaveChanged');

				// Synchronize the tracking info with the current state after the change is processed
				previousFileInfo.lastModified = previousFile.stat.mtime;
			}

			// Handle firstLeave if the note has never blurred before
			if (!lastActiveLeaf.hasBlurred) {
				lastActiveLeaf.hasBlurred = true;
				onFileChanged(previousFile, 'firstLeave');
			}
		}
	}

	// Make sure the leaf is a FileView
	if (!(leaf?.view instanceof FileView)) {
		return null;
	}

	// Safe access to `file`, as it's guaranteed in FileView
	const file = leaf.view.file;
	if (!(file instanceof TFile)) {
		return null;
	}

	const currentTime = Date.now();
	const filePath = file.path;

	if (!isSplitViewActive(app)) {
		onFileChanged(file, 'everyOpen');
	}

	// Handle first-time file opening
	let fileInfo = openedFiles.get(filePath);
	if (!fileInfo) {
		const initialContent = await safeReadFile(app, file);
		if (initialContent === null) {
			return null;
		}

		fileInfo = {
			path: filePath,
			lastModified: file.stat.mtime, // Initial state of the file.
			lastOpened: currentTime,
			firstTimeOpened: true,
			hasBlurred: false,
			lastContent: initialContent
		};
		openedFiles.set(filePath, fileInfo);

		// Trigger firstOpen for new files
		onFileChanged(file, 'firstOpen');
	} else {
		// If file is revisited, reset lastModified to avoid double-counting.
		if (fileInfo.lastModified !== file.stat.mtime) {
			fileInfo.lastModified = file.stat.mtime;
		}

		// Mark file as reopened.
		fileInfo.lastOpened = currentTime;
		fileInfo.firstTimeOpened = false;
	}

	// Update tracking to reflect current state.
	fileInfo.lastModified = file.stat.mtime;

	// Return the updated file info.
	return fileInfo;
}
