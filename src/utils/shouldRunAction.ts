import {Notice, TFile, App, TagCache} from 'obsidian';
import {getLabel} from './getLabel';

function isTagMatch(value: string, file: TFile, app: App): boolean {
	if (value.startsWith('#') && !value.includes(' ')) {
		const tag = value.slice(1); // Remove the # prefix
		const fileTags = app.metadataCache.getFileCache(file)?.tags?.map((t: TagCache) => t.tag.slice(1)) || [];
		return fileTags.includes(tag);
	}
	return false;
}

function isFolderMatch(value: string, file: TFile): boolean {
	if (value.endsWith('/')) {
		const normalizedPath = file.path.toLowerCase();
		const normalizedValue = value.toLowerCase();
		return normalizedPath.startsWith(normalizedValue);
	}
	return false;
}

function isNoteNameMatch(value: string, file: TFile): boolean {
	return file.basename.toLowerCase() === value.toLowerCase();
}

function checkIndividualValue(value: string, file: TFile, app: App): boolean {
	const trimmedValue = value.trim();
	const isNegated = trimmedValue.startsWith('!');
	// Remove the ! prefix if it exists
	const cleanValue = isNegated ? trimmedValue.slice(1) : trimmedValue;

	// Check if there's a match
	const matches = isTagMatch(cleanValue, file, app) ||
		isFolderMatch(cleanValue, file) ||
		isNoteNameMatch(cleanValue, file);

	// If negated, return the opposite of matches
	return isNegated ? !matches : matches;
}

export function shouldRunAction(where: string | undefined, file: TFile, app: App): boolean {
	if (!where || where.trim() === '') {
		return true;
	}

	try {
		if (where.startsWith('/') && where.endsWith('/')) {
			const regexPattern = new RegExp(where.slice(1, -1));
			return regexPattern.test(file.path);
		} else if (where.includes(',')) {
			const values = where.split(',');

			const hasNegations = values.some(v => v.trim().startsWith('!'));

			if (hasNegations) {
				// If we have negations, ALL conditions must be true
				// (meaning no negated condition should match)
				return values.every(value => checkIndividualValue(value, file, app));
			} else {
				// For non-negated values, ANY match is enough (original behavior)
				return values.some(value => checkIndividualValue(value, file, app));
			}
		}

		return checkIndividualValue(where, file, app);
	} catch (e) {
		new Notice(getLabel('invalidWhere', {
			label: where,
		}));
		return false;
	}
}
