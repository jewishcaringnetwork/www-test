import { glob } from 'astro/loaders';
import { defineCollection, reference } from 'astro:content';
import {
	legalSchema,
	pageSchema,
	personSchema,
	storySchema,
} from './schemas/page.ts';

const pages = defineCollection({
	loader: glob({ pattern: '**/*.json', base: './content/pages' }),
	schema: ({ image }) => pageSchema({ image, reference }),
});

const stories = defineCollection({
	loader: glob({ pattern: '*.md', base: './content/stories' }),
	schema: ({ image }) => storySchema({ image, reference }),
});

const people = defineCollection({
	loader: glob({ pattern: '*.json', base: './content/people' }),
	schema: ({ image }) => personSchema({ image, reference }),
});

const legal = defineCollection({
	loader: glob({ pattern: '*.md', base: './content/legal' }),
	schema: legalSchema,
});

export const collections = { pages, stories, people, legal };
