import sitemap from '@astrojs/sitemap';
import sugarcube from '@sugarcube-sh/vite';
import { defineConfig } from 'astro/config';
import { readdirSync, readFileSync } from 'node:fs';

/**
 * URL paths of pages in `content/pages/` marked `noindex: true`. The file path
 * is the URL, as in `src/pages/[...slug].astro`.
 */
function noindexPaths() {
	const dir = new URL('./content/pages/', import.meta.url);
	return new Set(
		readdirSync(dir, { recursive: true })
			.map((file) => file.replaceAll('\\', '/'))
			.filter((file) => file.endsWith('.json'))
			.filter((file) =>
				JSON.parse(readFileSync(new URL(file, dir), 'utf8')).noindex === true
			)
			.map((file) => '/' + file.replace(/(^|\/)index\.json$|\.json$/, '')),
	);
}

const hidden = noindexPaths();

export default defineConfig({
	// The production origin (www redirects here), so the sitemap lists the
	// final URLs. Deploy previews list these URLs too.
	site: 'https://jewishcaringnetwork.org',
	server: {
		port: 3000,
	},
	build: {
		inlineStylesheets: 'never',
	},
	integrations: [
		sitemap({
			// Leave out noindex pages, everything under /preview/ and the 404.
			filter(page) {
				const path = new URL(page).pathname.replace(/(.)\/$/, '$1');
				return !hidden.has(path) && path !== '/404'
					&& path !== '/preview' && !path.startsWith('/preview/');
			},
		}),
	],
	vite: {
		plugins: [
			sugarcube({
				unoOptions: {
					outputToCssLayers: {
						cssLayerName(layer) {
							if (layer === 'preflights') return 'global';
							if (layer === 'default') return 'utility';
							return layer;
						},
					},
				},
			}),
		],
	},
});
