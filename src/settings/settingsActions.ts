import {Setting} from 'obsidian';
import {SentinelPlugin} from './settingsConfig';
import {Action} from '../types/actions';
import {AppWithCommands} from '../types/commands';
import {CommandSuggest} from "./CommandSuggest";

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
				const inputEl = textComponent.inputEl;
				new CommandSuggest(plugin.app as AppWithCommands, inputEl);

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
