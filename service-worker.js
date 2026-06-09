const CACHE_NAME = "canastra-cache-v2"; // Mudamos a versão para forçar atualização

const urlsToCache = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json"
];

// instalar
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Usamos o .addAll mas aceitando que o manifest pode puxar itens externos
      return cache.addAll(urlsToCache);
    }).then(() => self.skipWaiting()) // Força o SW novo a assumir o controle na hora
  );
});

// ativar
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim()) // Ativa nos clientes imediatamente
  );
});

// fetch (estratégia Network-First com Fallback para Cache - melhor para PWA em desenvolvimento)
self.addEventListener("fetch", event => {
  // Ignora requisições de áudio do google se der problema ou foca no padrão
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Se a rede responder, guarda uma cópia atualizada no cache
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Se estiver totalmente sem internet, serve o que está no cache
        return caches.match(event.request);
      })
  );
});