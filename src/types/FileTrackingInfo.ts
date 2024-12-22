export interface FileTrackingInfo {
	path: string;
	lastModified: number;
	lastOpened: number;
	ignoreNextModification?: boolean;
	firstTimeOpened?: boolean;
	hasBlurred?: boolean;
	hasChangesTimeout?: NodeJS.Timeout;
	lastContent?: string;
}
