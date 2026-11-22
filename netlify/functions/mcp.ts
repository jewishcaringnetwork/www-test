/// <reference types="@netlify/functions" />

import {
	type CallToolResult,
	createMcpHandler,
	McpServer,
} from '@modelcontextprotocol/server';
import type { Config } from '@netlify/functions';
import { timingSafeEqual } from 'node:crypto';

const text = (value: unknown): CallToolResult => ({
	content: [{
		type: 'text',
		text: typeof value === 'string' ? value : JSON.stringify(value, null, 2),
	}],
});

const handler = createMcpHandler(() => {
	const server = new McpServer({
		name: 'jcn-website',
		version: '0.1.0-dev',
	});

	server.registerTool('ping', {
		description: 'Ping the server',
	}, () => text('pong'));

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
