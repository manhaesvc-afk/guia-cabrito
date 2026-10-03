/* Cache offline: app e miniaturas na instalação; fotos grandes sob demanda ou pelo botão "Salvar fotos". */
const VERSAO = "80dca8eaa5";
const APP = `guia-app-${VERSAO}`;
const FOTOS = "guia-fotos";
self.window = self;
importScripts("data.js");

const G = self.GUIA;
const miniaturas = [
  ...G.especies.flatMap(s => s.fotos),
  ...Object.values(G.ambientes).filter(Boolean),
  ...[G.capa, G.mapa].filter(Boolean),
].map(f => `img/${f.id}-s.webp`);
const ESSENCIAIS = [
  "./", "index.html", "app.css", "app.js", "data.js", "manifest.webmanifest",
  "fonts/newsreader.woff2", "fonts/newsreader-italic.woff2", "fonts/schibsted-grotesk.woff2",
  "icons/icone.svg", "icons/icone-192.png", "icons/icone-512.png",
  ...(G.capa ? [`img/${G.capa.id}-l.webp`] : []),
];

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const c = await caches.open(APP);
    await c.addAll(ESSENCIAIS);
    await Promise.allSettled([...new Set(miniaturas)].map(u => c.add(u)));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith("guia-app-") && k !== APP) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  if (req.mode === "navigate") {
    e.respondWith((async () => (await caches.match("index.html", { cacheName: APP })) || fetch(req))());
    return;
  }
  e.respondWith((async () => {
    const achado = await caches.match(req, { ignoreSearch: true });
    if (achado) return achado;
    const caminho = new URL(req.url).pathname;
    try {
      const resp = await fetch(req);
      if (resp.ok && caminho.includes("/img/")) {
        const c = await caches.open(FOTOS);
        c.put(req, resp.clone());
      }
      return resp;
    } catch (erro) {
      // Sem sinal e foto grande não salva: mostra a miniatura no lugar.
      const mini = caminho.endsWith("-l.webp") && await caches.match(caminho.replace(/-l\.webp$/, "-s.webp").replace(/^.*\/img\//, "img/"));
      if (mini) return mini;
      throw erro;
    }
  })());
});
