import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { sectionBackground } from './section-background.ts';

describe('sectionBackground', () => {
	it('alternates paper and white, starting with paper', () => {
		assert.deepEqual(
			[0, 1, 2, 3].map((i) => sectionBackground({}, i)),
			['paper', 'white', 'paper', 'white'],
		);
	});

	it('lets a band override only its own section', () => {
		const blocks = [{}, { band: 'blue' as const }, {}];
		assert.deepEqual(blocks.map(sectionBackground), ['paper', 'blue', 'paper']);
	});
});
