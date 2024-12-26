interface Action {
	where: string;
	when: 'everyOpen' | 'firstLeave' | 'firstOpen' | 'leaveChanged';
	what: 'property' | 'command';
	propertyName?: string;
	propertyValue?: string;
	commandId?: string;
}

export interface SentinelPluginSettings {
	actions: Action[];
}
