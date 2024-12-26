import { Plugin } from "obsidian"; // Import the base Plugin class
import { SentinelPluginSettings } from "../types/actions";

export const DEFAULT_SETTINGS: SentinelPluginSettings = {
    actions: [],
};

/**
 * Extend the Plugin interface to include our specific settings
 */
export interface SentinelPlugin extends Plugin {
    settings: SentinelPluginSettings;
    saveSettings(): Promise<void>;
}
