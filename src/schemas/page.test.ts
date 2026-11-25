import { z } from 'astro/zod';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	missingDescriptions,
	pageSchema,
	personSchema,
	storySchema,
} from './page.ts';
import type { SchemaFns } from './shared.ts';

const fns = {
	image: () => z.string(),
	reference: () => z.string(),
} as unknown as SchemaFns;

const page = pageSchema(fns);
const person = personSchema(fns);
const story = storySchema(fns);

const ok = (schema: z.ZodType, data: unknown) => {
	const result = schema.safeParse(data);
	assert.ok(result.success, JSON.stringify(result.error?.issues));
	return result.data as any;
};
const bad = (schema: z.ZodType, data: unknown) =>
	assert.equal(schema.safeParse(data).success, false);

const action = (label: string, href: string, variant = 'primary') => ({
	label,
	href,
	variant,
});
const description =
	'Free support for Jewish families facing serious illness in Baltimore.';
const card = {
	title: 'Family support',
	text: 'Meals, childcare and household help.',
};

describe('pageSchema', () => {
	it('fills defaults', () => {
		const data = ok(page, { title: 'Contact us', description, header: {} });
		assert.deepEqual(data.blocks, []);
		assert.equal(data.header.type, 'header');
	});

	it('allows a $schema key for editor validation', () => {
		ok(page, {
			$schema: '../../.astro/collections/pages.schema.json',
			title: 'Contact us',
			description,
			header: {},
		});
	});

	it('keeps the image consent rule on overridden image descriptions', () => {
		const json = JSON.stringify(z.toJSONSchema(page, { io: 'input' }));
		const hits = json.match(/written consent/g) ?? [];
		// every image field: hero, mediaText, contact, logos
		assert.ok(hits.length >= 4, `found ${hits.length}`);
	});

	it('states the button rule once per actions list, not on every variant', () => {
		const json = JSON.stringify(z.toJSONSchema(page, { io: 'input' }));
		const actionLists = 2; // hero actions, cta actions
		const hits = json.match(/Buttons are for the one or two actions/g) ?? [];
		assert.ok(hits.length <= actionLists, `found ${hits.length}`);
	});

	it('tells the model where header buttons live', () => {
		const result = page.safeParse({
			title: 'Volunteer',
			header: { actions: [] },
		});
		assert.equal(result.success, false);
		const json = JSON.stringify(z.toJSONSchema(page, { io: 'input' }));
		assert.match(
			json,
			/no image, buttons or link; those exist only on the hero/,
		);
	});

	it('requires a header', () => bad(page, { title: 'Contact us' }));

	it('caps blocks at 12', () => {
		bad(page, {
			title: 'Services',
			header: {},
			blocks: Array(13).fill({ type: 'prose', markdown: 'Hi' }),
		});
	});

	it('rejects a too-short description', () => {
		bad(page, {
			title: 'Services',
			header: {},
			description: 'Too short for SEO.',
		});
	});

	it('tells the model a description is required unless noindex', () => {
		const json = JSON.stringify(z.toJSONSchema(page, { io: 'input' }));
		assert.match(json, /Required unless noindex is true/);
	});

	it('accepts the approved home page shape', () => {
		ok(page, {
			title: 'Home',
			description,
			header: {
				type: 'hero',
				heading: 'When serious illness strikes, the entire family is affected.',
				lead:
					'Our programs are designed to help each family member. Always free.',
				actions: [
					action('Give now', '/donate', 'donate'),
					action('Volunteer', '/get-involved/volunteer', 'secondary'),
				],
				link: { label: 'Need support?', href: '/contact' },
			},
			blocks: [
				{
					type: 'impact',
					items: [
						{
							value: '30',
							label: 'years caring for families, since 1996',
							source: {
								document: 'JCN_Impact_Sponsorship_Opportunities.pdf',
								date: '2026-11-15',
							},
						},
						{
							value: '21,000',
							label: 'overnight stays at Tikva House in 13 years',
							source: {
								document: 'JCN26 Infographic WWW.pdf',
								date: '2026-06-14',
							},
						},
					],
				},
				{
					type: 'cards',
					items: [{ ...card, icon: 'heartbeat' }, card, card],
					link: { label: 'See all services', href: '/services' },
				},
				{
					type: 'cta',
					heading: 'How your gift helps',
					actions: [action('Make a gift', '/donate', 'donate')],
				},
				{
					type: 'cta',
					heading: "You don't have to do this alone",
					tone: 'subtle',
					actions: [
						action('Contact us', '/contact'),
					],
				},
			],
		});
	});

	it('allows at most two CTAs, one of them brand', () => {
		const cta = (tone: string) => ({
			type: 'cta',
			heading: 'How your gift helps',
			tone,
			actions: [action('Make a gift', '/donate', 'donate')],
		});
		const home = (...blocks: unknown[]) => ({
			title: 'Home',
			description,
			header: {},
			blocks,
		});
		ok(page, home(cta('brand'), cta('subtle')));
		bad(page, home(cta('brand'), cta('brand')));
		bad(page, home(cta('brand'), cta('subtle'), cta('subtle')));
	});

	it('converts to JSON Schema for the MCP server', () => {
		const json = z.toJSONSchema(page, { io: 'input' }) as any;
		const items = json.properties.blocks.items;
		assert.equal((items.oneOf ?? items.anyOf).length, 11);
	});
});

describe('missingDescriptions', () => {
	it('passes pages with a description, and noindex pages without one', () => {
		assert.deepEqual(
			missingDescriptions([
				{ id: 'contact', description },
				{ id: 'preview/blocks', noindex: true },
			]),
			[],
		);
	});

	it('names each indexed page without a description', () => {
		const errors = missingDescriptions([
			{ id: 'about/history' },
			{ id: 'services', noindex: false },
			{ id: 'contact', description },
		]);
		assert.equal(errors.length, 2);
		assert.match(errors[0]!, /content\/pages\/about\/history\.json/);
		assert.match(errors[1]!, /services/);
	});
});

describe('personSchema', () => {
	it('allows a person without a role', () =>
		ok(person, { name: 'Keren Traub', group: 'board', order: 0 }));
	it('rejects a fractional order', () =>
		bad(person, { name: 'Keren Traub', group: 'board', order: 1.5 }));
});

describe('storySchema', () => {
	const minimal = {
		title: 'Our year at Tikva House',
		summary: 'How a week of meals turned into a year of friendship.',
		date: '2026-11-01',
	};

	it('keeps a story unapproved unless marked approved', () => {
		assert.equal(ok(story, minimal).approved, false);
		assert.equal(ok(story, { ...minimal, approved: true }).approved, true);
	});

	it('has no photo field', () =>
		bad(story, {
			...minimal,
			image: { src: './a.jpg', alt: 'A family at Tikva House' },
		}));

	it('rejects a non-boolean approved flag', () =>
		bad(story, { ...minimal, approved: 'yes' }));

	it('describes the approval rule for whoever edits the file', () => {
		assert.match(story.shape.approved.description ?? '', /client/);
	});
});
