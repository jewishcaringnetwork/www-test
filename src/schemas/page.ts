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
					'One-sentence summary for search engines. Omit to let them write a snippet from the page.',
			}),
			noindex: z.boolean().optional().meta({
				description: 'Hide this page from search engines.',
			}),
			header: headerSchema(fns),
			blocks: z.array(blockSchema(fns)).max(12).default([]).meta({
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
				description: 'Title, e.g. "President". Omit if none.',
			}),
			group: z.enum(['leadership', 'board', 'staff']),
			photo: imageSchema(fns).optional(),
			order: z.int().min(0).meta({
				description: 'Sort position within the group, lowest first.',
			}),
			bio: text(10, 500).optional(),
		})
		.meta({ description: 'A person shown on the Leadership page.' });
