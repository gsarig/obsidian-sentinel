import {Plugin} from 'obsidian';
import {SentinelSettings} from './settings/Settings';
import {registerActiveLeafChange} from './handlers/activeLeaf';
import '../styles.css';
import {incrementViewCount} from "./handlers/filePropertiesManager";

// noinspection JSUnusedGlobalSymbols
export default class Sentinel extends Plugin {

	async onload() {

		// Register the settings tab
		this.addSettingTab(new SentinelSettings(this.app, this));

		registerActiveLeafChange(this.app, (file, app, triggerType) => {
			if (triggerType === 'firstOpen') {
				// Handle first-time opening of a note
				incrementViewCount(file, app);
			} else if (triggerType === 'modification') {
				// Handle subsequent modifications
				incrementViewCount(file, app);
			}
		});

	}
}
