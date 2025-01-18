import {TFile, App, Notice} from 'obsidian';
import {getLabel} from '../utils/getLabel';

export async function propertyUpdater(
	file: TFile,
	app: App,
	propertyName: string,
	updater: (currentValue: number | string) => number | string
): Promise<boolean> {
	try {
		await app.fileManager.processFrontMatter(file, (frontmatter) => {
			const currentValue = frontmatter[propertyName];

			if (typeof currentValue === 'boolean') {
				new Notice(getLabel('failedUpdatingProperty', {
					label: propertyName,
				}));
			}
			frontmatter[propertyName] = updater(currentValue || 0);
		});

		return true;
	} catch (error) {
		new Notice(getLabel('failedUpdatingFile', {
			label: file.path,
		}));
		return false;
	}
}
