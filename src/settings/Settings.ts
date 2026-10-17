import {App, PluginSettingTab, SettingDefinitionGroup, SettingDefinitionItem, SettingGroupItem} from 'obsidian';
import {SentinelPlugin} from './settingsConfig';
import {Action} from '../types/actions';
import {AppWithCommands} from '../types/commands';
import {CommandSuggest} from './CommandSuggest';
import {getLabel} from '../utils/getLabel';

// Control keys address one field of one action, e.g. "actions.2.where".
const ACTION_KEY = /^actions\.(\d+)\.(where|when|what|propertyName|propertyValue|skipExisting)$/;

type ActionField = 'where' | 'when' | 'what' | 'propertyName' | 'propertyValue' | 'skipExisting';

export class SentinelSettings extends PluginSettingTab {
	plugin: SentinelPlugin;

	constructor(app: App, plugin: SentinelPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		const actionGroups = this.plugin.settings.actions.map((action, index) => this.actionGroup(action, index));

		return [
			...actionGroups,
			{
				type: 'group',
				items: [{
					name: getLabel('addAction'),
					action: () => {
						void this.addAction();
					},
				}],
			},
			{
				type: 'group',
				heading: getLabel('resourcesHeading'),
				items: [{
					name: getLabel('resourcesDocumentation'),
					desc: this.resourcesDescription(),
				}],
			},
		];
	}

	getControlValue(key: string): unknown {
		const target = this.resolveKey(key);
		if (!target) {
			return super.getControlValue(key);
		}
		return target.action[target.field];
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		const target = this.resolveKey(key);
		if (!target) {
			await super.setControlValue(key, value);
			return;
		}
		const {action, field} = target;
		(action as unknown as Record<ActionField, unknown>)[field] = value;

		if (field === 'what') {
			// Drop the fields of the action type we switched away from, so a
			// stale command or property never runs.
			if (value === 'property') {
				action.commandId = undefined;
			} else {
				action.propertyName = undefined;
				action.propertyValue = undefined;
			}
		}

		await this.plugin.saveSettings();

		if (field === 'what') {
			// The group's fields depend on "what", so rebuild the definitions.
			this.update();
		}
	}

	private actionGroup(action: Action, index: number): SettingDefinitionGroup {
		const key = (field: ActionField) => `actions.${index}.${field}`;

		const typeFields: SettingGroupItem[] = action.what === 'property'
			? [
				{name: getLabel('settingPropertyName'), control: {type: 'text', key: key('propertyName')}},
				{name: getLabel('settingValue'), control: {type: 'text', key: key('propertyValue')}},
				{name: getLabel('settingSkipExisting'), control: {type: 'toggle', key: key('skipExisting'), defaultValue: false}},
			]
			: [{
				name: getLabel('settingCommand'),
				// A render item rather than a text control: the field needs the
				// command suggester attached to its input.
				render: (setting) => {
					setting.addText((text) => {
						text
							.setValue(action.commandId ?? '')
							.setPlaceholder(getLabel('settingCommandPlaceholder'))
							.onChange(async (value) => {
								action.commandId = value;
								await this.plugin.saveSettings();
							});
						new CommandSuggest(this.app as AppWithCommands, text.inputEl);
					});
				},
			}];

		return {
			type: 'group',
			heading: getLabel('actionHeading', {label: String(index + 1)}),
			cls: 'sentinel--action-container',
			items: [
				{name: getLabel('settingWhere'), control: {type: 'text', key: key('where')}},
				{
					name: getLabel('settingWhen'),
					control: {
						type: 'dropdown',
						key: key('when'),
						options: {
							everyOpen: getLabel('whenEveryOpen'),
							firstOpen: getLabel('whenFirstOpen'),
							firstOpenWithReset: getLabel('whenFirstOpenWithReset'),
							everyClose: getLabel('whenEveryClose'),
							everyLeave: getLabel('whenEveryLeave'),
							firstLeave: getLabel('whenFirstLeave'),
							leaveChanged: getLabel('whenLeaveChanged'),
							leaveChangedNoFrontmatter: getLabel('whenLeaveChangedNoFrontmatter'),
						},
					},
				},
				{
					name: getLabel('settingWhat'),
					control: {
						type: 'dropdown',
						key: key('what'),
						options: {
							property: getLabel('whatProperty'),
							command: getLabel('whatCommand'),
						},
					},
				},
				...typeFields,
				{
					name: getLabel('removeAction'),
					action: () => {
						void this.removeAction(index);
					},
				},
			],
		};
	}

	private resolveKey(key: string): {action: Action; field: ActionField} | null {
		const match = ACTION_KEY.exec(key);
		if (!match) {
			return null;
		}
		const action = this.plugin.settings.actions[Number(match[1])];
		return action ? {action, field: match[2] as ActionField} : null;
	}

	private async addAction(): Promise<void> {
		this.plugin.settings.actions.push({
			where: '',
			when: 'firstOpen',
			what: 'property',
		});
		await this.plugin.saveSettings();
		this.update();
	}

	private async removeAction(index: number): Promise<void> {
		this.plugin.settings.actions.splice(index, 1);
		await this.plugin.saveSettings();
		this.update();
	}

	private resourcesDescription(): DocumentFragment {
		const fragment = createFragment();
		fragment.appendText(getLabel('resourcesDescription'));
		fragment.createEl('a', {
			href: 'https://github.com/gsarig/obsidian-sentinel',
			text: getLabel('resourcesLinkText'),
		});
		fragment.appendText('.');
		return fragment;
	}
}
