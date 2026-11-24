import { z } from 'astro/zod';

export const phoneSchema = z
	.string()
	.regex(/^\d{3}-\d{3}-\d{4}$/, 'Use the format 410-602-6075');

export const addressSchema = z
	.strictObject({
		street: z.string().trim().min(3).max(100)
			.meta({
				description:
					'Street line, e.g. "5806 Park Heights Ave". No city or zip.',
			}),
		city: z.string().trim().min(2).max(50).meta({ description: 'City name.' }),
		state: z.string().regex(/^[A-Z]{2}$/, 'Two-letter code, e.g. MD')
			.meta({ description: 'Two-letter US state code, uppercase.' }),
		zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Use 21215 or 21215-1234')
			.meta({ description: '5-digit ZIP, optionally ZIP+4.' }),
	})
	.meta({ description: 'Street address.' });

export const contactSchema = z.strictObject({
	phone: phoneSchema.meta({
		description:
			'US phone number formatted like 410-602-6075. Used for display and tap-to-call.',
	}),
	fax: phoneSchema.optional().meta({
		description:
			'Fax number formatted like 410-602-6076. Display only, not a link. Omit if none.',
	}),
	email: z.email().max(100).meta({
		description: 'Public contact email address.',
	}),
	address: addressSchema,
});

export const financeSchema = z
	.strictObject({
		candid: z
			.strictObject({
				seal: z.enum(['bronze', 'silver', 'gold', 'platinum']).meta({
					description: 'Seal of Transparency level, as on the seal itself.',
				}),
				year: z.int().min(2020).max(2100).meta({
					description: 'The year printed on the seal, e.g. 2026.',
				}),
			})
			.optional()
			.meta({
				description:
					"JCN's current Candid Seal of Transparency. The seal image is stored in code per level and year, so a new level or year fails the build until a developer adds that image: tell staff so. Omit to stop showing the seal.",
			}),
		charityNavigator: z
			.strictObject({
				stars: z.int().min(1).max(4).meta({
					description: "JCN's current Charity Navigator star rating, 1 to 4.",
				}),
				year: z.int().min(2020).max(2100).meta({
					description: 'The year printed on the rating badge, e.g. 2026.',
				}),
			})
			.optional()
			.meta({
				description:
					"JCN's current Charity Navigator rating. The badge image is stored in code per star count and year; until a developer adds the image for a new rating or year, the site shows a plain text badge instead: tell staff so. Omit to stop showing the rating.",
			}),
	})
	.meta({
		description:
			"Charity ratings shown in the footer and on the Donate page, each linking to JCN's profile on that site. Update when a rating changes or a new seal year arrives.",
	});

export const siteSchema = z.strictObject({
	site: z
		.strictObject({
			tagline: z.string().trim().min(10).max(70).meta({
				description:
					'One short line in the top banner (desktop only). No trailing period.',
			}),
			description: z.string().trim().min(50).max(160).meta({
				description:
					'One-sentence summary of JCN. Shown in the footer and used as the default search-engine description.',
			}),
		})
		.meta({ description: 'Site-wide text.' }),
	org: contactSchema.meta({
		description: 'Main office contact details, shown in the banner and footer.',
	}),
	finance: financeSchema,
});

export type SiteContent = z.infer<typeof siteSchema>;
