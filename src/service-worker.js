
workbox.core.setCacheNameDetails({prefix: "emarifer-mygps"});

workbox.routing.registerRoute(
    new RegExp('.*www.ign.es\/wms-inspire.*'),
    new workbox.strategies.NetworkFirst({
      cacheName: 'cache-maps'
    })
  ); // StaleWhileRevalidate

  workbox.routing.registerRoute(
      new RegExp('.*gpx'),
      new workbox.strategies.NetworkFirst({
        cacheName: 'cache-track'
      })
    ); // StaleWhileRevalidate

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/**
 * The workboxSW.precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */
self.__precacheManifest = [].concat(self.__precacheManifest || []);
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});

workbox.routing.registerNavigationRoute(workbox.precaching.getCacheKeyForURL("index.html"));