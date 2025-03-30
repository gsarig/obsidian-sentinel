export function stripFrontmatter(content: string): string {
	const frontmatterMatch = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
	if (!frontmatterMatch) {
		return content; // No frontmatter found
	}
	return content.slice(frontmatterMatch[0].length);
}
