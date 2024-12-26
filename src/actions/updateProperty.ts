import {TFile, App} from 'obsidian';
import {propertyUpdater} from '../handlers/propertyUpdater';
import {incrementProperty} from './incrementProperty';
import {parseTemplate} from '../utils/parseTemplate';

/**
 * Updates the property of a file, replacing placeholders in a template string or incrementing if the template contains {{increment}}.
 *
 * @param file The file to be updated.
 * @param app The Obsidian app instance.
 * @param propertyName The name of the property to be updated.
 * @param template The template string containing placeholders.
 */
export async function updateProperty(
	file: TFile,
	app: App,
	propertyName?: string,
	template?: string
): Promise<boolean> {

	if (!app?.vault || !propertyName || !template) {
		return false;
	}

	// Check if the template contains the {{increment}} tag.
	const incrementMatch = template.match(/^{{\s*increment(?::([^}]+))?\s*}}$/);
	if (incrementMatch) {
		// Parse initial value and step if provided in the template.
		const params = incrementMatch[1]?.split(","); // e.g., "1,10" -> ["1", "10"]
		const initialValue = params && params[0] ? Number(params[0]) : 0; // Default initial value = 0
		const step = params && params[1] ? Number(params[1]) : 1; // Default step = 1

		try {
			await incrementProperty(file, app, propertyName, initialValue, step);
			return true;
		} catch (error) {
			return false;
		}
	}

	// Parse the template to handle other placeholders (e.g., {{date}}, {{time}}, {{title}}).
	const parsedTemplate = parseTemplate(template);

	// Update property with the parsed template value.
	try {
		await propertyUpdater(file, app, propertyName, () => parsedTemplate);
		return true;
	} catch (error) {
		return false;
	}
}
