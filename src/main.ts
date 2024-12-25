import {Plugin} from 'obsidian';
import {SentinelSettings} from './settings/Settings';
import '../styles.css';
import {actionManager} from "./handlers/actionManager";

// noinspection JSUnusedGlobalSymbols
export default class Sentinel extends Plugin {

	async onload() {

		// Register the settings tab.
		this.addSettingTab(new SentinelSettings(this.app, this));

		// Handle the actions.
		actionManager(this.app);

	}
}
