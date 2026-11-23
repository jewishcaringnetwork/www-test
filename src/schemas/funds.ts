/**
 * Funds a donation can be designated to, and how a link preselects one.
 *
 * The labels are the options of the "Funds" dropdown on JCN's Admire donation
 * form (an Admire custom field). Admire preselects one from the form URL, e.g.
 * `?Funds=Tikva%20House`, and only when the value matches an option exactly,
 * so keep these in sync with Admire. Site links use a slug instead
 * (`/donate?fund=tikva-house`); `/donate` maps it back to the label, and
 * ignores anything not in this list.
 */

export const donateEmbedUrl =
	'https://jewishcaringnetwork.admirepro.app/donate';

export const funds = [
	'General',
	'Tikva House',
	'Chanukah Toys',
	'Food & Shabbos Packages',
	'Cleaning Help',
	'Nursing Care',
	'Health & Therapies',
	'Babysitting',
	'Respite & Retreats',
	'Flowers',
	'Birthday & Anniversary Gifts',
	'JCC Membership',
	'Holiday Packages',
	'Yom Tov Clothing',
	'Summer Camp',
	'Dress Gmach',
	'Toys',
] as const;

export type Fund = (typeof funds)[number];

/** "Food & Shabbos Packages" → "food-shabbos-packages" */
export const fundSlug = (fund: Fund) =>
	fund.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const fundSlugs = funds.map(fundSlug);

export const fundBySlug = (slug: string | null | undefined): Fund | undefined =>
	funds.find((fund) => fundSlug(fund) === slug);

/** The Admire form URL, with `fund` preselected when it's a known fund. */
export const donateEmbedSrc = (fund?: Fund) =>
	// %20, not URLSearchParams' "+": the form was tested with %20
	fund ? `${donateEmbedUrl}?Funds=${encodeURIComponent(fund)}` : donateEmbedUrl;
