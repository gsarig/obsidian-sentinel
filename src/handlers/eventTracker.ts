import {App, TFile, WorkspaceLeaf} from 'obsidian';
import {FileTrackingInfo} from '../types/FileTrackingInfo';
import {handleLeafChange} from './leafChangeHandler';
import {Action} from "../types/actions";

export function eventTracker(
	app: App,
	onFileChanged?: (file: TFile, triggerType: Action['when']) => void
) {
	let lastActiveLeaf: FileTrackingInfo | null = null;
	const openedFiles = new Map<string, FileTrackingInfo>();

	if (!onFileChanged) return () => {
	};

	const leafChangeHandler = async (leaf: WorkspaceLeaf) => {
		const newLastActiveLeaf = await handleLeafChange(
			leaf,
			app,
			lastActiveLeaf,
			openedFiles,
			onFileChanged
		);
		if (newLastActiveLeaf) {
			lastActiveLeaf = newLastActiveLeaf;
		}
	};

	// Register event listeners
	app.workspace.on('active-leaf-change', leafChangeHandler);

	// Cleanup function
	return () => {
		openedFiles.forEach(fileInfo => {
			if (fileInfo.hasChangesTimeout) {
				clearTimeout(fileInfo.hasChangesTimeout);
			}
		});

		app.workspace.off('active-leaf-change', leafChangeHandler);

		openedFiles.clear();
		lastActiveLeaf = null;
	};
}
