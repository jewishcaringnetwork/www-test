import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { sectionBackgrounds } from './section-background.ts';

describe('sectionBackgrounds', () => {
	it('keeps every section on paper under a plain header', () => {
		assert.deepEqual(sectionBackgrounds('header', ['prose', 'people']), [
			'paper',
			'paper',
		]);
	});

	it('starts with white after a hero, then alternates', () => {
		assert.deepEqual(
			sectionBackgrounds('hero', ['mediaText', 'prose', 'people']),
			['white', 'paper', 'white'],
		);
	});

	it('keeps self-contained blocks on paper', () => {
		// Tikva House
		assert.deepEqual(
			sectionBackgrounds('hero', ['mediaText', 'contact', 'cta']),
			['white', 'paper', 'paper'],
		);
		assert.deepEqual(sectionBackgrounds('hero', ['cards', 'prose']), [
			'paper',
			'white',
		]);
	});

	it('never assigns blue to a current block', () => {
		const types = ['prose', 'mediaText', 'cards', 'contact', 'cta', 'people'];
		assert.ok(!sectionBackgrounds('hero', types).includes('blue'));
	});
});
