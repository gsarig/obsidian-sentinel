import * as yaml from "js-yaml";
import { TFile, App } from "obsidian";

export async function propertyUpdater(
    file: TFile, 
    app: App, 
    propertyName: string, 
    updater: (currentValue: number | string) => number | string
): Promise<void> {
    const content = await app.vault.read(file);
    const frontmatterMatch = content.match(/^---\n[\s\S]*?\n---\n/);
    let frontmatter: Record<string, any> = {};
    let bodyContent = content;

    if (frontmatterMatch) {
        const frontmatterRaw = frontmatterMatch[0];
        frontmatter = yaml.load(frontmatterRaw.replace(/^---\n/, "").replace(/\n---\n$/, "")) as Record<string, any>;
        bodyContent = content.substring(frontmatterRaw.length);
    }

    frontmatter[propertyName] = updater(frontmatter[propertyName] || 0);
    const updatedFrontmatter = `---\n${yaml.dump(frontmatter)}---\n`;
    await app.vault.modify(file, updatedFrontmatter + bodyContent);
}
