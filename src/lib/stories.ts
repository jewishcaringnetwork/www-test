/**
 * Family stories the client has approved for public use (`approved: true` in
 * `content/stories/*.md`), newest first. Every story page, story list and
 * teaser goes through this, so an unapproved story is never built, linked or
 * listed in the sitemap.
 */
import { type CollectionEntry, getCollection } from 'astro:content';

export type Story = CollectionEntry<'stories'>;

export const approvedStories = async (): Promise<Story[]> =>
	(await getCollection('stories', (story) => story.data.approved))
		.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

/** A story's page. The file name is the slug. */
export const storyHref = (story: Story) => `/family-stories/${story.id}`;

/** The date a story was shared, e.g. "November 1, 2026". */
export const storyDate = (date: Date) =>
	date.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		timeZone: 'UTC',
	});
