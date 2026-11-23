import { icons } from '@phosphor-icons/core';
import { z } from 'astro/zod';
import type { ImageFunction } from 'astro:content';
import { fundSlugs } from './funds.ts';

/**
 * Astro's schema helpers, passed in rather than imported, so these schemas can
 * be built outside Astro (tests, the MCP server) with stand-ins.
 */
export type SchemaFns = {
	image: ImageFunction;
	reference: <C extends string>(
		collection: C,
	) => z.ZodType<{ collection: C; id: string }, string>;
};

/**
 * Prominence rules, shared so the wording stays identical wherever a model
 * reads it. See docs/claude/3-hierarchy.md.
 */
export const hierarchy = {
	whenUnsure: 'When unsure, prefer the quieter option.',
	audience:
		'Audience order across the site is donors, then volunteers, then families. Families must never be more than one click from help.',
	hero:
		'The hero is the most prominent element on the site. It is reserved for landing pages, whose job is to move a visitor to act (currently the home page and Tikva House). Every other page, including section overviews like About, uses the plain header: adding a hero to an ordinary page weakens the pages that rely on it.',
	actions:
		'Buttons are for the one or two actions this section exists for. "donate" is the loudest style and is reserved for giving; "primary" is the main action; "secondary" is a second, lesser action. Do not add buttons to fill space.',
	quietLink:
		'A plain text link, quieter than any button. Use it for a secondary need that should stay findable without competing, e.g. "Need support?".',
	cta:
		"A call-to-action band for one of the page's main asks (give, volunteer, get support). Not for incidental actions: for those, use a link inside prose.",
} as const;

const invisible = /[\u200B\u2060\uFEFF]/g;
const visible = /[\p{L}\p{N}]/u;

/**
 * Trimmed string with length bounds. Strips zero-width spaces and trims before
 * measuring, so "   " fails min, and requires at least one letter or digit.
 */
export const text = (min: number, max: number) =>
	z
		.string()
		.overwrite((s) => s.replace(invisible, ''))
		.trim()
		.min(min)
		.max(max)
		.refine(
			(s) => visible.test(s),
			'Must contain at least one letter or number.',
		);

/** Limited Markdown, rendered by the block component. */
export const markdown = (max: number) =>
	z.string().trim().min(1).max(max).meta({
		description:
			'Markdown. Allowed: paragraphs, ## and ### headings, bulleted and numbered lists, **bold**, *italic*, and [links](/path). No images, HTML, tables or # headings.',
	});

const vagueLinkText =
	/^(?:(?:click|tap) here|here|(?:read|learn|see|find out) more|more(?: info)?|(?:this )?link)$/i;

/**
 * Text for a link or button: `text()` plus a ban on wording that says
 * nothing out of context ("Click here", "Read more"), since screen-reader
 * users often browse a page by its links alone.
 */
export const linkText = (min: number, max: number) =>
	text(min, max).refine(
		(s) => !vagueLinkText.test(s.replace(/[\s.:!→>»]+$/u, '')),
		'Say where the link goes, e.g. "See all services", not "Click here" or "Read more".',
	);

export const hrefSchema = z
	.string()
	.regex(
		/^(\/(?![\/\\])[^\s]*|https:\/\/[^\s]+|tel:\+?\d[\d-]*\d|mailto:[^\s@]+@[^\s@]+)$/,
		'Use a site path like /about, a full https:// URL, tel:+14106026075, or mailto:name@example.org',
	)
	.refine(
		(href) => {
			if (!href.startsWith('/donate?')) return true;
			const query = href.slice('/donate?'.length).split('#')[0];
			const fund = new URLSearchParams(query).get('fund');
			return fund === null || fundSlugs.includes(fund);
		},
		`Unknown fund. Use one of: ${fundSlugs.join(', ')}.`,
	)
	.meta({
		description:
			`Link target: a site path starting with / (query strings allowed), an https:// URL, a tel: number, or a mailto: address. To preselect a fund on the donation form, link to /donate?fund=<fund>, e.g. /donate?fund=tikva-house. Funds: ${
				fundSlugs.join(', ')
			}.`,
	});

export const linkSchema = z
	.strictObject({
		label: linkText(2, 40).meta({
			description:
				'Link text. Say where it goes, e.g. "See all services". Not "Click here".',
		}),
		href: hrefSchema,
	})
	.meta({ description: hierarchy.quietLink });

export const actionSchema = z
	.strictObject({
		...linkSchema.shape,
		label: linkText(2, 40).meta({
			description: 'Button text. Short and action-first, e.g. "Give now".',
		}),
		variant: z.enum(['primary', 'secondary', 'donate']).meta({
			description:
				'donate: loudest, for giving only. primary: the main action. secondary: a lesser action.',
		}),
	})
	.meta({ description: 'A button.' });

const imageRule =
	'Places are always fine; staff and volunteers only with permission; families and children only with written consent.';

/** `use` describes where this image appears; the consent rule is always kept. */
export const imageSchema = (fns: SchemaFns, use = 'An image.') =>
	z
		.strictObject({
			src: fns.image().meta({
				description: 'Path to the image file, relative to this content file.',
			}),
			alt: text(5, 150).meta({
				description:
					'Describes what the image shows for someone who cannot see it. Never identify families or children by name.',
			}),
		})
		.meta({ description: `${use} ${imageRule}` });

const iconNames = new Set<string>(icons.map((icon) => icon.name));

export const iconSchema = z
	.string()
	.refine((name) => iconNames.has(name), {
		message:
			'Unknown icon. Use a Phosphor icon name in kebab-case, e.g. heartbeat.',
	})
	.meta({
		description:
			'A Phosphor icon name in kebab-case (https://phosphoricons.com), e.g. "heartbeat", "house", "hand-heart".',
	});

/** Optional section header, spread into block shapes. */
export const sectionHeader = {
	heading: text(3, 70).optional().meta({
		description: 'Section heading. Omit if the section speaks for itself.',
	}),
	intro: text(10, 300).optional().meta({
		description: 'One or two sentences under the heading.',
	}),
};
