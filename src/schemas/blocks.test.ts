import { z } from 'astro/zod';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { blockSchema, headerSchema } from './blocks.ts';
import type { SchemaFns } from './shared.ts';

const fns = {
	image: () => z.string(),
	reference: () => z.string(),
} as unknown as SchemaFns;

const header = headerSchema(fns);
const block = blockSchema(fns);

const img = { src: './a.jpg', alt: 'The Tikva House kitchen' };
const action = { label: 'Give now', href: '/donate', variant: 'donate' };
const link = { label: 'See all services', href: '/services' };
const card = {
	title: 'Family support',
	text: 'Meals, childcare and household help.',
};
const stat = { value: '30', label: 'years serving families' };

const ok = (schema: z.ZodType, data: unknown) => {
	const result = schema.safeParse(data);
	assert.ok(result.success, JSON.stringify(result.error?.issues));
	return result.data as any;
};
const bad = (schema: z.ZodType, data: unknown) =>
	assert.equal(schema.safeParse(data).success, false);

describe('headerSchema', () => {
	it('defaults to the plain header', () => {
		assert.deepEqual(ok(header, {}), { type: 'header' });
	});

	it('hero needs a heading', () => {
		bad(header, {
			type: 'hero',
			lead: 'When serious illness strikes, the whole family is affected.',
		});
	});

	it('hero allows at most two actions', () => {
		bad(header, {
			type: 'hero',
			heading: 'Caring for the whole family',
			lead: 'When serious illness strikes, the whole family is affected.',
			actions: [action, action, action],
		});
	});

	it('hero brand is a known program logo, not a path', () => {
		const hero = {
			type: 'hero',
			heading: 'Families come to Baltimore for care',
			lead: 'A private place to rest, close to the hospital.',
		};
		ok(header, { ...hero, brand: 'tikva-house' });
		bad(header, { ...hero, brand: './logo.svg' });
	});

	it('hero defaults actions to []', () => {
		const data = ok(header, {
			type: 'hero',
			heading: 'Caring for the whole family',
			lead: 'When serious illness strikes, the whole family is affected.',
		});
		assert.deepEqual(data.actions, []);
	});
});

describe('blockSchema', () => {
	const minimal = {
		prose: { type: 'prose', markdown: 'Hello' },
		mediaText: {
			type: 'mediaText',
			heading: "What's included",
			markdown: 'Seven suites.',
			images: [img],
		},
		cards: {
			type: 'cards',
			items: [{ ...card, icon: 'heartbeat' }, card],
			link,
		},
		stats: { type: 'stats', items: [stat, stat] },
		faq: {
			type: 'faq',
			items: [{ question: 'Is parking free?', answer: 'Yes.' }],
		},
		cta: { type: 'cta', heading: 'How your gift helps', actions: [action] },
		contact: {
			type: 'contact',
			name: 'The Tikva House',
			address: {
				street: '529 N. Washington Street',
				city: 'Baltimore',
				state: 'MD',
				zip: '21205',
			},
			phone: '410-534-1033',
			email: 'info@tikvahouse.org',
		},
		form: { type: 'form', form: 'volunteer' },
		logos: { type: 'logos', items: [{ name: 'Sponsor', image: img }] },
		stories: { type: 'stories' },
		people: { type: 'people', group: 'board' },
	};

	for (const [type, data] of Object.entries(minimal)) {
		it(`parses a minimal ${type} block`, () => ok(block, data));
	}

	it('applies defaults', () => {
		assert.equal(ok(block, minimal.mediaText).imageSide, 'end');
		assert.equal(ok(block, minimal.stories).count, 3);
		assert.equal(ok(block, minimal.cta).tone, 'brand');
	});

	it('rejects hero as a block', () => bad(block, { type: 'hero' }));

	it('enforces card counts', () => {
		bad(block, { type: 'cards', items: [card] });
		bad(block, { type: 'cards', items: Array(7).fill(card) });
	});

	it('rejects unknown keys in blocks and items', () => {
		bad(block, { ...minimal.stats, icon: 'house' });
		bad(block, {
			type: 'faq',
			items: [{ question: 'Is parking free?', answer: 'Yes.', id: 1 }],
		});
	});

	it('allows at most two images beside text', () => {
		bad(block, { ...minimal.mediaText, images: [img, img, img] });
	});

	it('validates contact phone format', () => {
		bad(block, { ...minimal.contact, phone: '410.534.1033' });
	});

	it('allows a card link without a label', () => {
		ok(block, {
			type: 'cards',
			items: [{ ...card, link: { href: '/donate' } }, card],
		});
	});

	it('rejects unknown icons', () => {
		bad(block, {
			type: 'cards',
			items: [{ ...card, icon: 'not-an-icon' }, card],
		});
	});

	describe('band', () => {
		it('is optional on every block', () => {
			for (const data of Object.values(minimal)) {
				assert.equal(ok(block, data).band, undefined);
			}
		});

		it('accepts blue on every block but a brand CTA', () => {
			for (const data of Object.values(minimal)) {
				if (data.type === 'cta') continue;
				ok(block, { ...data, band: 'blue' });
			}
			ok(block, { ...minimal.cta, tone: 'subtle', band: 'blue' });
		});

		it('rejects other colors, including the automatic ones', () => {
			for (const band of ['gold', 'white', 'paper', '#145693']) {
				bad(block, { ...minimal.prose, band });
			}
		});

		it('keeps a brand CTA out of a blue band', () => {
			const result = block.safeParse({ ...minimal.cta, band: 'blue' });
			assert.equal(result.success, false);
			assert.deepEqual(result.error?.issues[0]?.path, ['band']);
		});
	});
});
