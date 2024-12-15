import {Plugin, TFile, Notice, TAbstractFile} from 'obsidian';
import {SentinelSettings} from './settings/Settings';
import {getLabel} from './utils/getLabel';
import '../styles.css';

// noinspection JSUnusedGlobalSymbols
export default class Sentinel extends Plugin {

	async onload() {

		// Register the settings tab
		this.addSettingTab(new SentinelSettings(this.app, this));
	}
}
