import { z } from 'astro/zod';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { pageSchema, personSchema } from './page.ts';
import type { SchemaFns } from './shared.ts';

const fns = {
	image: () => z.string(),
	reference: () => z.string(),
} as unknown as SchemaFns;

const page = pageSchema(fns);
const person = personSchema(fns);

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
const card = {
	title: 'Family support',
	text: 'Meals, childcare and household help.',
};

describe('pageSchema', () => {
	it('fills defaults', () => {
		const data = ok(page, { title: 'Contact us', header: {} });
		assert.deepEqual(data.blocks, []);
		assert.equal(data.header.type, 'header');
	});

	it('allows a $schema key for editor validation', () => {
		ok(page, {
			$schema: '../../.astro/collections/pages.schema.json',
			title: 'Contact us',
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

	it('accepts the approved home page shape', () => {
		ok(page, {
			title: 'Home',
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
					heading: 'Lend a hand, a heart, or a few hours',
					actions: [action('Volunteer', '/get-involved/volunteer')],
				},
				{
					type: 'cta',
					heading: "You don't have to do this alone",
					tone: 'subtle',
					actions: [
						action('Request support', '/contact'),
						action('Call 410-602-6075', 'tel:+14106026075', 'secondary'),
					],
				},
			],
		});
	});

	it('converts to JSON Schema for the MCP server', () => {
		const json = z.toJSONSchema(page, { io: 'input' }) as any;
		const items = json.properties.blocks.items;
		assert.equal((items.oneOf ?? items.anyOf).length, 11);
	});
});

describe('personSchema', () => {
	it('allows a person without a role', () =>
		ok(person, { name: 'Keren Traub', group: 'board', order: 0 }));
	it('rejects a fractional order', () =>
		bad(person, { name: 'Keren Traub', group: 'board', order: 1.5 }));
});
