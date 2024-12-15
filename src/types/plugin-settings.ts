export interface SettingPlugin {
	enabled: boolean;
	instance: {
		options: {
			folder: string | null;
		};
	};
}
