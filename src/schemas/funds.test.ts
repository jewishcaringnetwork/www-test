import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	donateEmbedSrc,
	donateEmbedUrl,
	fundBySlug,
	funds,
	fundSlug,
	fundSlugs,
} from './funds.ts';

describe('funds', () => {
	it('slugs are unique', () => {
		assert.equal(new Set(fundSlugs).size, funds.length);
	});

	it('slugs drop punctuation', () => {
		assert.equal(fundSlug('Food & Shabbos Packages'), 'food-shabbos-packages');
		assert.equal(fundSlug('Tikva House'), 'tikva-house');
	});

	it('maps a slug back to the Admire option', () => {
		assert.equal(fundBySlug('tikva-house'), 'Tikva House');
		assert.equal(fundBySlug('health-therapies'), 'Health & Therapies');
	});

	it('ignores unknown or missing slugs', () => {
		for (const slug of ['', 'Tikva House', 'tikva', '<script>', null]) {
			assert.equal(fundBySlug(slug), undefined);
		}
	});
});

describe('donateEmbedSrc', () => {
	it('is the plain form without a fund', () => {
		assert.equal(donateEmbedSrc(), donateEmbedUrl);
	});

	it("preselects the fund with Admire's exact label, %20-encoded", () => {
		assert.equal(
			donateEmbedSrc('Tikva House'),
			`${donateEmbedUrl}?Funds=Tikva%20House`,
		);
		assert.equal(
			donateEmbedSrc('Food & Shabbos Packages'),
			`${donateEmbedUrl}?Funds=Food%20%26%20Shabbos%20Packages`,
		);
	});
});
