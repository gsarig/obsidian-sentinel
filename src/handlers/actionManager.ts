import {App} from 'obsidian';
import {eventTracker} from './eventTracker';
import {executeCommand} from '../actions/executeCommand';
import {updateProperty} from "../actions/updateProperty";
import {incrementProperty} from "../actions/incrementProperty";

export function actionManager(app: App) {
	eventTracker(app, async (file, triggerType) => {
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
				await updateProperty(file, app, 'updated', '{{date:YYYY-MM-DD HH:mm:ss}}');
				await incrementProperty(file, app, 'view_count', 1);
				break;
		}
	});
}
