import { Setting, Command } from 'obsidian';
import { SentinelPlugin } from './settingsConfig';
import { Action } from '../types/actions';
import {AppWithCommands} from '../types/commands';

/**
 * Creates the UI for an action setting in the Settings Tab.
 */
export function addAction(
	containerEl: HTMLElement,
	action: Action,
	index: number,
	plugin: SentinelPlugin,
	display: () => void // Callback to refresh the UI
): void {
	const actionContainer = containerEl.createDiv('sentinel--action-container');

	new Setting(actionContainer)
		.setName('Where')
		.addText((text) =>
			text.setValue(action.where).onChange(async (value) => {
				action.where = value;
				await plugin.saveSettings();
			})
		);

	new Setting(actionContainer)
		.setName('When')
		.addDropdown((dropdown) =>
			dropdown
				.addOptions({
					everyOpen: 'Opening a note',
					firstOpen: 'Opening a note (once)',
					firstLeave: 'Exiting a note (once)',
					leaveChanged: 'Exiting a note with changes',
				})
				.setValue(action.when)
				.onChange(async (value: Action['when']) => {
					action.when = value;
					await plugin.saveSettings();
				})
		);

	new Setting(actionContainer)
		.setName('What')
		.addDropdown((dropdown) =>
			dropdown
				.addOptions({
					property: 'Set a property',
					command: 'Execute a command',
				})
				.setValue(action.what)
				.onChange(async (value: Action['what']) => {
					action.what = value;
					if (value === 'property') {
						action.commandId = undefined;
					} else {
						action.propertyName = undefined;
						action.propertyValue = undefined;
					}
					await plugin.saveSettings();
					display();
				})
		);

	if (action.what === 'property') {
		new Setting(actionContainer)
			.setName('Property name')
			.addText((text) =>
				text.setValue(action.propertyName || '').onChange(async (value) => {
					action.propertyName = value;
					await plugin.saveSettings();
				})
			);

		new Setting(actionContainer)
			.setName('Value')
			.addText((text) =>
				text.setValue(action.propertyValue || '').onChange(async (value) => {
					action.propertyValue = value;
					await plugin.saveSettings();
				})
			);
	} else {
		new Setting(actionContainer)
			.setName('Command')
			.addText((text) => {
				const textComponent = text
					.setValue(action.commandId || '')
					.setPlaceholder('Search commands...')
					.onChange(async (value) => {
						action.commandId = value;
						await plugin.saveSettings();
					});

				const suggestionContainer = actionContainer.createDiv('suggestion-container');

				textComponent.inputEl.addEventListener('input', (e) => {
					const currentValue = (e.target as HTMLInputElement).value.toLowerCase();
					const commands = (plugin.app as AppWithCommands).commands.listCommands();

					suggestionContainer.empty();

					const suggestions = commands
						.filter(
							(cmd: Command) =>
								cmd.name.toLowerCase().includes(currentValue) ||
								cmd.id.toLowerCase().includes(currentValue)
						)
						.slice(0, 5);

					suggestions.forEach((cmd: Command) => {
						const suggestion = suggestionContainer.createDiv('suggestion-item');
						suggestion.setText(cmd.name);
						suggestion.addEventListener('click', async () => {
							textComponent.setValue(cmd.id);
							action.commandId = cmd.id;
							await plugin.saveSettings();
							suggestionContainer.empty();
						});
					});
				});

				document.addEventListener('click', (e) => {
					if (!suggestionContainer.contains(e.target as Node)) {
						suggestionContainer.empty();
					}
				});

				return textComponent;
			});
	}

	new Setting(actionContainer)
		.addButton((button) =>
			button
				.setButtonText('Remove')
				.setClass('mod-destructive')
				.onClick(async () => {
					plugin.settings.actions.splice(index, 1);
					await plugin.saveSettings();
					display();
				})
		);
}
