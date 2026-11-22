/// <reference types="@netlify/functions" />

import {
	type CallToolResult,
	createMcpHandler,
	McpServer,
} from '@modelcontextprotocol/server';
import type { Config } from '@netlify/functions';
import * as z from 'astro/zod';
import { timingSafeEqual } from 'node:crypto';
import {
	COLLECTION_NAMES,
	COLLECTIONS,
	idsFromTree,
	type TreeEntry,
} from '../lib/collections.ts';
import { github, repoPath } from '../lib/github.ts';

const collectionSchema = z.enum(COLLECTION_NAMES).meta({
	description: 'Which kind of content. '
		+ COLLECTION_NAMES.map((c) => `\`${c}\`: ${COLLECTIONS[c].description}`)
			.join(' '),
});

const text = (value: unknown): CallToolResult => ({
	content: [{
		type: 'text',
		text: typeof value === 'string' ? value : JSON.stringify(value, null, 2),
	}],
});

/** Logs the failure and hands it back to Claude as a tool error instead of crashing the request. */
const toolError = (tool: string, err: unknown): CallToolResult => {
	console.error(`[mcp] ${tool} failed`, err);
	return {
		isError: true,
		content: [{
			type: 'text',
			text: err instanceof Error ? err.message : String(err),
		}],
	};
};

const handler = createMcpHandler(() => {
	const server = new McpServer({
		name: 'jcn-website',
		version: '0.1.0-dev',
	});

	server.registerTool(
		'list_content',
		{
			description:
				'List the editable items in one collection of the Jewish Caring Network '
				+ 'website, as ids. Call this first to find the id of the item the user '
				+ 'wants to read or change. An empty list means the collection has no '
				+ 'items yet. Site-wide settings (phone, address, tagline) are not a '
				+ 'collection.',
			inputSchema: z.strictObject({ collection: collectionSchema }),
		},
		async ({ collection }) => {
			console.info('[mcp] list_content', { collection });
			try {
				const gh = await github();
				const tree = await gh<{ tree: TreeEntry[]; truncated: boolean }>(
					`${repoPath()}/git/trees/main?recursive=1`,
				);
				if (tree.truncated) {
					throw new Error(
						'GitHub truncated the repo tree; the list would be incomplete',
					);
				}
				return text(idsFromTree(collection, tree.tree));
			} catch (err) {
				return toolError('list_content', err);
			}
		},
	);

	return server;
});

function isAuthorized(req: Request): boolean {
	const expected = Netlify.env.get('MCP_BEARER_TOKEN');
	if (!expected) return false; // fail closed

	const match = req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i);
	if (!match) return false;

	const given = Buffer.from(match[1].trim());
	const want = Buffer.from(expected);
	return given.length === want.length && timingSafeEqual(given, want);
}

export default async (req: Request) => {
	if (!isAuthorized(req)) {
		return new Response('Unauthorized', {
			status: 401,
			headers: { 'WWW-Authenticate': 'Bearer' },
		});
	}
	return handler.fetch(req);
};

export const config: Config = {
	path: '/mcp',
	rateLimit: { windowSize: 60, windowLimit: 60, aggregateBy: ['ip', 'domain'] },
};
