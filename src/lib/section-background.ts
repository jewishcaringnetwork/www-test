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
 * The block type that gets the blue band, for emphasis. At most one per page:
 * a second one is treated as an open section.
 */
const emphasis = 'impact';

/**
 * Backgrounds for a page's blocks, top to bottom. Only landing pages (a
 * hero header), whose sections are stacked blocks, get bands: the first open
 * section after the hero is white, and open sections alternate from there,
 * with self-contained blocks staying on paper. The first impact block is
 * blue instead, and the next open section after it is white. Pages with a
 * plain header are all paper: their headings already set sections apart.
 */
export const sectionBackgrounds = (
	header: 'header' | 'hero',
	types: readonly string[],
): SectionBackground[] => {
	if (header !== 'hero') return types.map(() => 'paper');
	let previous: SectionBackground = 'paper';
	let blueUsed = false;
	return types.map((type) => {
		if (type === emphasis && !blueUsed) {
			blueUsed = true;
			previous = 'blue';
		} else {
			previous = selfContained.has(type) || previous === 'white'
				? 'paper'
				: 'white';
		}
		return previous;
	});
};
