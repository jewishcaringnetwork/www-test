/** What a section is painted with; see src/components/blocks/section.astro. */
export type SectionBackground = 'paper' | 'white' | 'blue';

/**
 * A block's background from its position on the page (`index`, from 0), so
 * plain sections alternate without anyone choosing: the first is paper, the
 * page's own background carrying on from the header; the second white; and
 * so on. A block's `band` overrides its own position only, so the sections
 * either side of a band keep their colors.
 */
export const sectionBackground = (
	block: { band?: 'blue' },
	index: number,
): SectionBackground => block.band ?? (index % 2 === 0 ? 'paper' : 'white');
