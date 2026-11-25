/** A date as the site shows it, e.g. "November 1, 2026". */
export const longDate = (date: Date) =>
	date.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		timeZone: 'UTC',
	});

/** The `datetime` value for a `<time>` element, e.g. "2026-11-01". */
export const isoDate = (date: Date) => date.toISOString().slice(0, 10);
