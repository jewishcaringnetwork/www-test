import { markdownToHtml, markdownToMdast } from 'satteri';
import { hrefSchema } from '../schemas/shared.ts';

/**
 * Renders the limited Markdown that `markdown()` in `src/schemas/shared.ts`
 * allows: paragraphs, ## and ### headings, bulleted and numbered lists,
 * **bold**, *italic* and [links](/path). Anything else fails the build rather
 * than rendering, the same way bad JSON does.
 *
 * Family stories (`content/stories/*.md`) are checked with the same rules
 * plus quotes and images (`quotes`, `images`, `gfm`), then rendered by
 * Astro itself so their images get resized.
 *
 * Uses Sätteri, the Markdown engine Astro 7 ships with.
 */

export interface MarkdownOptions {
	/** Allow ## and ### headings. Off for fields like FAQ answers. */
	headings?: boolean;
	/**
	 * Shift heading levels down by this much, for Markdown under a heading the
	 * component renders: 1 turns ## into h3 and ### into h4.
	 */
	headingOffset?: 0 | 1;
	/** Allow > block quotes (stories). */
	quotes?: boolean;
	/**
	 * Allow images from `content/images/` with alt text (stories). Checking
	 * only; `renderMarkdown` can't resize them, so it isn't used with this.
	 */
	images?: boolean;
	/**
	 * Parse with GitHub-flavored Markdown, as Astro renders stories, so its
	 * tables and strikethrough get caught instead of passing as text.
	 */
	gfm?: boolean;
}

type Node = {
	type: string;
	depth?: number;
	url?: string;
	alt?: string;
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
	delete: 'strikethrough',
	footnoteReference: 'footnotes',
	footnoteDefinition: 'footnotes',
	code: 'code blocks',
	inlineCode: 'inline code',
	thematicBreak: 'horizontal rules',
	linkReference: 'reference-style links',
	definition: 'reference-style links',
};

/** Lists what in `source` the schema doesn't allow; empty if it's fine. */
export function markdownProblems(
	source: string,
	{ headings = true, quotes, images, gfm }: MarkdownOptions = {},
): string[] {
	const problems = new Set<string>();
	const ok = new Set(allowed);
	if (quotes) ok.add('blockquote');
	if (images) ok.add('image');

	const walk = (node: Node) => {
		if (!ok.has(node.type)) {
			problems.add(`Not allowed: ${names[node.type] ?? node.type}.`);
		} else if (node.type === 'heading') {
			if (!headings) problems.add('Headings are not allowed here.');
			else if (node.depth !== 2 && node.depth !== 3) {
				problems.add(
					`Use ## or ### for headings, not ${'#'.repeat(node.depth ?? 1)}.`,
				);
			}
		} else if (node.type === 'image') {
			if (!node.alt?.trim()) {
				problems.add('Images need alt text: ![what the photo shows](...).');
			}
			if (!node.url?.startsWith('../images/')) {
				problems.add(
					`Image "${node.url}" must be a file in content/images, written as ../images/<file>.`,
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

	walk(
		markdownToMdast(source, { features: { ...features, gfm: !!gfm } }) as Node,
	);
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
	const html = markdownToHtml(source, { features }).html;
	const offset = options.headingOffset ?? 0;
	// Source HTML is rejected above, so every <hN> tag here is generated.
	return offset
		? html.replace(
			/<(\/?)h([23])>/g,
			(_, slash, level) => `<${slash}h${Number(level) + offset}>`,
		)
		: html;
}
