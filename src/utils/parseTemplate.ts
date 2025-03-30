import {Notice, moment} from 'obsidian';
import {getLabel} from './getLabel';

/**
 * Parses a template string containing placeholders like {{date}}, {{time}}, or {{title}}.
 * Placeholders can be embedded anywhere in the text.
 *
 * @param template The template string to parse (can contain multiple placeholders).
 * @param title The title of the current file (optional, defaults to an empty string).
 * @returns A string with all placeholders replaced.
 */
export function parseTemplate(template: string, title: string = ""): string {
    // Find all placeholders in the template
    return template.replace(/{{[^{}]*}}/g, (placeholder) => {
        // Handle {{date}} and its variants
        if (/^{{\s*date(?::([^}]+))?\s*}}$/.test(placeholder)) {
            return placeholder.replace(/{{\s*date(?::([^}]+))?\s*}}/, (_, format) => {
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
                    return placeholder;
                }
            });
        }

        // Handle {{time}} and its variants
        if (/^{{\s*time(?::([^}]+))?\s*}}$/.test(placeholder)) {
            return placeholder.replace(/{{\s*time(?::([^}]+))?\s*}}/, (_, format) => {
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
                    return placeholder;
                }
            });
        }

        // Handle {{title}}
        if (/^{{\s*title\s*}}$/.test(placeholder)) {
            return title || "";
        }

        // Return unrecognized placeholders as-is
        return placeholder;
    });
}
