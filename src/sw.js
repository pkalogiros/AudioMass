const CACHE_NAME = 'audiomass-production-v1';
const assets = [
	'./',
	'./manifest.json',
	'./ico.png',
	'./icon.png',
	'./index.html',
	'./all.css',
	'./all.build.js',
	'./recorder-worklet.js',
	'./tempo-estimator.js',
	'./tempo-worker.js',
	'./wav.js',
	'./lame.js',
	'./flac.js',
	'./libflac.js',
	'./libflac.wasm',
	'./lz4-block-codec-wasm.js',
	'./lz4-block-codec.wasm',
	'./rnn_denoise.js',
	'./rnn_denoise.wasm',
	'./fonts/icomoon.ttf',
	'./fonts/icomoon.woff',
	'./eq.html',
	'./sp.html',
	'./mix.html',
	'./test.mp3'
];

self.addEventListener( 'install', async function () {
	const cache = await caches.open( CACHE_NAME );
	assets.forEach( function ( asset ) {
		cache.add( asset ).catch( function () {
			console.error( '[SW] Could not cache:', asset );
		});
	});
	self.skipWaiting();
});

self.addEventListener( 'activate', async function () {
	const keys = await caches.keys();
	await Promise.all( keys.map( function ( key ) {
		if ( key !== CACHE_NAME ) return caches.delete( key );
	}));
	self.clients.claim();
});

self.addEventListener( 'fetch', async function ( event ) {
	const request = event.request;
	event.respondWith( cacheFirst( request ) );
});

async function cacheFirst( request ) {
	const cachedResponse = await caches.match( request, { ignoreSearch: true } );
	if ( cachedResponse === undefined ) {
		console.error( '[SW] Not cached:', request.url );
		return fetch( request );
	}

	return cachedResponse;
}
