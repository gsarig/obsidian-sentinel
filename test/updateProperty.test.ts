import { describe, it, expect, vi, beforeEach } from 'vitest';

const incrementProperty = vi.fn().mockResolvedValue(1);
const propertyUpdater = vi.fn().mockResolvedValue(undefined);

vi.mock('../src/actions/incrementProperty', () => ({ incrementProperty }));
vi.mock('../src/handlers/propertyUpdater', () => ({ propertyUpdater }));

const { updateProperty } = await import('../src/actions/updateProperty');

function makeFile() {
	return { basename: 'N' } as any;
}

function makeApp() {
	return { vault: {} } as any;
}

describe('updateProperty', () => {
	beforeEach(() => {
		incrementProperty.mockClear();
		propertyUpdater.mockClear();
	});

	it('routes {{increment}} to incrementProperty with default initial value and step', async () => {
		await updateProperty(makeFile(), makeApp(), 'views', '{{increment}}');
		expect(incrementProperty).toHaveBeenCalledWith(makeFile(), makeApp(), 'views', 0, 1);
	});

	it('routes {{increment:100,10}} to incrementProperty with the parsed initial value and step', async () => {
		await updateProperty(makeFile(), makeApp(), 'views', '{{increment:100,10}}');
		expect(incrementProperty).toHaveBeenCalledWith(makeFile(), makeApp(), 'views', 100, 10);
	});

	it('routes {{increment:5}} to incrementProperty with a default step', async () => {
		await updateProperty(makeFile(), makeApp(), 'views', '{{increment:5}}');
		expect(incrementProperty).toHaveBeenCalledWith(makeFile(), makeApp(), 'views', 5, 1);
	});

	it('routes a non-increment template to propertyUpdater with the parsed value', async () => {
		await updateProperty(makeFile(), makeApp(), 'title', '{{title}}');
		expect(propertyUpdater).toHaveBeenCalledTimes(1);
		const [file, app, propertyName, valueFn] = propertyUpdater.mock.calls[0];
		expect(file).toEqual(makeFile());
		expect(app).toEqual(makeApp());
		expect(propertyName).toBe('title');
		expect(valueFn()).toBe('N');
	});
});
