import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { idsFromTree, type TreeEntry } from './collections.ts';

const blob = (path: string): TreeEntry => ({ path, type: 'blob' });

describe('idsFromTree', () => {
	it('returns an empty list when the collection is empty', () => {
		assert.deepEqual(idsFromTree('pages', []), []);
		assert.deepEqual(
			idsFromTree('pages', [blob('content/site.json'), blob('README.md')]),
			[],
		);
	});

	it('strips the collection dir and .json, keeping nested page paths', () => {
		assert.deepEqual(
			idsFromTree('pages', [
				blob('content/pages/index.json'),
				blob('content/pages/about/history.json'),
			]),
			['about/history', 'index'],
		);
	});

	it('ignores directories, other file types and other collections', () => {
		assert.deepEqual(
			idsFromTree('pages', [
				{ path: 'content/pages/about', type: 'tree' },
				{ path: 'content/pages/about.json', type: 'tree' },
				blob('content/pages/notes.md'),
				blob('content/pages/about/photo.json.bak'),
				blob('content/people/jane.json'),
				blob('src/content/pages/index.json'),
				blob('content/pages-old/index.json'),
				blob('content/pages/index.json'),
			]),
			['index'],
		);
	});

	it('lists people, ignoring subfolders like the `*.json` loader does', () => {
		assert.deepEqual(
			idsFromTree('people', [
				blob('content/people/jane-doe.json'),
				blob('content/people/archive/old.json'),
				blob('content/pages/index.json'),
			]),
			['jane-doe'],
		);
	});
});
