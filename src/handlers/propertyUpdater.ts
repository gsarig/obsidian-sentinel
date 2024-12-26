import * as yaml from 'js-yaml';
import {TFile, App, Notice} from 'obsidian';
import {getLabel} from '../utils/getLabel';

export async function propertyUpdater(
	file: TFile,
	app: App,
	propertyName: string,
	updater: (currentValue: number | string) => number | string
): Promise<boolean> {
	const content = await app.vault.read(file);
	const frontmatterMatch = content.match(/^---\n[\s\S]*?\n---\n/);
	let frontmatter: Record<string, string | number | boolean> = {};
	let bodyContent = content;

	if (frontmatterMatch) {
		const frontmatterRaw = frontmatterMatch[0];
		frontmatter = yaml.load(frontmatterRaw.replace(/^---\n/, "").replace(/\n---\n$/, "")) as Record<string, string | number | boolean>;
		bodyContent = content.substring(frontmatterRaw.length);
	}

	const currentValue = frontmatter[propertyName];

	// Ensure the property being updated is `string | number`
	if (typeof currentValue === 'boolean') {
		return false;
	}
	frontmatter[propertyName] = updater(currentValue || 0);
	const updatedFrontmatter = `---\n${yaml.dump(frontmatter)}---\n`;
	try {
		await app.vault.modify(file, updatedFrontmatter + bodyContent);
		return true;
	} catch (error) {
		new Notice(getLabel('failedUpdatingFile', {
			label: file.path,
		}));
		return false;
	}
}
