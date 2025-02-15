import { App } from 'obsidian';

interface WorkspaceSplitWithChildren {
    children: unknown[];
}

export function isSplitViewActive(app: App): boolean {
    // First cast to unknown, then to our interface
    const rootSplit = (app.workspace.rootSplit as unknown) as WorkspaceSplitWithChildren;
    return rootSplit?.children?.length > 1;
}
