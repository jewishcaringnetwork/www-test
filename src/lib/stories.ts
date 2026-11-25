/**
 * Family stories the client has approved for public use (`approved: true` in
 * `content/stories/*.md`), newest first. The archive and every story page
 * go through this, so an unapproved story is never built, linked or listed
 * in the sitemap.
 */
import { type CollectionEntry, getCollection } from 'astro:content';
import { markdownProblems } from './markdown.ts';

export type Story = CollectionEntry<'stories'>;

export const approvedStories = async (): Promise<Story[]> =>
	(await getCollection('stories', (story) => story.data.approved))
		.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

/** A story's page. The file name is the slug. */
export const storyHref = (story: Story) => `/family-stories/${story.id}`;

/**
 * Markdown in every story file, approved or not, that the site doesn't
 * allow (see `storySchema`), as one message per problem file. Checked at
 * build so a bad import fails before anyone approves it.
 */
export const storyProblems = async (): Promise<string[]> =>
	(await getCollection('stories')).flatMap((story) => {
		const problems = markdownProblems(story.body ?? '', {
			quotes: true,
			images: true,
			gfm: true,
		});
		return problems.length
			? [`content/stories/${story.id}.md: ${problems.join(' ')}`]
			: [];
	});
