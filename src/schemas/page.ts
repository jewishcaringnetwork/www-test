import { z } from 'astro/zod';
import { blockSchema, headerSchema } from './blocks.ts';
import { hierarchy, imageSchema, type SchemaFns, text } from './shared.ts';

/**
 * Color-blocking rules that span blocks (docs/claude/3-hierarchy.md): at
 * most one blue band per page, and never as the last section, where it
 * would run into the dark footer.
 */
const checkBands = (
	blocks: { band?: 'blue' }[],
	ctx: z.core.$RefinementCtx,
) => {
	const blue = blocks.flatMap((block, i) => block.band === 'blue' ? [i] : []);
	for (const i of blue.slice(1)) {
		ctx.addIssue({
			code: 'custom',
			path: [i, 'band'],
			message:
				'Only one blue band per page, so it stays the loudest section. Remove this band, or the other one.',
		});
	}
	if (blue.includes(blocks.length - 1)) {
		ctx.addIssue({
			code: 'custom',
			path: [blocks.length - 1, 'band'],
			message:
				"The last section can't be a blue band: the footer below it is dark blue too. Remove the band, or move the section up.",
		});
	}
};

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
					'One-sentence summary for search engines. Omit to let them write a snippet from the page.',
			}),
			noindex: z.boolean().optional().meta({
				description: 'Hide this page from search engines.',
			}),
			header: headerSchema(fns),
			blocks: z
				.array(blockSchema(fns))
				.max(12)
				.superRefine(checkBands)
				.default([])
				.meta({
					description:
						`Page sections after the header, top to bottom. Order by priority: the first sections get the most attention. ${hierarchy.band}`,
				}),
		})
		.meta({
			description: [
				'A page on the site. The design depends on a clear hierarchy: few things are loud, so the loud things work.',
				hierarchy.audience,
				hierarchy.whenUnsure,
			].join(' '),
		});

/** Written by families; not edited through MCP. */
export const storySchema = (fns: SchemaFns) =>
	z.strictObject({
		title: text(3, 100),
		summary: text(10, 200).meta({
			description: 'Teaser text shown in story lists.',
		}),
		image: imageSchema(fns).optional(),
		date: z.coerce.date(),
		author: text(2, 80).optional().meta({
			description: 'Omit to publish anonymously.',
		}),
		featured: z.boolean().default(false),
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
