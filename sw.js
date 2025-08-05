const CACHE_NAME = 'corrida-app-cache-v1';
// Lista de todos os arquivos que compõem o seu app
const urlsToCache = [
    '/',
    'index.html',
    'historico.html',
    'rankings.html',
    'graficos.html',
    'desafios.html',
    'criar-desafio.html',
    'treinador.html',
    'style.css',
    'script.js',
    'manifest.json',
    'icons/icon-192x192.png',
    'icons/icon-512x512.png'
];

// Evento de instalação: abre o cache e salva nossos arquivos
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache aberto');
                return cache.addAll(urlsToCache);
            })
    );
});

// NOVO CÓDIGO COM STALE-WHILE-REVALIDATE
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(event.request).then(cachedResponse => {
                const fetchedResponse = fetch(event.request).then(networkResponse => {
                    // Se a resposta da rede for válida, a colocamos no cache
                    if(networkResponse && networkResponse.status === 200) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                });

                // Retorna o que estiver no cache primeiro, e na próxima vez já terá a versão da rede
                return cachedResponse || fetchedResponse;
            });
        })
    );
});

// Evento de "activate": gerencia caches antigos
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // Se o nome do cache não for o atual, ele será deletado
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: limpando cache antigo', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
