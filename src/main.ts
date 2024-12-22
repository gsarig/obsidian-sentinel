import {Plugin} from 'obsidian';
import {SentinelSettings} from './settings/Settings';
import {eventTracker} from './handlers/eventTracker';
import '../styles.css';
import {incrementViewCount} from "./handlers/filePropertiesManager";

// noinspection JSUnusedGlobalSymbols
export default class Sentinel extends Plugin {

	async onload() {

		// Register the settings tab
		this.addSettingTab(new SentinelSettings(this.app, this));

		eventTracker(this.app, (file, triggerType) => {
			switch (triggerType) {
				case 'firstLeave':
					console.log(`File ${file.path} lost focus for the first time`);
					break;
				case 'leave':
					console.log(`File ${file.path} lost focus (subsequent time)`);
					break;
				case 'firstOpen':
					console.log(`File ${file.path} opened for the first time`);
					break;
				case 'hasChanges':
					console.log(`File ${file.path} was modified`);
					break;
				case 'isChanging':
					console.log('File modified while editing:', file.path);
					break;
			}
		});
	}
}
