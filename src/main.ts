import {Plugin} from 'obsidian';
import {DEFAULT_SETTINGS} from './settings/settingsConfig';
import {SentinelPluginSettings} from './types/actions';
import {SentinelSettings} from './settings/Settings';
import {actionManager} from './handlers/actionManager';
import '../styles.css';

export default class Sentinel extends Plugin {

	settings: SentinelPluginSettings;

	async onload() {

		// Register the settings tab.
		this.settings = Object.assign({}, DEFAULT_SETTINGS);
		await this.loadData().then((data) => {
			if (data) {
				this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
			}
		});
		this.addSettingTab(new SentinelSettings(this.app, this));

		// Handle the actions.
		actionManager(this.app, this.settings);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
