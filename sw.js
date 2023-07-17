'use strict'
importScripts('sw-toolbox.js')
toolbox.precache(['index.html', 'style/style.css'])
toolbox.router.get('/images/*', toolbox.cacheFirst)
toolbox.router.get('/*', toolbox.networkFirst, { networkTimeoutSeconds: 5 })

self.addEventListener('install', e => {
  e.waitUntil(
    // после установки service worker
    // открыть новый кэш
    caches.open('my-pwa-cache').then(cache => {
      // добавляем все URL ресурсов, которые хотим закэшировать
      return cache.addAll([
        '/',
        '/index.html',
        '/app.js',
        '/style.css',
        '/notation.css',
        '/img/arrow-down-mobile.svg',
        'img/arrow-left.svg',
        'img/arrow-right.svg',
        'img/arrows.svg',
        'img/logo.svg'
      ])
    })
  )
})
