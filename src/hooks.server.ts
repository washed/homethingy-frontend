// Many thanks to https://sami.website/blog/SvelteKit-API-reverse-proxy/ for this code!

import type { Handle } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import type { RequestInit } from 'undici';
import { fetch } from 'undici';

const MY_API_BASE_URL = process.env.API_PROXY_DEST_URL;
const PROXY_PATH = '/api-proxy';

// TODO: a bunch of type errors here, it seems to be fine at runtime, though

const handleApiProxy: Handle = async ({ event }) => {
	/*
	TODO: fix this same origin check here at some point.
	const origin = event.request.headers.get('Origin');

	// reject requests that don't come from the webapp, to avoid your proxy being abused.
	if (!origin || new URL(origin).origin !== event.url.origin) {
		console.log('Request Origin header', origin);
		console.log('Rejecting request event:', event);
		throw error(403, 'Request Forbidden.');
	}
	*/

	// strip `/api-proxy` from the request path
	const strippedPath = event.url.pathname.substring(PROXY_PATH.length);

	// build the new URL path with your API base URL, the stripped path and the query string
	const urlPath = `${MY_API_BASE_URL}${strippedPath}${event.url.search}`;
	const proxiedUrl = new URL(urlPath);

	// Strip off header added by SvelteKit yet forbidden by underlying HTTP request
	// library `undici`.
	// https://github.com/nodejs/undici/issues/1470
	event.request.headers.delete('connection');

	let requestInit: RequestInit = {
		method: event.request.method,
		headers: event.request.headers
	};

	if (event.request.body != null && event.request.method === 'POST') {
		requestInit.body = event.request.body;
		requestInit.duplex = 'half';
	}

	return fetch(proxiedUrl.toString(), requestInit).catch((err) => {
		console.log('Could not proxy API request: ', err);
		throw err;
	});
};

export const handle: Handle = async ({ event, resolve }) => {
	// intercept requests to `/api-proxy` and handle them with `handleApiProxy`
	if (event.url.pathname.startsWith(PROXY_PATH)) {
		return await handleApiProxy({ event, resolve });
	}

	return await resolve(event);

	// ...the rest of your `handle` logic goes here
};
