/**
 * Section backgrounds for a page's blocks. Rules:
 * docs/design/color-blocking.md.
 */

/** What a section is painted with; see src/components/blocks/section.astro. */
export type SectionBackground = 'paper' | 'white' | 'blue';

/**
 * Blocks whose content sits in its own cards or panels. They read as
 * separate on the page's paper, and a white card loses its edge on white, so
 * they always stay on paper. Add a block type here when its component puts
 * its content in cards or panels.
 */
const selfContained = new Set(['cards', 'contact', 'cta', 'form']);

/**
 * Backgrounds for a page's blocks, top to bottom. Only landing pages (a
 * hero header), whose sections are stacked blocks, get bands: the first open
 * section after the hero is white, and open sections alternate from there,
 * with self-contained blocks staying on paper. Pages with a plain header are
 * all paper: their headings already set sections apart.
 *
 * `blue` is not assigned to any block yet. It is kept for a future block
 * it suits, such as impact numbers, at most once per page.
 */
export const sectionBackgrounds = (
	header: 'header' | 'hero',
	types: readonly string[],
): SectionBackground[] => {
	if (header !== 'hero') return types.map(() => 'paper');
	let previous: SectionBackground = 'paper';
	return types.map((type) => {
		previous = selfContained.has(type) || previous === 'white'
			? 'paper'
			: 'white';
		return previous;
	});
};
