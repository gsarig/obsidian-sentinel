import {Notice, TFile} from 'obsidian';
import {getLabel} from './getLabel';

export function shouldRunAction(where: string | undefined, file: TFile): boolean {
	if (!where || where.trim() === '') {
		// If `where` is empty, run on all notes
		return true;
	}

	const fileName = file.basename; // The current note's filename (without extension)
	const filePath = file.path; // The current note's full path

	try {
		if (where.startsWith('/') && where.endsWith('/')) {
			// If `where` is a regex pattern (e.g., "/pattern/"), test it
			const regexPattern = new RegExp(where.slice(1, -1)); // Remove the surrounding slashes
			return regexPattern.test(filePath); // Test the regex against the file's full path
		} else {
			// Otherwise, treat `where` as a literal note name or path
			return fileName === where || filePath === where;
		}
	} catch (e) {
		new Notice(getLabel('invalidWhere', {
			label: where,
		}));
		return false; // If there's an error (e.g., invalid regex), don't match
	}
}
