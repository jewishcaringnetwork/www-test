import sugarcube from '@sugarcube-sh/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
	server: {
		port: 3000,
	},
	build: {
		inlineStylesheets: 'never',
	},
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
