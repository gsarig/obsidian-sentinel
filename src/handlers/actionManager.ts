import {App, Notice} from 'obsidian';
import {eventTracker} from './eventTracker';
import {executeCommand} from '../actions/executeCommand';
import {updateProperty} from '../actions/updateProperty';
import {shouldRunAction} from '../utils/shouldRunAction';
import {AppWithCommands} from '../types/commands';
import {SentinelPluginSettings} from '../types/actions';
import {getLabel} from '../utils/getLabel';

export function actionManager(app: App, settings: SentinelPluginSettings) {

	eventTracker(app, async (file, triggerType) => {
		// Loop through all actions in settings
		const matchingActions = settings.actions.filter(action => action.when === triggerType);

		// Log each matching action.
		for (const action of matchingActions) {
			if (!shouldRunAction(action.where, file)) {
				continue;
			}
			if (action.what === 'property' && action.propertyName && action.propertyValue) {
				try {
					await updateProperty(
						file,
						app,
						action.propertyName,
						action.propertyValue
					);
				} catch (error) {
					new Notice(getLabel('failedUpdatingProperty', {
						label: action.propertyName,
					}));
				}
			} else if (action.what === 'command' && action.commandId) {
				try {
					executeCommand(app as AppWithCommands, action.commandId);
				} catch (error) {
					new Notice(getLabel('failedExecutingCommand', {
						label: action.commandId,
					}));
				}
			}
		}
	});
}
