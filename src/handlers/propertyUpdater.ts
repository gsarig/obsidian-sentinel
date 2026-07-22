import {TFile, App, Notice} from 'obsidian';
import {getLabel} from '../utils/getLabel';

export async function propertyUpdater(
	file: TFile,
	app: App,
	propertyName: string,
	updater: (currentValue: number | string) => number | string,
	skipExisting: boolean = false
): Promise<boolean> {
	try {
		await app.fileManager.processFrontMatter(file, (frontmatter: Record<string, unknown>) => {
			const currentValue = frontmatter[propertyName];

			if (skipExisting && currentValue !== undefined) {
				return;
			}

			if (typeof currentValue === 'boolean') {
				new Notice(getLabel('failedUpdatingProperty', {
					label: propertyName,
				}));
			}
			const baseValue = typeof currentValue === 'number' || typeof currentValue === 'string'
				? currentValue
				: 0;
			frontmatter[propertyName] = updater(baseValue || 0);
		});

		return true;
	} catch (_error) {
		new Notice(getLabel('failedUpdatingFile', {
			label: file.path,
		}));
		return false;
	}
}
