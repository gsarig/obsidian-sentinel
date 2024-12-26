import {Notice} from 'obsidian';
import {AppWithCommands} from '../types/commands';
import {getLabel} from '../utils/getLabel';

/**
 * Execute a 3rd-party plugin command programmatically.
 * Example: executeCommand(app, 'editor:open-search');
 *
 * @param app - The Obsidian app instance.
 * @param commandId - The ID of the command to execute.
 */
export function executeCommand(app: AppWithCommands, commandId: string): boolean {
	if (!app.commands) {
		return false;
	}

	const command = app.commands.findCommand(commandId);
	if (!command) {
		new Notice(getLabel('commandNotFound', {
			label: commandId
		}));
		return false;
	}

	app.commands.executeCommandById(commandId);
	return true;
}
