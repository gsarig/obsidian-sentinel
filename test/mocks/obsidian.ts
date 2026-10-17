// Minimal stand-in for the `obsidian` module used by the unit suite.
// Only what the pure logic under test touches at runtime: `Notice` (a no-op
// here) and `moment` (the real library). `TFile`, `App` and `TagCache` are
// type-only at the call sites and normally elided, but are exported as empty
// stubs so resolution never fails regardless of how imports are transpiled.
import moment from 'moment';

export class Notice {
	constructor(_message?: string) {}
}

export class TFile {}
export class App {}
export class TagCache {}

export { moment };
