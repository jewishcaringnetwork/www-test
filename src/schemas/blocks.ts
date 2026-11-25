import { z } from 'astro/zod';
import {
	actionSchema,
	hierarchy,
	hrefSchema,
	iconSchema,
	imageSchema,
	linkSchema,
	linkText,
	markdown,
	type SchemaFns,
	sectionHeader,
	text,
} from './shared.ts';
import { addressSchema, phoneSchema } from './site.ts';

const actions = (min: number, max: number) =>
	z.array(actionSchema).min(min).max(max).meta({
		description: `${hierarchy.actions} ${hierarchy.whenUnsure}`,
	});

// Page header: a plain header or a landing-page hero

export const headerSchema = (fns: SchemaFns) => {
	const header = z
		.strictObject({
			type: z.literal('header').default('header'),
			heading: text(3, 70).optional().meta({
				description: 'Page heading. Omit to use the page title.',
			}),
			lead: text(10, 300).optional().meta({
				description: 'One or two sentences under the heading.',
			}),
		})
		.meta({
			description:
				'The standard page opener: heading and optional lead. Use this for almost every page, including section overviews like About. It has no image, buttons or link; those exist only on the hero, which is reserved for landing pages.',
		});

	const hero = z
		.strictObject({
			type: z.literal('hero'),
			brand: z.enum(['tikva-house']).optional().meta({
				description:
					'Program logo shown above the heading, for a landing page about that program (e.g. "tikva-house" on the Tikva House page). Omit on pages about JCN as a whole; the site header already shows the JCN logo.',
			}),
			heading: text(3, 70).meta({
				description:
					'The page\'s main message, e.g. "When serious illness strikes, the entire family is affected."',
			}),
			lead: text(10, 300).meta({
				description: 'One or two sentences under the heading.',
			}),
			image: imageSchema(
				fns,
				'Photo or illustration shown beside the text in a 4:3 frame. An illustration is an SVG drawn at 4:3, with no text in it: put words in the heading and lead. It is decoration, so it is hidden on phones. Omit for a text-only hero.',
			).optional(),
			actions: actions(0, 2).default([]),
			link: linkSchema.optional(),
		})
		.meta({ description: `${hierarchy.hero} ${hierarchy.audience}` });

	return z.discriminatedUnion('type', [header, hero]).meta({
		description:
			`Page opener. Use "header" unless this is a landing page. ${hierarchy.whenUnsure}`,
	});
};

// Blocks

const prose = z
	.strictObject({
		type: z.literal('prose'),
		markdown: markdown(5000),
	})
	.meta({ description: 'General text: paragraphs, subheadings and lists.' });

const mediaText = (fns: SchemaFns) =>
	z
		.strictObject({
			type: z.literal('mediaText'),
			heading: text(3, 70),
			markdown: markdown(2000),
			images: z.array(imageSchema(fns)).min(1).max(2),
			imageSide: z.enum(['start', 'end']).default('end').meta({
				description:
					'Which side the images sit on. Alternate between neighbouring mediaText blocks.',
			}),
		})
		.meta({ description: 'Text beside one or two photos.' });

const cards = z
	.strictObject({
		type: z.literal('cards'),
		...sectionHeader,
		items: z
			.array(
				z.strictObject({
					title: text(2, 60),
					text: text(10, 300).meta({
						description:
							'One line naming specifics, so the title does not carry it alone.',
					}),
					icon: iconSchema.optional(),
					link: z
						.strictObject({
							href: hrefSchema,
							label: linkText(2, 40).optional().meta({
								description:
									'Omit to make the card\'s title the link; that is usually enough. Add a label only when it says more than the title, e.g. title "Volunteer", label "Sign up for a shift".',
							}),
						})
						.optional()
						.meta({ description: 'Where the card leads. Omit if nowhere.' }),
				}),
			)
			.min(2)
			.max(6),
		link: linkSchema.optional().meta({
			description:
				`Shown below the cards, e.g. "See all services". ${hierarchy.quietLink}`,
		}),
	})
	.meta({ description: 'A grid of short cards, e.g. a teaser of services.' });

const impactSource = z
	.strictObject({
		document: text(3, 120).meta({
			description:
				'Exact file name or title of the document the figure was copied from, e.g. "JCN26 Infographic WWW.pdf".',
		}),
		date: z.iso.date().meta({
			description:
				'Date of that document as YYYY-MM-DD: the date printed on it, or when it was made if none is printed.',
		}),
	})
	.meta({
		description:
			'Where the figure comes from. Not shown on the page: it lets staff check the figure and see when it is out of date.',
	});

const impact = z
	.strictObject({
		type: z.literal('impact'),
		...sectionHeader,
		items: z
			.array(
				z.strictObject({
					value: text(1, 12).meta({
						description:
							'The figure exactly as the source gives it, e.g. "30", "21,000" or "20,000+". Never round up or estimate.',
					}),
					label: text(2, 80).meta({
						description:
							'What it counts, with its period when it has one, e.g. "meals provided each year" or "overnight stays at Tikva House in 13 years".',
					}),
					source: impactSource,
				}),
			)
			.min(2)
			.max(8)
			.meta({
				description:
					'The figures, most telling first. Two to four suit a teaser; use more only on a page about impact.',
			}),
		link: linkSchema.optional().meta({
			description:
				`Shown below the figures, e.g. "See our impact". ${hierarchy.quietLink}`,
		}),
	})
	.meta({
		description:
			'Impact numbers, shown large. Numbers are a trust claim: use only figures from a document the organization published, give each its source, and never invent or estimate one.',
	});

const faq = z
	.strictObject({
		type: z.literal('faq'),
		...sectionHeader,
		items: z
			.array(
				z.strictObject({
					question: text(5, 150),
					answer: markdown(1500).meta({
						description:
							'Markdown answer. Allowed: paragraphs, lists, **bold**, *italic* and [links](/path). No headings.',
					}),
				}),
			)
			.min(1)
			.max(12),
	})
	.meta({ description: 'Questions and answers.' });

const cta = z
	.strictObject({
		type: z.literal('cta'),
		heading: text(3, 70),
		text: text(10, 250).optional(),
		actions: actions(1, 2),
		tone: z.enum(['brand', 'subtle']).default('brand').meta({
			description:
				'brand: colored band for the main ask. subtle: quieter, e.g. for support or a secondary ask.',
		}),
	})
	.meta({ description: `${hierarchy.cta} ${hierarchy.whenUnsure}` });

// Name, address, phone and email of one place: a contact panel, or a place
// listed beside a form
const place = {
	name: text(2, 80).meta({
		description: 'Name of the place, e.g. "The Tikva House".',
	}),
	address: addressSchema,
	phone: phoneSchema.meta({
		description: 'Phone formatted like 410-534-1033. Shown as tap-to-call.',
	}),
	email: z.email().max(100).optional(),
};

const contact = (fns: SchemaFns) =>
	z
		.strictObject({
			type: z.literal('contact'),
			...sectionHeader,
			...place,
			image: imageSchema(fns, 'Photo of the place, e.g. its exterior.')
				.optional(),
			link: linkSchema.optional(),
		})
		.meta({ description: 'Contact details for one location.' });

const form = z
	.strictObject({
		type: z.literal('form'),
		...sectionHeader,
		form: z.enum(['contact', 'volunteer', 'tehillim', 'story', 'donate']).meta({
			description:
				'Which form to show. Fields are fixed in code (src/schemas/forms.ts). Each form goes on one page only, and the build fails otherwise: "contact" on /contact, "volunteer" on /get-involved/volunteer, "story" on /family-stories/share; link other pages there. "donate" is the Admire donation form; use it once, on the Donate page (/donate), and link other pages there instead (/donate?fund=… preselects a fund). "donate" ignores confirmation: Admire shows its own. Submissions to "contact", "volunteer" and "story" are emailed to JCN staff.',
		}),
		confirmation: text(10, 250).optional().meta({
			description:
				"Message shown in place of the form after it is sent. Omit to use the form's default; set it only when this page needs a different reply, e.g. a timeframe.",
		}),
		locations: z
			.array(z.strictObject(place).meta({ description: 'One place.' }))
			.min(1)
			.max(2)
			.optional()
			.meta({
				description:
					'Places people can also call, write to or visit, listed in a quieter column beside the form (below it on phones), e.g. both addresses on the Contact page. The form stays the main thing. Omit on other pages, and for one place with a photo or link use a contact block instead. Ignored by "donate".',
			}),
	})
	.meta({ description: 'A form visitors fill in and send to JCN.' });

const logos = (fns: SchemaFns) =>
	z
		.strictObject({
			type: z.literal('logos'),
			...sectionHeader,
			items: z
				.array(
					z.strictObject({
						name: text(2, 80),
						image: imageSchema(fns),
						href: hrefSchema.optional(),
					}),
				)
				.min(1)
				.max(24),
			link: linkSchema.optional(),
		})
		.meta({ description: 'A row of logos, e.g. corporate sponsors.' });

const stories = (fns: SchemaFns) =>
	z
		.strictObject({
			type: z.literal('stories'),
			...sectionHeader,
			count: z.int().min(1).max(6).default(3).meta({
				description:
					'How many of the latest stories to show. Ignored when pick is set.',
			}),
			pick: z.array(fns.reference('stories')).min(1).max(6).optional().meta({
				description:
					'Specific story ids to show, in order. Omit to show the latest.',
			}),
		})
		.meta({ description: 'Teasers linking to family stories.' });

const people = z
	.strictObject({
		type: z.literal('people'),
		...sectionHeader,
		group: z.enum(['leadership', 'board', 'staff']),
	})
	.meta({ description: 'A list of people from one group.' });

export const blockSchema = (fns: SchemaFns) =>
	z.discriminatedUnion('type', [
		prose,
		mediaText(fns),
		cards,
		impact,
		faq,
		cta,
		contact(fns),
		form,
		logos(fns),
		stories(fns),
		people,
	]);

export type Block = z.infer<ReturnType<typeof blockSchema>>;
