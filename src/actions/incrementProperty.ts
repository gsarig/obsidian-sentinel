import {TFile, App, Notice} from 'obsidian';
import {getLabel} from '../utils/getLabel';
import {propertyUpdater} from '../handlers/propertyUpdater';

/**
 * Increments a specified property of a file by a given step, starting from an initial value if the property is empty.
 * Example: await incrementProperty(file, app, 'view_count', 10);
 *
 * @param file The file whose property needs incrementing.
 * @param app The Obsidian app instance.
 * @param propertyName The name of the property to increment.
 * @param initialValue The initial value if the property is empty (default: 0).
 * @param step The amount to increment by (default: 1).
 * @returns The new property value after incrementing.
 */
export async function incrementProperty(
	file: TFile,
	app: App,
	propertyName?: string,
	initialValue: number = 0,
	step: number = 1
): Promise<number | null> {
	if (!app?.vault) {
		new Notice(getLabel('invalidAppInstance'));
		return null;
	}

	if (!propertyName) {
		new Notice(getLabel('missingPropertyName'));
		return null;
	}

	let incrementedValue: number | null = null;

	try {
		await propertyUpdater(file, app, propertyName, (currentValue) => {
			let numericValue: number;

			if (typeof currentValue === 'string') {
				numericValue = parseFloat(currentValue) || initialValue;
			} else {
				numericValue = currentValue || initialValue;
			}

			incrementedValue = numericValue + step;
			return incrementedValue;
		});
	} catch (error) {
		new Notice(getLabel('errorIncrementingPropery', {
			label: propertyName,
		}));
		return null;
	}

	return incrementedValue;
}
