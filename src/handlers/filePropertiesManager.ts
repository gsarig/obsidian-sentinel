import * as yaml from "js-yaml"; // Import js-yaml for handling YAML metadata
import { TFile, App } from "obsidian";

/**
 * Increment the view_count of a file by modifying its YAML frontmatter.
 * @param file - The file to modify.
 * @param app - The Obsidian app instance for accessing the vault.
 */
export async function incrementViewCount(file: TFile, app: App): Promise<void> {
    if (!app || !app.vault) {
        console.error("The `app` instance is undefined or invalid.");
        return;
    }

    // Read the file's content
    const content = await app.vault.read(file);

    // Extract the YAML frontmatter block
    const frontmatterMatch = content.match(/^---\n[\s\S]*?\n---\n/);
    let frontmatter: Record<string, any> = {};
    let bodyContent = content;

    if (frontmatterMatch) {
        // Parse the YAML frontmatter into an object
        const frontmatterRaw = frontmatterMatch[0];
        frontmatter = yaml.load(frontmatterRaw.replace(/^---\n/, "").replace(/\n---\n$/, "")) as Record<string, any>;
        // Extract the rest of the file content
        bodyContent = content.substring(frontmatterRaw.length);
    }

    // Increment or initialize the view_count property
    frontmatter.view_count = (frontmatter.view_count || 0) + 1;

    // Serialize the updated frontmatter back to YAML
    const updatedFrontmatter = `---\n${yaml.dump(frontmatter)}---\n`;
    const updatedContent = updatedFrontmatter + bodyContent;

    // Write the updated content back to the file
    await app.vault.modify(file, updatedContent);

    console.log(`Updated "view_count" for file "${file.name}" to: ${frontmatter.view_count}`);
}
