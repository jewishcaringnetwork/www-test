import { z } from 'astro/zod';
import { blockSchema, headerSchema } from './blocks.ts';
import { hierarchy, imageSchema, type SchemaFns, text } from './shared.ts';

/** Astro generates JSON Schemas for editors; data files may point at them. */
const editorSchema = z.string().optional().meta({
	description: 'Path to the editor JSON Schema. Leave unchanged.',
});

export const pageSchema = (fns: SchemaFns) =>
	z
		.strictObject({
			$schema: editorSchema,
			title: text(3, 60).meta({
				description:
					'Page name, used in the browser tab and as the heading when the header has none.',
			}),
			description: text(50, 160).optional().meta({
				description:
					"One-sentence summary of the page, shown under its link in search results and in previews when the link is shared. Required unless noindex is true. Write it from what the page says, in the site's plain, warm voice, and name the Jewish Caring Network or the program the page is about.",
			}),
			noindex: z.boolean().optional().meta({
				description: 'Hide this page from search engines.',
			}),
			header: headerSchema(fns),
			blocks: z
				.array(blockSchema(fns))
				.max(12)
				.refine(
					(blocks) => {
						const ctas = blocks.filter((b) => b.type === 'cta');
						return ctas.length <= 2
							&& ctas.filter((b) => b.tone === 'brand').length <= 1;
					},
					'At most two cta blocks per page: one brand and one subtle.',
				)
				.default([])
				.meta({
					description:
						'Page sections after the header, top to bottom. Order by priority: the first sections get the most attention.',
				}),
		})
		.meta({
			description: [
				'A page on the site. The design depends on a clear hierarchy: few things are loud, so the loud things work.',
				hierarchy.audience,
				hierarchy.whenUnsure,
			].join(' '),
		});

/**
 * A page search engines can see needs a description. Not a refinement on
 * `pageSchema`: Astro extends that object to make the editor JSON Schema,
 * and Zod can't extend an object with refinements. Given each page's id,
 * description and noindex, returns an error per page missing one, or none.
 */
export const missingDescriptions = (
	pages: readonly { id: string; description?: string; noindex?: boolean }[],
): string[] =>
	pages
		.filter((page) => !page.noindex && !page.description)
		.map((page) =>
			`content/pages/${page.id}.json needs a description, or noindex: true.`
		);

/**
 * Written by families; not edited through MCP. No photo: a story is its
 * words (2026-11-24). Takes `SchemaFns` like the other schemas, unused.
 *
 * Claude turns each submission (the Share Your Story form, email, a
 * document) into `content/stories/<slug>.md`. The client doesn't write
 * Markdown. Rules for that conversion:
 *
 * - Keep the wording exactly: spelling, punctuation, tone and line breaks,
 *   even obvious typos. List typos for the client instead of fixing them.
 * - Paragraphs: a blank line between them. A line break inside a
 *   paragraph (a letter, a poem): end the line with a backslash `\`.
 * - Only the Markdown `storyProblems` (src/lib/stories.ts) allows:
 *   ## / ### headings, lists, **bold**, *italic*, links, > quotes, and
 *   images saved in content/images (ADR 5) as `../images/<file>` with alt
 *   text. Add markup only where the submission already has the structure.
 * - Leave `approved` off until the client approves the story for public use.
 */
export const storySchema = (_fns: SchemaFns) =>
	z.strictObject({
		title: text(3, 100),
		summary: text(10, 200).meta({
			description: 'Teaser text shown in story lists.',
		}),
		date: z.coerce.date(),
		author: text(2, 80).optional().meta({
			description: 'Omit to publish anonymously.',
		}),
		featured: z.boolean().default(false),
		approved: z.boolean().default(false).meta({
			description:
				'Set to true only after the client approves this story for public use. Unapproved stories get no page and never appear in story lists or the sitemap.',
		}),
	});

export const personSchema = (fns: SchemaFns) =>
	z
		.strictObject({
			$schema: editorSchema,
			name: text(2, 80),
			role: text(2, 80).optional().meta({
				description:
					'Title or capacity, e.g. "President", "Secretary", "House Manager" or "Advisory". Omit if none.',
			}),
			group: z.enum(['leadership', 'board', 'staff']).meta({
				description:
					'leadership: officers such as the President and CEO. board: board of directors, including advisory members. staff: employees, e.g. a house manager.',
			}),
			photo: imageSchema(
				fns,
				'Head-and-shoulders portrait, shown square. Omit if there is none; a placeholder keeps the grid aligned.',
			).optional(),
			order: z.int().min(0).meta({
				description: 'Sort position within the group, lowest first.',
			}),
		})
		.meta({ description: 'A person shown on the Leadership page.' });
