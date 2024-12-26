import { App } from 'obsidian';

export interface Command {
    id: string;
    name: string;
}

export interface Commands {
    executeCommandById: (id: string) => void;
    findCommand: (id: string) => Command | null;
	listCommands: () => Array<Command>;
}

export interface AppWithCommands extends App {
    commands: Commands;
}
