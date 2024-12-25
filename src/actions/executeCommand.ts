import { App } from "obsidian";

/**
 * Execute a 3rd-party plugin command programmatically.
 * @param app - The Obsidian app instance.
 * @param commandId - The ID of the command to execute.
 */
export function executeCommand(app: App, commandId: string): boolean {
    const commands = (app as any).commands;
    if (!commands) return false;

    const command = commands.findCommand(commandId);
    if (!command) {
        console.error(`Command '${commandId}' not found`);
        return false;
    }

    commands.executeCommandById(commandId);
    return true;
}

// executeCommand(app, "editor:open-search");
