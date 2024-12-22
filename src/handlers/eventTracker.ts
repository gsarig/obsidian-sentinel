import {App, TFile, Notice, debounce} from 'obsidian';
import {FileTrackingInfo} from '../types/FileTrackingInfo';
import {getLabel} from '../utils/getLabel';

export function eventTracker(
	app: App,
	onFileChanged?: (file: TFile, triggerType: 'firstOpen' | 'hasChanges' | 'leave' | 'firstLeave' | 'isChanging') => void,
	isChangingDelay: number = 1000
) {
	let lastActiveLeaf: FileTrackingInfo | null = null;
	const openedFiles = new Map<string, FileTrackingInfo>();

	// Function to safely read file content
	const safeReadFile = async (file: TFile): Promise<string | null> => {
		try {
			return await app.vault.read(file);
		} catch (error) {
			new Notice(getLabel('errorReadingFile'));
			return null;
		}
	};

	// Function to handle live hasChangess
	const handleLiveModification = debounce(async (file: TFile, fileInfo: FileTrackingInfo) => {
		const currentContent = await safeReadFile(file);

		if (currentContent !== null && currentContent !== fileInfo.lastContent) {
			if (onFileChanged) {
				onFileChanged(file, 'isChanging');
			}
			fileInfo.lastContent = currentContent;
		}
	}, isChangingDelay);

	// Handle hasChanges events
	const handleModify = (file: TFile) => {
		const fileInfo = openedFiles.get(file.path);
		if (fileInfo) {
			handleLiveModification(file, fileInfo);
		}
	};

	// Handle leaf change events
	const handleLeafChange = async (leaf: any) => {
		// Handle leave event for the previous file
		if (lastActiveLeaf) {
			const previousFile = app.vault.getAbstractFileByPath(lastActiveLeaf.path);
			if (previousFile instanceof TFile && onFileChanged) {
				if (!lastActiveLeaf.hasBlurred) {
					lastActiveLeaf.hasBlurred = true;
					onFileChanged(previousFile, 'firstLeave');
				} else {
					onFileChanged(previousFile, 'leave');
				}
			}
		}

		if (!leaf?.view?.file || !(leaf.view.file instanceof TFile)) return;
		const file = leaf.view.file as TFile;

		const currentTime = Date.now();
		const filePath = file.path;

		// Handle first-time file opening
		let fileInfo = openedFiles.get(filePath);
		if (!fileInfo) {
			const initialContent = await safeReadFile(file);
			if (initialContent === null) return;

			fileInfo = {
				path: filePath,
				lastModified: file.stat.mtime,
				lastOpened: currentTime,
				firstTimeOpened: true,
				hasBlurred: false,
				lastContent: initialContent
			};
			openedFiles.set(filePath, fileInfo);

			if (onFileChanged) {
				fileInfo.ignoreNextModification = true;
				onFileChanged(file, 'firstOpen');
			}
		}

		// Handle file hasChangess
		if (fileInfo.lastModified !== file.stat.mtime) {
			if (fileInfo.ignoreNextModification) {
				fileInfo.ignoreNextModification = false;
			} else if (onFileChanged) {
				fileInfo.ignoreNextModification = true;
				onFileChanged(file, 'hasChanges');
			}

			fileInfo.lastModified = file.stat.mtime;
			fileInfo.firstTimeOpened = false;
		}

		lastActiveLeaf = fileInfo;
	};

	// Register event listeners
	app.vault.on('modify', handleModify);
	app.workspace.on('active-leaf-change', handleLeafChange);

	// Cleanup function
	return () => {
		// Clear all timeouts
		openedFiles.forEach(fileInfo => {
			if (fileInfo.hasChangesTimeout) {
				clearTimeout(fileInfo.hasChangesTimeout);
			}
		});

		// Remove event listeners
		app.vault.off('modify', handleModify);
		app.workspace.off('active-leaf-change', handleLeafChange);

		// Clear data structures
		openedFiles.clear();
		lastActiveLeaf = null;
	};
}
