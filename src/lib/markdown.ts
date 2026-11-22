import { markdownToHtml, markdownToMdast } from 'satteri';
import { hrefSchema } from '../schemas/shared.ts';

/**
 * Renders the limited Markdown that `markdown()` in `src/schemas/shared.ts`
 * allows: paragraphs, ## and ### headings, bulleted and numbered lists,
 * **bold**, *italic* and [links](/path). Anything else fails the build rather
 * than rendering, the same way bad JSON does.
 *
 * Uses Sätteri, the Markdown engine Astro 7 ships with.
 */

export interface MarkdownOptions {
	/** Allow ## and ### headings. Off for fields like FAQ answers. */
	headings?: boolean;
}

type Node = {
	type: string;
	depth?: number;
	url?: string;
	children?: Node[];
};

const features = {
	// No tables, footnotes, strikethrough or task lists.
	gfm: false,
	// A leading `---` is a horizontal rule mistake, not frontmatter.
	frontmatter: false,
};

const allowed = new Set([
	'root',
	'paragraph',
	'heading',
	'text',
	'strong',
	'emphasis',
	'link',
	'list',
	'listItem',
	'break',
]);

const names: Record<string, string> = {
	html: 'HTML',
	image: 'images',
	imageReference: 'images',
	table: 'tables',
	blockquote: 'block quotes',
	code: 'code blocks',
	inlineCode: 'inline code',
	thematicBreak: 'horizontal rules',
	linkReference: 'reference-style links',
	definition: 'reference-style links',
};

/** Lists what in `source` the schema doesn't allow; empty if it's fine. */
export function markdownProblems(
	source: string,
	{ headings = true }: MarkdownOptions = {},
): string[] {
	const problems = new Set<string>();

	const walk = (node: Node) => {
		if (!allowed.has(node.type)) {
			problems.add(`Not allowed: ${names[node.type] ?? node.type}.`);
		} else if (node.type === 'heading') {
			if (!headings) problems.add('Headings are not allowed here.');
			else if (node.depth !== 2 && node.depth !== 3) {
				problems.add(
					`Use ## or ### for headings, not ${'#'.repeat(node.depth ?? 1)}.`,
				);
			}
		} else if (
			node.type === 'link' && !hrefSchema.safeParse(node.url).success
		) {
			problems.add(
				`Link "${node.url}" must be a site path like /about, an https:// URL, tel: or mailto:.`,
			);
		}
		node.children?.forEach(walk);
	};

	walk(markdownToMdast(source, { features }) as Node);
	return [...problems];
}

/** Returns HTML for `source`; throws if it uses anything not allowed. */
export function renderMarkdown(
	source: string,
	options: MarkdownOptions = {},
): string {
	const problems = markdownProblems(source, options);
	if (problems.length) {
		const start = source.slice(0, 60).replaceAll('\n', ' ');
		throw new Error(
			`Markdown not allowed in "${start}…": ${problems.join(' ')}`,
		);
	}
	return markdownToHtml(source, { features }).html;
}
