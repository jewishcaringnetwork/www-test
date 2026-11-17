import { defineConfig } from '@sugarcube-sh/cli';

export default defineConfig({
	utilities: {
		classes: {
			margin: {
				source: 'space.*',
				prefix: 'm',
				directions: ['all', 'top', 'right', 'bottom', 'left', 'x', 'y'],
			},
			padding: {
				source: 'space.*',
				prefix: 'p',
				directions: ['all', 'top', 'right', 'bottom', 'left', 'x', 'y'],
			},
		},
	},
});
