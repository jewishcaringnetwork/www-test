/**
 * Content collections the MCP server can edit. Each `dir` and `nested` flag
 * matches the collection's loader in `src/content.config.ts`. `stories` is
 * deliberately absent; see the MCP spec's Scope section.
 */
export const COLLECTIONS = {
	pages: {
		dir: 'content/pages',
		nested: true, // `**/*.json`
		description:
			'Website pages. Ids are paths like `index` or `about/history`.',
	},
	people: {
		dir: 'content/people',
		nested: false, // `*.json`
		description: 'Leadership, board and staff, one file per person.',
	},
} as const;

export type Collection = keyof typeof COLLECTIONS;

export const COLLECTION_NAMES = Object.keys(COLLECTIONS) as [
	Collection,
	...Collection[],
];

/** One entry from GitHub's git trees API (`GET /git/trees/{ref}?recursive=1`). */
export interface TreeEntry {
	path: string;
	type: 'blob' | 'tree' | 'commit';
}

/**
 * Ids in a collection from a recursive repo tree: `content/pages/about/history.json`
 * becomes `about/history`. Non-nested collections ignore files in subfolders,
 * as their loaders do. Sorted, so results stay stable between calls.
 */
export function idsFromTree(
	collection: Collection,
	entries: readonly TreeEntry[],
): string[] {
	const { dir, nested } = COLLECTIONS[collection];
	const prefix = `${dir}/`;
	return entries
		.filter((e) =>
			e.type === 'blob' && e.path.startsWith(prefix) && e.path.endsWith('.json')
		)
		.map((e) => e.path.slice(prefix.length, -'.json'.length))
		.filter((id) => nested || !id.includes('/'))
		.sort();
}
