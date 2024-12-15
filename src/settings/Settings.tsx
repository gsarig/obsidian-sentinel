import {App, PluginSettingTab, Setting} from 'obsidian';
import Sentinel from '../main';

export class SentinelSettings extends PluginSettingTab {
	app: App;
	plugin: Sentinel;

	constructor(app: App, plugin: Sentinel) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		containerEl.createEl('p', {
			text: 'Sentinel allows you to trigger actions based on document visibility changes.',
		}).createEl('hr');

		// Resources.
		new Setting(containerEl).setName('Resources').setHeading();
		containerEl.createEl('p', {
			text: 'For detailed examples and full documentation, please refer to the following resources:',
		})
		const resourceList = containerEl.createEl('ul').createEl('li');
		resourceList.createEl('a', {
			href: 'https://github.com/gsarig/obsidian-sentinel',
			text: 'The project on GitHub',
		});
	}
}
