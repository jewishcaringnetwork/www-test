import { z } from 'astro/zod';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	actionSchema,
	hrefSchema,
	iconSchema,
	imageSchema,
	linkSchema,
	type SchemaFns,
	text,
} from './shared.ts';

const fns = {
	image: () => z.string(),
	reference: () => z.string(),
} as unknown as SchemaFns;

describe('text', () => {
	const schema = text(3, 10);

	it('rejects whitespace-only and too-short strings', () => {
		assert.equal(schema.safeParse('   ').success, false);
		assert.equal(schema.safeParse('ab').success, false);
	});

	it('rejects zero-width and punctuation-only strings', () => {
		assert.equal(schema.safeParse('\u200B\u200B\u200B').success, false);
		assert.equal(schema.safeParse('a\u200B\u200B').success, false);
		assert.equal(schema.safeParse('---').success, false);
	});

	it('accepts Hebrew', () => {
		assert.equal(schema.safeParse('תהלים').success, true);
	});

	it('trims', () => {
		assert.equal(schema.parse('  abc  '), 'abc');
	});
});

describe('hrefSchema', () => {
	for (
		const ok of [
			'/about',
			'/donate?fund=tikva-house',
			'https://example.org',
			'tel:+14105341033',
			'mailto:info@tikvahouse.org',
		]
	) {
		it(`accepts ${ok}`, () =>
			assert.equal(hrefSchema.safeParse(ok).success, true));
	}

	for (
		const bad of [
			'javascript:alert(1)',
			'http://example.org',
			'example.org',
			'/has space',
			'//evil.com',
			'/\\evil.com',
			'/\\/evil.com',
			'tel:-',
			'tel:+',
		]
	) {
		it(`rejects ${bad}`, () =>
			assert.equal(hrefSchema.safeParse(bad).success, false));
	}
});

describe('actionSchema', () => {
	const base = { label: 'Give now', href: '/donate', variant: 'donate' };

	it('accepts a valid action', () => {
		assert.equal(actionSchema.safeParse(base).success, true);
	});

	it('rejects an unknown variant', () => {
		assert.equal(
			actionSchema.safeParse({ ...base, variant: 'tertiary' }).success,
			false,
		);
	});

	it('rejects unknown keys', () => {
		assert.equal(
			actionSchema.safeParse({ ...base, icon: 'heart' }).success,
			false,
		);
	});
});

describe('imageSchema', () => {
	it('rejects empty alt text', () => {
		assert.equal(
			imageSchema(fns).safeParse({ src: './a.jpg', alt: '' }).success,
			false,
		);
	});
});

describe('iconSchema', () => {
	it('accepts Phosphor icon names', () => {
		assert.equal(iconSchema.safeParse('heartbeat').success, true);
		assert.equal(iconSchema.safeParse('house').success, true);
	});

	it('rejects unknown or mis-cased names', () => {
		assert.equal(iconSchema.safeParse('Heartbeat').success, false);
		assert.equal(iconSchema.safeParse('not-an-icon').success, false);
	});
});

describe('linkSchema', () => {
	it('accepts link text that says where it goes', () => {
		assert.ok(
			linkSchema.safeParse({ label: 'See all services', href: '/services' })
				.success,
		);
	});

	it('rejects vague link text', () => {
		for (const label of ['Click here', 'read more', 'Learn more →', 'here.']) {
			assert.equal(
				linkSchema.safeParse({ label, href: '/services' }).success,
				false,
				label,
			);
		}
	});
});
