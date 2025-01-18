import {AbstractInputSuggest} from 'obsidian';
import {Command} from 'obsidian';
import {AppWithCommands} from '../types/commands';

export class CommandSuggest extends AbstractInputSuggest<Command> {
	private pluginApp: AppWithCommands;
	private inputEl: HTMLInputElement;

	constructor(app: AppWithCommands, inputEl: HTMLInputElement) {
		super(app, inputEl);
		this.pluginApp = app;
		this.inputEl = inputEl;
	}

	getSuggestions(query: string): Command[] {
		const commands = this.pluginApp.commands.listCommands();
		const lowerQuery = query.toLowerCase();

		return commands
			.filter(
				(cmd) =>
					cmd.name.toLowerCase().includes(lowerQuery) ||
					cmd.id.toLowerCase().includes(lowerQuery)
			)
			.slice(0, 5); // Limit suggestions to top 5.
	}

	renderSuggestion(command: Command, el: HTMLElement) {
		el.setText(command.name);
	}

	selectSuggestion(command: Command) {
		this.inputEl.value = command.id;
		this.inputEl.dispatchEvent(new Event('input'));
		this.inputEl.blur();
		this.close();
	}
}
