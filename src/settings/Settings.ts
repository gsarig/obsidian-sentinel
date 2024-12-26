import {App, Plugin, PluginSettingTab, Setting} from 'obsidian';
import {addAction} from './settingsActions';
import {SentinelPlugin} from './settingsConfig';

export class SentinelSettings extends PluginSettingTab {
	plugin: Plugin & SentinelPlugin;

	constructor(app: App, plugin: SentinelPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		containerEl.createEl('p', {
			text: 'Sentinel allows you to trigger actions based on document visibility changes.',
		}).createEl('hr');

		containerEl.createEl('h3', {text: 'Actions'});

		if (this.plugin.settings.actions) {
			this.plugin.settings.actions.forEach((action, index) => {
				addAction(containerEl, action, index, this.plugin, this.display.bind(this));
			});
		}

		new Setting(containerEl)
			.addButton(button => button
				.setButtonText('Add Action')
				.setClass('mod-cta')
				.onClick(async () => {
					if (!this.plugin.settings.actions) {
						this.plugin.settings.actions = [];
					}
					this.plugin.settings.actions.push({
						where: '',
						when: 'firstOpen',
						what: 'property'
					});
					await this.plugin.saveSettings();
					this.display();
				}));

		new Setting(containerEl).setName('Resources').setHeading();
		containerEl.createEl('p', {
			text: 'For detailed examples and full documentation, please refer to the following resources:',
		});
		const resourceList = containerEl.createEl('ul').createEl('li');
		resourceList.createEl('a', {
			href: 'https://github.com/gsarig/obsidian-sentinel',
			text: 'The project on GitHub',
		});
	}
}
