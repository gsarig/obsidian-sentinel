import { describe, it, expect } from 'vitest';
import { stripFrontmatter } from '../src/utils/stripFrontmatter';

describe('stripFrontmatter', () => {
	it('removes a leading frontmatter block', () => {
		const input = '---\ntitle: A\n---\nBody text';
		expect(stripFrontmatter(input)).toBe('Body text');
	});

	it('returns content unchanged when there is no frontmatter', () => {
		expect(stripFrontmatter('Just body')).toBe('Just body');
	});

	it('handles CRLF line endings', () => {
		const input = '---\r\ntitle: A\r\n---\r\nBody';
		expect(stripFrontmatter(input)).toBe('Body');
	});

	it('only strips the first frontmatter block', () => {
		const input = '---\na: 1\n---\nBody\n---\nc: 2\n---\n';
		expect(stripFrontmatter(input)).toBe('Body\n---\nc: 2\n---\n');
	});
});
