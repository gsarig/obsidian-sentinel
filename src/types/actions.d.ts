interface Action {
	where: string;
	when: 'everyOpen' | 'firstLeave' | 'firstOpen' | 'everyLeave' | 'everyClose' | 'leaveChanged' | 'firstOpenWithReset';
	what: 'property' | 'command';
	propertyName?: string;
	propertyValue?: string;
	commandId?: string;
	skipExisting?: boolean;
}

export interface SentinelPluginSettings {
	actions: Action[];
}
