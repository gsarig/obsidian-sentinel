import { TFile, App } from 'obsidian'
import { propertyUpdater } from '../handlers/propertyUpdater'
import { parseTemplate } from '../utils/parseTemplate'

/**
 * Updates the property of a file, replacing placeholders in a template string.
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
): Promise<void> {
    if (!app?.vault || !propertyName || !template) return;

    // Parse the template to handle date placeholders
    const parsedTemplate = parseTemplate(template);

    await propertyUpdater(file, app, propertyName, () => parsedTemplate);
}
