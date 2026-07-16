import { describe, it, expect } from 'vitest';
import { shouldRunAction } from '../src/utils/shouldRunAction';

// Minimal fakes for the Obsidian types the function reads at runtime.
function makeFile(path: string) {
	const basename = (path.split('/').pop() ?? '').replace(/\.md$/, '');
	return { path, basename } as any;
}

function makeApp(cache: Record<string, unknown> = {}) {
	return { metadataCache: { getFileCache: () => cache } } as any;
}

describe('shouldRunAction', () => {
	it('runs on every note when "where" is empty', () => {
		expect(shouldRunAction('', makeFile('Any.md'), makeApp())).toBe(true);
		expect(shouldRunAction(undefined, makeFile('Any.md'), makeApp())).toBe(true);
	});

	describe('tags', () => {
		it('matches a frontmatter tag', () => {
			const app = makeApp({ frontmatter: { tags: ['tag-1'] } });
			expect(shouldRunAction('#tag-1', makeFile('N.md'), app)).toBe(true);
		});

		it('matches an inline tag', () => {
			const app = makeApp({ tags: [{ tag: '#tag-1' }] });
			expect(shouldRunAction('#tag-1', makeFile('N.md'), app)).toBe(true);
		});

		it('does not match an absent tag', () => {
			const app = makeApp({ frontmatter: { tags: ['other'] } });
			expect(shouldRunAction('#tag-1', makeFile('N.md'), app)).toBe(false);
		});
	});

	describe('folders', () => {
		it('matches a note inside the folder (case-insensitive)', () => {
			expect(shouldRunAction('Folder/', makeFile('Folder/N.md'), makeApp())).toBe(true);
			expect(shouldRunAction('folder/', makeFile('Folder/N.md'), makeApp())).toBe(true);
		});

		it('does not match a note outside the folder', () => {
			expect(shouldRunAction('Folder/', makeFile('Other/N.md'), makeApp())).toBe(false);
		});
	});

	describe('exact note name', () => {
		it('matches by basename, case-insensitive', () => {
			expect(shouldRunAction('My Note', makeFile('My note.md'), makeApp())).toBe(true);
		});

		it('does not match a different name', () => {
			expect(shouldRunAction('My Note', makeFile('Other.md'), makeApp())).toBe(false);
		});
	});

	describe('regex', () => {
		it('matches a path pattern', () => {
			expect(shouldRunAction('/^Recipe-/', makeFile('Recipe-1.md'), makeApp())).toBe(true);
		});

		it('rejects a non-matching path', () => {
			expect(shouldRunAction('/^Recipe-/', makeFile('Note.md'), makeApp())).toBe(false);
		});
	});

	describe('negation', () => {
		it('runs on notes without the tag', () => {
			const app = makeApp({ frontmatter: { tags: ['other'] } });
			expect(shouldRunAction('!#tag-1', makeFile('N.md'), app)).toBe(true);
		});

		it('does not run on notes with the tag', () => {
			const app = makeApp({ frontmatter: { tags: ['tag-1'] } });
			expect(shouldRunAction('!#tag-1', makeFile('N.md'), app)).toBe(false);
		});
	});

	describe('comma combinations', () => {
		it('matches when ANY non-negated condition is true', () => {
			const app = makeApp({ frontmatter: { tags: ['tag-1'] } });
			expect(shouldRunAction('#tag-1,Other/', makeFile('Wherever/N.md'), app)).toBe(true);
		});

		it('requires ALL negated conditions to hold', () => {
			const clean = makeApp({ frontmatter: { tags: ['keep'] } });
			expect(shouldRunAction('!#tag-1,!Folder/', makeFile('Elsewhere/N.md'), clean)).toBe(true);

			const tagged = makeApp({ frontmatter: { tags: ['tag-1'] } });
			expect(shouldRunAction('!#tag-1,!Folder/', makeFile('Elsewhere/N.md'), tagged)).toBe(false);
		});
	});
});
