import { z } from 'astro/zod';
import {
	actionSchema,
	hierarchy,
	hrefSchema,
	iconSchema,
	imageSchema,
	linkSchema,
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

// Hero

export const heroSchema = (fns: SchemaFns) => {
	const simple = z
		.strictObject({
			layout: z.literal('simple').default('simple'),
			heading: text(3, 70).optional().meta({
				description: 'Page heading. Omit to use the page title.',
			}),
			lead: text(10, 300).optional().meta({
				description: 'One or two sentences under the heading.',
			}),
		})
		.meta({
			description:
				'The standard page opener: heading and optional lead. Use this for almost every page. It has no image, buttons or link; those exist only on the split layout, which is reserved for top-level destination pages.',
		});

	const split = z
		.strictObject({
			layout: z.literal('split'),
			heading: text(3, 70).meta({
				description:
					'The page\'s main message, e.g. "When serious illness strikes, the entire family is affected."',
			}),
			lead: text(10, 300).meta({
				description: 'One or two sentences under the heading.',
			}),
			image: imageSchema(
				fns,
				'Photo shown beside the text in a 4:3 frame. Omit to show a brand-color panel.',
			).optional(),
			actions: actions(0, 2).default([]),
			link: linkSchema.optional(),
		})
		.meta({ description: `${hierarchy.splitHero} ${hierarchy.audience}` });

	return z.discriminatedUnion('layout', [simple, split]).meta({
		description:
			`Page opener. Use "simple" unless this is a top-level destination page. ${hierarchy.whenUnsure}`,
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
					link: linkSchema.optional(),
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

const stats = z
	.strictObject({
		type: z.literal('stats'),
		...sectionHeader,
		items: z
			.array(
				z.strictObject({
					value: text(1, 12).meta({
						description: 'The number, e.g. "30" or "$1.2M".',
					}),
					label: text(2, 60).meta({
						description: 'What it counts, e.g. "years serving families".',
					}),
				}),
			)
			.min(2)
			.max(4),
	})
	.meta({
		description:
			'Impact numbers. Only use figures the organisation can stand behind.',
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
		link: linkSchema.optional(),
		tone: z.enum(['brand', 'subtle']).default('brand').meta({
			description:
				'brand: colored band for the main ask. subtle: quieter, e.g. for support or a secondary ask.',
		}),
	})
	.meta({ description: `${hierarchy.cta} ${hierarchy.whenUnsure}` });

const contact = (fns: SchemaFns) =>
	z
		.strictObject({
			type: z.literal('contact'),
			...sectionHeader,
			name: text(2, 80).meta({
				description: 'Name of the place, e.g. "The Tikva House".',
			}),
			address: addressSchema,
			phone: phoneSchema.meta({
				description: 'Phone formatted like 410-534-1033. Shown as tap-to-call.',
			}),
			email: z.email().max(100).optional(),
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
			description: 'Which form to show. Fields are fixed in code.',
		}),
		confirmation: text(10, 250).optional().meta({
			description: 'Message shown after sending. Omit to use the default.',
		}),
	})
	.meta({ description: 'An embedded form.' });

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
		stats,
		faq,
		cta,
		contact(fns),
		form,
		logos(fns),
		stories(fns),
		people,
	]);

export type Block = z.infer<ReturnType<typeof blockSchema>>;
