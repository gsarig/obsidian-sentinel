import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { parseTemplate } from '../src/utils/parseTemplate';

describe('parseTemplate', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		// Local time so both construction and moment formatting agree across timezones.
		vi.setSystemTime(new Date('2026-07-15T09:30:00'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('replaces {{date}} with today in YYYY-MM-DD', () => {
		expect(parseTemplate('{{date}}')).toBe('2026-07-15');
	});

	it('supports a custom date format', () => {
		expect(parseTemplate('{{date:YYYY/MM/DD}}')).toBe('2026/07/15');
	});

	it('supports relative dates', () => {
		expect(parseTemplate('{{date:+7d}}')).toBe('2026-07-22');
	});

	it('replaces {{time}} with HH:mm by default', () => {
		expect(parseTemplate('{{time}}')).toBe('09:30');
	});

	it('replaces {{title}} with the provided title', () => {
		expect(parseTemplate('{{title}}', 'My Note')).toBe('My Note');
	});

	it('passes unknown placeholders through unchanged', () => {
		expect(parseTemplate('{{unknown}}')).toBe('{{unknown}}');
	});

	it('replaces multiple placeholders in one string', () => {
		expect(parseTemplate('{{date}} at {{time}}')).toBe('2026-07-15 at 09:30');
	});
});
