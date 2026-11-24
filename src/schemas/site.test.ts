import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { financeSchema } from './site.ts';

describe('financeSchema', () => {
	it('accepts a Candid seal and a Charity Navigator rating', () => {
		const value = {
			candid: { seal: 'gold', year: 2026 },
			charityNavigator: { stars: 3, year: 2026 },
		};
		assert.deepEqual(financeSchema.parse(value), value);
	});

	it('allows either to be left out', () => {
		assert.equal(financeSchema.safeParse({}).success, true);
	});

	it('rejects unknown seal levels and out-of-range ratings', () => {
		assert.equal(
			financeSchema.safeParse({ candid: { seal: 'diamond', year: 2026 } })
				.success,
			false,
		);
		assert.equal(
			financeSchema.safeParse({ charityNavigator: { stars: 5, year: 2026 } })
				.success,
			false,
		);
		assert.equal(
			financeSchema.safeParse({ charityNavigator: { stars: 2.5, year: 2026 } })
				.success,
			false,
		);
	});

	it('rejects invented keys', () => {
		assert.equal(
			financeSchema.safeParse({ bbb: { accredited: true } }).success,
			false,
		);
	});
});
