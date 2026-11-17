export const site = {
	name: 'Jewish Caring Network',
	tagline: 'Supporting families facing serious illness since 1996',
	description:
		'Free, long-term, family-centered support for Jewish families facing serious illness in Baltimore and beyond.',
	legalName: 'Jewish Caring Network',
	ein: '52-2224452',
	email: 'info@jewishcaringnetwork.org',
	phone: { display: '410-602-6075', href: 'tel:+14106026075' },
	fax: '410-602-6076',
	address: ['5806 Park Heights Ave', 'Baltimore, MD 21215'],
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
			{ label: 'Volunteer', href: '/volunteer' },
			{ label: 'Tehillim List', href: '/tehillim' },
			{ label: 'Ways to Give', href: '/donate' },
		],
	},
];

export const footerLinks: NavLink[] = [
	{ label: 'Ways to Give', href: '/donate' },
	{ label: 'Volunteer', href: '/volunteer' },
	{ label: 'Plan Your Stay', href: '/tikva-house' },
	{ label: 'Family Stories', href: '/family-stories' },
	{ label: 'Contact Us', href: '/contact' },
];

export const legalLinks: NavLink[] = [
	{ label: 'Privacy Policy', href: '/privacy' },
	{ label: 'Terms & Conditions', href: '/terms' },
];
