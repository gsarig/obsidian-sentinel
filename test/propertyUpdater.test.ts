import { describe, it, expect, vi } from 'vitest';
import { propertyUpdater } from '../src/handlers/propertyUpdater';

function makeApp(frontmatter: Record<string, unknown>) {
	return {
		fileManager: {
			processFrontMatter: async (
				_file: unknown,
				fn: (frontmatter: Record<string, unknown>) => void
			) => {
				fn(frontmatter);
			},
		},
	} as any;
}

function makeFile() {
	return { path: 'N.md' } as any;
}

describe('propertyUpdater', () => {
	it('updates the property with the updater result', async () => {
		const frontmatter: Record<string, unknown> = { views: 2 };
		const result = await propertyUpdater(makeFile(), makeApp(frontmatter), 'views', (v) => Number(v) + 1);
		expect(result).toBe(true);
		expect(frontmatter.views).toBe(3);
	});

	it('leaves a boolean property unchanged and does not call the updater', async () => {
		const frontmatter: Record<string, unknown> = { done: true };
		const updater = vi.fn();
		const result = await propertyUpdater(makeFile(), makeApp(frontmatter), 'done', updater);
		expect(result).toBe(true);
		expect(frontmatter.done).toBe(true);
		expect(updater).not.toHaveBeenCalled();
	});

	it('skips existing values when skipExisting is set', async () => {
		const frontmatter: Record<string, unknown> = { views: 5 };
		const updater = vi.fn();
		await propertyUpdater(makeFile(), makeApp(frontmatter), 'views', updater, true);
		expect(frontmatter.views).toBe(5);
		expect(updater).not.toHaveBeenCalled();
	});
});
