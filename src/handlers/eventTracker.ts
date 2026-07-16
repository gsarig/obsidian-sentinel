import {App, TFile, WorkspaceLeaf, MarkdownView} from 'obsidian';
import {FileTrackingInfo} from '../types/FileTrackingInfo';
import {handleLeafChange} from './leafChangeHandler';
import {Action} from "../types/actions";

export function eventTracker(
    app: App,
    onFileChanged?: (file: TFile, triggerType: Action['when']) => void
) {
    let lastActiveLeaf: FileTrackingInfo | null = null;
    const openedFiles = new Map<string, FileTrackingInfo>();
    // Keep track of files that have been opened at least once
    const everOpenedFiles = new Set<string>();

    if (!onFileChanged) return () => {};

    // Events are processed strictly in order: a single leaf transition can
    // emit several active-leaf-change events milliseconds apart, and letting
    // them interleave at the handler's awaits corrupts the tracking state
    // (e.g. double-fired leave triggers).
    // Set on cleanup so queued events cannot mutate cleared state or fire
    // actions after the plugin has been unloaded.
    let disposed = false;

    // Final disposal gate: handleLeafChange awaits internally, so cleanup can
    // land while one event is mid-flight; this stops its actions from firing.
    const guardedOnFileChanged: typeof onFileChanged = (file, triggerType) => {
        if (!disposed) {
            onFileChanged(file, triggerType);
        }
    };
    let processing: Promise<void> = Promise.resolve();
    const leafChangeHandler = (leaf: WorkspaceLeaf) => {
        if (disposed) {
            return;
        }
        processing = processing.then(async () => {
            if (disposed) {
                return;
            }
            // Always consume lastActiveLeaf, even when the new leaf holds no
            // file: once a note's leave events have been processed it must
            // stop being "the note we are leaving", or the next event
            // re-fires them.
            lastActiveLeaf = await handleLeafChange(
                leaf,
                app,
                lastActiveLeaf,
                openedFiles,
                guardedOnFileChanged,
                everOpenedFiles
            );
        }).catch((error) => {
            // Keep the chain alive; a failed event must not stall tracking.
            console.error('Sentinel: error while processing leaf change', error);
        });
    };

    const layoutChangeHandler = () => {
        // Check for closed leaves by comparing current leaves with tracked files
        const currentLeaves = app.workspace.getLeavesOfType('markdown');
        const currentPaths = new Set(
            currentLeaves
                .map(leaf => (leaf.view instanceof MarkdownView ? leaf.view.file?.path : null))
                .filter((path): path is string => path !== null)
        );

        // Remove tracking for files that are no longer open
        for (const [path] of openedFiles) {
            if (!currentPaths.has(path)) {
                openedFiles.delete(path);
            }
        }
    };

    // Register event listeners
    app.workspace.on('active-leaf-change', leafChangeHandler);
    app.workspace.on('layout-change', layoutChangeHandler);

    // Cleanup function
    return () => {
        disposed = true;

        openedFiles.forEach(fileInfo => {
            if (fileInfo.hasChangesTimeout) {
                clearTimeout(fileInfo.hasChangesTimeout);
            }
        });

        app.workspace.off('active-leaf-change', leafChangeHandler);
        app.workspace.off('layout-change', layoutChangeHandler);

        openedFiles.clear();
        everOpenedFiles.clear();
        lastActiveLeaf = null;
    };
}
