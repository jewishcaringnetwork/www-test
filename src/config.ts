import data from '../content/site.json' with { type: 'json' };
import { siteSchema } from './schemas/site.ts';

// bad data fails the build
const editable = siteSchema.parse(data);

export const telHref = (phone: string) => `tel:+1${phone.replaceAll('-', '')}`;

export const org = {
	...editable.org,
	// locked: put these last so nothing in the JSON can override them
	name: 'Jewish Caring Network',
	legalName: 'Jewish Caring Network',
	ein: '52-2224452',
};

export const site = {
	...editable.site,
	name: org.name,
};

export const finance = editable.finance;

/** JCN's public profiles, linked from the ratings. Locked: not in content. */
export const ratingProfiles = {
	candid: 'https://app.candid.org/profile/7788538',
	charityNavigator: 'https://www.charitynavigator.org/ein/522224452',
};

export interface NavLink {
	label: string;
	href: string;
}

export interface NavMenu {
	label: string;
	/** Link to the section's landing page, shown first in the dropdown */
	overview?: NavLink;
	items?: NavLink[];
	href?: string;
}

export const mainNav: NavMenu[] = [
	{
		label: 'About Us',
		overview: { label: 'About JCN', href: '/about' },
		items: [
			{ label: 'Leadership', href: '/about/leadership' },
			{ label: 'History', href: '/about/history' },
			{ label: 'Family Stories', href: '/family-stories' },
		],
	},
	{ label: 'Services', href: '/services' },
	{ label: 'Tikva House', href: '/tikva-house' },
	{
		label: 'Get Involved',
		overview: { label: 'All ways to help', href: '/get-involved' },
		items: [
			{ label: 'Volunteer', href: '/get-involved/volunteer' },
			{ label: 'Donate', href: '/donate' },
		],
	},
];

export const footerLinks: NavLink[] = [
	{ label: 'Donate', href: '/donate' },
	{ label: 'Volunteer', href: '/get-involved/volunteer' },
	{ label: 'Tikva House', href: '/tikva-house' },
	{ label: 'Family Stories', href: '/family-stories' },
	{ label: 'Contact Us', href: '/contact' },
];

/** Privacy, terms and similar. Empty until the client adds legal pages. */
export const legalLinks: NavLink[] = [];
