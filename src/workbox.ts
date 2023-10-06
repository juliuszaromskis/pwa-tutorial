/// <reference lib="WebWorker" />

import { clientsClaim, RouteHandlerCallbackOptions } from "workbox-core";
import { precacheAndRoute, matchPrecache } from "workbox-precaching";
import { registerRoute } from "workbox-routing";

declare const self: ServiceWorkerGlobalScope;

// Make sure service worker activates immediately
clientsClaim();
self.skipWaiting();

// SPA Navigation Fallback, custom "network first" strategy implementation
registerRoute(
    ({ request }) => { console.log(request); return request.mode === "navigate" },
    navigateFallback,
    "GET"
);

// Cache all necessary assets with Workbox
precacheAndRoute(self.__WB_MANIFEST);

async function navigateFallback(args: RouteHandlerCallbackOptions) {
    const defaultFallbackUrl = "/index.html";
    let fetchedResponse: Response | undefined;

    const fetchDelay = 2500;
    const controller = new AbortController();
    const signal = controller.signal;
    const cancelFetch = global.setTimeout(
        () => controller.abort(),
        fetchDelay
    );

    try {
        console.debug(`Attempting to fetch ${args.request.url}.`);
        fetchedResponse = await fetch(args.request.url, { signal });
    } catch (error) {
        console.warn(`Fetch Error: ${error}`);
    }

    clearTimeout(cancelFetch);

    if (!fetchedResponse?.ok) {
        console.debug(
            `Failed to fetch ${args.request.url}. Serving ${defaultFallbackUrl} from cache.`
        );
        fetchedResponse = await matchPrecache(defaultFallbackUrl);
    }

    return fetchedResponse || Response.error();
}
