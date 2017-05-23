self.addEventListener('install', event => {
	event.waitUntil(
		caches.open('twitter-core-v1')
			.then(cache => cache.addAll([
				'/',
				'/assets/colors.js',
				'/assets/map.js',
				'/assets/build.min.css',
				'/assets/puff.svg'
			]))
			.then(self.skipWaiting())
	);
});

self.addEventListener('fetch', event => {
	if (event.request.mode === 'navigate') {
		event.respondWith(
			fetch(event.request)
				.then(response => toPageCache(event.request, response))
				.catch(() => fromPageCache(event.request))
				.catch(() => fromCoreCache('/offline'))
		);
	} else {
		event.respondWith(
			fetch(event.request)
				.catch(() => fromPageCache(event.request))
				.catch(() => fromCoreCache('/offline'))
		);
	}
});

function fromCoreCache(url) {
	return caches.open('twitter-core-v1')
		.then(cache => cache.match(url))
		.then(response => response ? response : Promise.reject());
}

function fromPageCache(request) {
	return caches.open('twitter-cache-v1')
		.then(cache => cache.match(request))
		.then(response => response ? response : Promise.reject());
}

function toPageCache(request, response) {
	const clone = response.clone();
	caches.open('twitter-cache-v1')
		.then(cache => cache.put(request, clone));

	return response;
}
