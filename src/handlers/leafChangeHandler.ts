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
	onFileChanged: (file: TFile, triggerType: Action['when']) => void,
	everOpenedFiles: Set<string>
) {
	// Handle leave event for the previous file
	if (lastActiveLeaf) {
		const previousFile = app.vault.getAbstractFileByPath(lastActiveLeaf.path);
		if (previousFile instanceof TFile) {
			// Check if the file is still open in any leaf
            const isFileStillOpen = app.workspace.getLeavesOfType('markdown')
                .some(leaf => (leaf.view as FileView).file?.path === previousFile.path);

            if (!isFileStillOpen) {
				// File is actually closed, not just switched
				onFileChanged(previousFile, 'everyClose');
			}

			onFileChanged(previousFile, 'everyLeave');
			const previousFileInfo = openedFiles.get(lastActiveLeaf.path);


			// Detect if the previous file has been modified
			if (
				previousFileInfo &&
				previousFileInfo.lastModified !== previousFile.stat.mtime
			) {
				onFileChanged(previousFile, 'leaveChanged');
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
			lastModified: file.stat.mtime,
			lastOpened: currentTime,
			firstTimeOpened: true,
			hasBlurred: false,
			lastContent: initialContent
		};
		openedFiles.set(filePath, fileInfo);

		// First, handle firstOpen if it hasn't been seen this session
		if (!everOpenedFiles.has(filePath)) {
			onFileChanged(file, 'firstOpen');
			everOpenedFiles.add(filePath);
		}


		// Always trigger firstOpenWithReset when the file is not in currently opened files
		onFileChanged(file, 'firstOpenWithReset');

		// Only trigger firstOpen if the file hasn't been opened in this session
		if (!everOpenedFiles.has(filePath)) {
			onFileChanged(file, 'firstOpen');
			everOpenedFiles.add(filePath);
		}

	} else {
		// If file is revisited, reset lastModified to avoid double-counting
		if (fileInfo.lastModified !== file.stat.mtime) {
			fileInfo.lastModified = file.stat.mtime;
		}

		// Mark file as reopened
		fileInfo.lastOpened = currentTime;
		fileInfo.firstTimeOpened = false;
	}

	// Update tracking to reflect current state
	fileInfo.lastModified = file.stat.mtime;

	return fileInfo;
}
