import moment from "moment";
import {Notice} from 'obsidian';
import {getLabel} from './getLabel';

/**
 * Parses a single placeholder in the template, supporting `{{date}}`, `{{time}}`, or `{{title}}`.
 * If the input does not match a valid placeholder, it returns the string as-is.
 * @param template The template string to parse (should only contain one placeholder).
 * @param title The title of the current file (optional, defaults to an empty string).
 * @returns A string with the placeholder replaced or the original string if no match.
 */
export function parseTemplate(template: string, title: string = ""): string {
	// Handle {{date}} and its variants
	if (/^{{\s*date(?::([^}]+))?\s*}}$/.test(template)) {
		return template.replace(/{{\s*date(?::([^}]+))?\s*}}/, (_, format) => {
			if (!format || format.trim() === "today") {
				// Default to today's date
				return moment().format("YYYY-MM-DD");
			}

			// Handle relative dates like `{{date:+7d}}` or `{{date:-1M}}`
			const matchRelative = format.match(/^([+-]\d+)([dMyw])$/); // e.g., +7d, -1M
			if (matchRelative) {
				const amount = parseInt(matchRelative[1], 10);
				const unit = matchRelative[2]; // d=days, M=months, y=years, w=weeks
				return moment().add(amount, unit).format("YYYY-MM-DD");
			}

			// Handle specific moment.js formats, e.g., {{date:YYYY-MM-DD}}
			try {
				return moment().format(format);
			} catch (err) {
				new Notice(getLabel('invalidDateFormat', {
					label: format,
				}));
				return template; // If format is invalid, return the original string
			}
		});
	}

	// Handle {{time}} and its variants
	if (/^{{\s*time(?::([^}]+))?\s*}}$/.test(template)) {
		return template.replace(/{{\s*time(?::([^}]+))?\s*}}/, (_, format) => {
			if (!format) {
				// Default to the current time
				return moment().format("HH:mm");
			}

			// Handle specific moment.js formats, e.g., {{time:HH:mm:ss}}
			try {
				return moment().format(format);
			} catch (err) {
				new Notice(getLabel('invalidTimeFormat', {
					label: format,
				}));
				return template; // If format is invalid, return the original string
			}
		});
	}

	// Handle {{title}}
	if (/^{{\s*title\s*}}$/.test(template)) {
		// Replace {{title}} with the provided title
		return title || "";
	}

	// Return input string as-is if it doesn't match a placeholder
	return template;
}
