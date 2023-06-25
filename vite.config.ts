import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import type { UserConfig } from 'vite';

const config: UserConfig = {
	plugins: [
		sveltekit(),
		SvelteKitPWA({
			includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
			manifest: {
				name: 'homethingy-frontend',
				short_name: 'hf',
				start_url: './kitchen',
				description: 'My Awesome App description',
				theme_color: '#262626',
				background_color: '#262626',
				icons: [
					{
						src: 'android-chrome-192x192.png',
						sizes: '192x192',
						type: 'image/png'
					},
					{
						src: 'android-chrome-512x512.png',
						sizes: '512x512',
						type: 'image/png'
					}
				]
			}
		})
	],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
};

export default config;
