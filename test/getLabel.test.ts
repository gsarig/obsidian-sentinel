import { describe, it, expect } from 'vitest';
import { getLabel } from '../src/utils/getLabel';

describe('getLabel', () => {
	it('returns a plain label unchanged', () => {
		expect(getLabel('errorReadingFile')).toBe('Error reading the file.');
	});

	it('substitutes a {placeholder} from replacements', () => {
		expect(getLabel('failedUpdatingProperty', { label: 'views' })).toBe(
			'Failed to update property: views',
		);
	});

	it('leaves the token in place when no replacement is provided', () => {
		expect(getLabel('invalidWhere')).toBe(
			"Invalid regex or comparison error in 'where': {label}",
		);
	});

	it('throws for an unknown label key', () => {
		// @ts-expect-error deliberately passing a key that is not in labels.json
		expect(() => getLabel('nope')).toThrow();
	});
});
