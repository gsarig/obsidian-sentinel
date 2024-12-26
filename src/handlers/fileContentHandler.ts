import { App, TFile, Notice } from 'obsidian';
import { getLabel } from '../utils/getLabel';

export async function safeReadFile(app: App, file: TFile): Promise<string | null> {
    try {
        return await app.vault.read(file);
    } catch (error) {
        new Notice(getLabel('errorReadingFile'));
        return null;
    }
}
