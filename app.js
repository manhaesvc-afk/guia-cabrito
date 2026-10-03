"use strict";
(() => {
const G = window.GUIA;
const SP = G.especies;
const POR_ID = new Map(SP.map(s => [s.id, s]));
const AMEACA = { CR: "Criticamente em perigo", EN: "Em perigo", VU: "Vulnerável", NT: "Quase ameaçada", LC: "Menos preocupante", DD: "Dados insuficientes", NE: "Não avaliada" };
const GRAVES = ["CR", "EN", "VU"];
const HABITOS = ["Erva terrícola ou rupícola", "Erva epífita", "Arbusto ou subarbusto", "Árvore"];
const CHAVE = "guia-cabrito:vistos";
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const sem = s => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const ic = (id, cls = "ic") => `<svg class="${cls}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
const img = (f, k) => `img/${f.id}-${k}.webp`;
const ameacada = s => GRAVES.includes(s.es) || GRAVES.includes(s.br);
const piorAmeaca = s => GRAVES.find(c => s.es === c || s.br === c);

/* ---------- Nome científico ---------- */
const QUALIF = /^(aff\.|cf\.|sp\.?\d*|var\.|subsp\.)$/i;
function nomeHTML(s) {
  const ws = `${s.gen} ${s.ep}`.split(/\s+/);
  if (ws.slice(1).some(w => w.toLowerCase().replace(/\.$/, "") === "gen")) return esc(ws.join(" "));
  return ws.map(w => QUALIF.test(w) ? esc(w) : `<i>${esc(w)}</i>`).join(" ");
}
const nomeTexto = s => `${s.gen} ${s.ep}`;

/* ---------- Caderneta (espécies vistas) ---------- */
let vistos = {};
try { vistos = JSON.parse(localStorage.getItem(CHAVE)) || {}; } catch { vistos = {}; }
function salvarVistos() { try { localStorage.setItem(CHAVE, JSON.stringify(vistos)); } catch {} }
function alternarVisto(id) {
  if (vistos[id]) delete vistos[id]; else vistos[id] = new Date().toISOString().slice(0, 10);
  salvarVistos();
  const s = POR_ID.get(id), n = Object.keys(vistos).length;
  if (vistos[id]) avisar(n === SP.length ? "Você encontrou as 64 espécies do guia." : `Marcada como vista. ${n} de ${SP.length}.`);
  else avisar("Marcação removida.");
  atualizarMarcacoes(id);
  return s;
}
function atualizarMarcacoes(id) {
  document.querySelectorAll(`[data-marcar="${id}"]`).forEach(b => {
    b.setAttribute("aria-pressed", !!vistos[id]);
    b.classList.remove("pulso"); void b.offsetWidth; if (vistos[id]) b.classList.add("pulso");
    const rot = b.querySelector(".rot"); if (rot) rot.textContent = vistos[id] ? "Vista" : "Marcar como vista";
  });
  desenharTracos(id);
  if (filtro.flag === "vistas" || filtro.flag === "nao-vistas") desenharGrade();
  const vem = $("#ficha .ficha-visto-em");
  if (vem && Number(vem.dataset.id) === id) vem.textContent = vistos[id] ? `Vista em ${dataBR(vistos[id])}` : "";
}
const dataBR = iso => new Date(iso + "T12:00").toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });

/* ---------- Aviso ---------- */
let tAviso;
function avisar(msg) {
  const a = $("#aviso"); a.textContent = msg; a.classList.add("on");
  clearTimeout(tAviso); tAviso = setTimeout(() => a.classList.remove("on"), 2400);
}

/* ---------- Imagens com pré-visualização desfocada ---------- */
function figura(f, k, alt, extra = "") {
  if (!f) return "";
  return `<img src="${img(f, k)}" alt="${esc(alt)}" loading="lazy" decoding="async" ${extra} onload="this.classList.add('ok')">`;
}
const fundoLq = f => f ? `style="background-image:url('${f.lq}')"` : "";

/* ================= Início ================= */
function desenharInicio() {
  const conta = n => SP.filter(s => s.amb === n).length;
  const nAmeacadas = SP.filter(ameacada).length;
  const familias = new Set(SP.map(s => s.fam)).size;
  const amb = (nome, texto) => {
    const f = G.ambientes[nome];
    return `<a class="ambiente" href="#/especies?amb=${encodeURIComponent(nome)}" ${fundoLq(f)}>
      ${figura(f, "l", "")}
      <div class="ambiente-texto"><h3>${esc(nome === "Ilha de vegetação" ? "Ilhas de vegetação" : "Capões de mata")}</h3>
      <p>${texto}</p><span class="contagem">Ver as ${conta(nome)} espécies ${ic("seta")}</span></div></a>`;
  };
  $("#inicio").innerHTML = `
  <header class="capa" ${fundoLq(G.capa)}>
    ${G.capa ? `<picture>${G.capaAlta ? `<source media="(max-aspect-ratio: 1/1)" srcset="${img(G.capaAlta, "l")}">` : ""}<img src="${img(G.capa, "l")}" alt="Agulha de granito da Pedra do Fio, coberta de vegetação, sob céu azul" fetchpriority="high"></picture>` : ""}
    <p class="capa-credito">Complexo Pedra do Fio e Pedra do Cabrito, Castelo (ES)</p>
    <div class="capa-texto">
      <p class="capa-sup">Guia de campo</p>
      <h1><span>Plantas da</span><span>Pedra do Cabrito</span></h1>
      <p class="capa-lead">${SP.length} espécies da flora vascular em ${familias} famílias botânicas, num inselbergue da Mata Atlântica no Espírito Santo.</p>
      <div class="capa-acoes">
        <a class="btn btn-liquen" href="#/especies">Ver as ${SP.length} espécies</a>
        <a class="btn btn-vidro" href="#sobre">Conhecer a área</a>
      </div>
    </div>
  </header>

  <div class="corpo">
    <section class="secao" id="sobre">
      <h2>Um jardim sobre a <em>rocha</em></h2>
      <div class="prosa">
        <p>A Pedra do Cabrito é um complexo de afloramentos rochosos graníticos (inselbergues) na comunidade de Estrela do Norte, no limite entre Castelo e Cachoeiro de Itapemirim, no Espírito Santo.</p>
        <p>Ali foram registradas 225 espécies de plantas, das quais 90 são endêmicas da Mata Atlântica. Este guia reúne ${SP.length} das mais características, ${nAmeacadas} delas ameaçadas de extinção no estado ou no país.</p>
        <p class="citacao">Afinal, só protegemos e amamos o que conhecemos.</p>
      </div>
      <dl class="ficha-tecnica">
        <div><dt>Altitude</dt><dd>275 a 1.150 m</dd></div>
        <div><dt>Área estudada</dt><dd>cerca de 40 ha</dd></div>
        <div><dt>Coordenadas</dt><dd>20°56′43″S<br>41°19′44″W</dd></div>
        <div><dt>Proteção formal</dt><dd>nenhuma</dd></div>
      </dl>
    </section>

    <section class="secao" id="ambientes">
      <h2>Dois ambientes</h2>
      <div class="prosa"><p>Sobre a rocha exposta, a vegetação não forma um tapete contínuo, mas manchas separadas por granito nu.</p></div>
      <div class="ambientes">
        ${amb("Ilha de vegetação", "Tufos de bromélias, canelas-de-ema e ciperáceas sobre a rocha nua, expostos ao sol e ao vento.")}
        ${amb("Capão de mata", "Moitas de arbustos e árvores em depressões da rocha, com solo mais profundo, sombra e umidade.")}
      </div>
    </section>

    ${G.mapa ? `<section class="secao" id="mapa">
      <h2>Onde fica</h2>
      <figure class="mapa">
        <button type="button" data-abrir-mapa aria-label="Ampliar o mapa de localização">${figura(G.mapa, "l", "Mapa de localização da Pedra do Cabrito no Brasil, no Espírito Santo e no município de Castelo")}</button>
        <figcaption>Brasil, Espírito Santo e o município de Castelo, com a área de estudo e a imagem de satélite do polígono amostrado. Toque para ampliar.</figcaption>
      </figure>
    </section>` : ""}

    <section class="secao" id="uso">
      <h2>No campo</h2>
      <ul class="dicas">
        <li><span class="ic-bola">${ic("busca")}</span><div><strong>Busque pelo que você vê</strong><span>A busca procura no nome, na família e na descrição. Experimente “amarela”, “roseta” ou “epífita”.</span></div></li>
        <li><span class="ic-bola">${ic("visto")}</span><div><strong>Monte sua caderneta</strong><span>Marque cada espécie que encontrar. A marcação fica salva neste aparelho, com a data.</span></div></li>
        <li><span class="ic-bola">${ic("ampliar")}</span><div><strong>Veja de perto</strong><span>Toque numa foto para abrir em tela cheia. Afaste dois dedos ou toque duas vezes para ampliar.</span></div></li>
      </ul>
      <div class="offline" id="offline"></div>
    </section>
  </div>

  <footer class="rodape">
    <p><strong>Plantas da Pedra do Cabrito</strong>, guia de campo. Textos e fotografias de Vitor da Cunha Manhães e Eduarda Koeler. 2026.</p>
    <p>Nomes conforme a Flora e Funga do Brasil. Material testemunho depositado no herbário MBML.</p>
  </footer>`;
  desenharOffline();
}

/* ---------- Uso offline ---------- */
const FOTOS_L = [...new Set([
  ...SP.flatMap(s => s.fotos.map(f => img(f, "l"))),
  ...Object.values(G.ambientes).filter(Boolean).map(f => img(f, "l")),
  ...[G.capa, G.capaAlta, G.mapa].filter(Boolean).map(f => img(f, "l")),
])];
let instalar = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); instalar = e; desenharOffline(); });
async function fotosSalvas() {
  if (!("caches" in window)) return 0;
  const c = await caches.open("guia-fotos");
  const ks = new Set((await c.keys()).map(r => new URL(r.url).pathname));
  return FOTOS_L.filter(u => ks.has(new URL(u, location.href).pathname)).length;
}
async function desenharOffline(progresso) {
  const el = $("#offline"); if (!el) return;
  const suporta = "serviceWorker" in navigator && "caches" in window && location.protocol !== "file:";
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.navigator.standalone;
  const salvas = suporta ? (progresso ?? await fotosSalvas()) : 0;
  const total = FOTOS_L.length, pronto = salvas >= total;
  el.innerHTML = `
    <h3>${pronto ? "Pronto para usar sem sinal" : "Leve o guia para a trilha"}</h3>
    <p>${!suporta ? "Abra o guia pelo endereço na internet para poder salvá-lo neste aparelho."
      : pronto ? `As ${total} fotos em alta resolução estão salvas neste aparelho.`
      : `O guia e as miniaturas já funcionam sem internet. Salve também as ${total} fotos em alta resolução (cerca de ${G.mbFotosGrandes} MB) para ampliá-las no topo da pedra.`}</p>
    ${suporta && !pronto ? `<div class="barra"><i style="width:${(salvas / total * 100).toFixed(1)}%"></i></div>` : ""}
    <div class="acoes">
      ${suporta && !pronto ? `<button class="btn btn-liquen" data-baixar ${progresso != null ? "disabled" : ""}>${ic("baixar")}${progresso != null ? `Salvando ${salvas} de ${total}` : salvas ? `Salvar as ${total - salvas} restantes` : "Salvar fotos para uso offline"}</button>` : ""}
      ${instalar ? `<button class="btn btn-vidro" data-instalar>Instalar na tela inicial</button>` : ""}
    </div>
    ${ios ? `<p style="margin:12px 0 0">No iPhone, toque em Compartilhar e depois em “Adicionar à Tela de Início”.</p>` : ""}`;
}
async function baixarTudo() {
  try { await navigator.storage?.persist?.(); } catch {}
  const c = await caches.open("guia-fotos");
  let feitas = await fotosSalvas();
  desenharOffline(feitas);
  const faltam = [];
  for (const u of FOTOS_L) if (!(await c.match(u))) faltam.push(u);
  let i = 0, falhas = 0;
  const trabalhador = async () => {
    while (i < faltam.length) {
      const u = faltam[i++];
      try { const r = await fetch(u); if (r.ok) await c.put(u, r); else falhas++; } catch { falhas++; }
      desenharOffline(++feitas);
    }
  };
  await Promise.all([trabalhador(), trabalhador(), trabalhador(), trabalhador()]);
  await desenharOffline();
  avisar(falhas ? `${falhas} fotos não foram salvas. Verifique a conexão e toque de novo.` : "Fotos salvas. O guia funciona sem internet.");
}

/* ================= Lista ================= */
const filtro = { q: "", amb: "", hab: "", flag: "" };
function lerFiltroDaUrl() {
  const p = new URLSearchParams(location.hash.split("?")[1] || "");
  if (p.has("amb")) { filtro.amb = p.get("amb"); filtro.hab = ""; filtro.flag = ""; filtro.q = ""; }
}
function passa(s, ign) {
  if (ign !== "amb" && filtro.amb && s.amb !== filtro.amb) return false;
  if (ign !== "hab" && filtro.hab && s.habito !== filtro.hab) return false;
  if (ign !== "flag") {
    if (filtro.flag === "ameacadas" && !ameacada(s)) return false;
    if (filtro.flag === "vistas" && !vistos[s.id]) return false;
    if (filtro.flag === "nao-vistas" && vistos[s.id]) return false;
  }
  if (filtro.q) {
    const alvo = sem(`${s.gen} ${s.ep} ${s.fam} ${s.habito} ${s.amb} ${s.desc}`);
    if (!sem(filtro.q).split(/\s+/).filter(Boolean).every(t => alvo.includes(t))) return false;
  }
  return true;
}
const filtradas = () => SP.filter(s => passa(s));

function desenharLista() {
  $("#lista").innerHTML = `
  <div class="barra-topo">
    <div class="barra-linha">
      <a class="btn-icone" href="#/" aria-label="Voltar ao início">${ic("voltar")}</a>
      <label class="busca"><span class="sr">Buscar espécies</span>${ic("busca")}
        <input id="q" type="search" inputmode="search" enterkeyhint="search" autocomplete="off" placeholder="Nome ou característica" value="${esc(filtro.q)}">
        <button class="btn-icone limpar" type="button" data-limpar-busca aria-label="Limpar busca" ${filtro.q ? "" : "hidden"}>${ic("fechar")}</button>
      </label>
    </div>
    <div class="caderneta" aria-label="Sua caderneta de campo">
      <div class="tracos" id="tracos" aria-hidden="true">${SP.map(s => `<i data-t="${s.id}"></i>`).join("")}</div>
      <span class="caderneta-num" id="caderneta-num"></span>
    </div>
    <div class="chips" id="chips" role="toolbar" aria-label="Filtros"></div>
  </div>
  <div class="resumo" id="resumo"></div>
  <div class="familias" id="grade"></div>`;
  desenharTracos();
  desenharChips();
  desenharGrade();
}

function desenharTracos(novo) {
  const n = Object.keys(vistos).length;
  document.querySelectorAll("#tracos i").forEach(t => {
    const id = Number(t.dataset.t), v = !!vistos[id];
    t.classList.toggle("visto", v);
    if (id === novo && v) { t.classList.remove("novo"); void t.offsetWidth; t.classList.add("novo"); }
  });
  const el = $("#caderneta-num");
  if (el) el.innerHTML = `<b>${n}</b> de ${SP.length} vistas`;
}

function desenharChips() {
  const chip = (grupo, valor, rotulo, n, cor = "") => {
    const ativo = filtro[grupo] === valor;
    return `<button class="chip" type="button" data-grupo="${grupo}" data-valor="${esc(valor)}" aria-pressed="${ativo}">${cor}${esc(rotulo)}${n != null ? ` <span class="n">${n}</span>` : ""}</button>`;
  };
  const conta = (campo, valor) => SP.filter(s => passa(s, campo) && (campo === "flag"
    ? (valor === "ameacadas" ? ameacada(s) : valor === "vistas" ? !!vistos[s.id] : !vistos[s.id])
    : s[campo === "amb" ? "amb" : "habito"] === valor)).length;
  $("#chips").innerHTML = [
    chip("amb", "Ilha de vegetação", "Ilha de vegetação", conta("amb", "Ilha de vegetação")),
    chip("amb", "Capão de mata", "Capão de mata", conta("amb", "Capão de mata")),
    chip("flag", "ameacadas", "Ameaçadas", conta("flag", "ameacadas"), `<span class="ponto" style="color:var(--en)"></span>`),
    chip("flag", "nao-vistas", "Ainda não vistas", conta("flag", "nao-vistas")),
    chip("flag", "vistas", "Vistas", conta("flag", "vistas")),
    `<span class="chip-sep" aria-hidden="true"></span>`,
    ...HABITOS.map(h => chip("hab", h, h, conta("hab", h))),
  ].join("");
}

function desenharGrade() {
  const lista = filtradas();
  const ativos = filtro.q || filtro.amb || filtro.hab || filtro.flag;
  $("#resumo").innerHTML = `<span><b>${lista.length}</b> ${lista.length === 1 ? "espécie" : "espécies"}${ativos ? ` de ${SP.length}` : ""}</span>${ativos ? `<button type="button" data-limpar-tudo>Limpar filtros</button>` : ""}`;
  if (!lista.length) {
    $("#grade").innerHTML = `<div class="vazio"><p>${filtro.flag === "vistas" ? "Nenhuma espécie marcada como vista com estes filtros." : "Nenhuma espécie combina com estes filtros."}</p><button class="btn btn-linha" type="button" data-limpar-tudo>Mostrar todas as espécies</button></div>`;
    return;
  }
  const grupos = new Map();
  lista.forEach(s => { if (!grupos.has(s.fam)) grupos.set(s.fam, []); grupos.get(s.fam).push(s); });
  $("#grade").innerHTML = [...grupos].map(([fam, ss]) => `
    <section class="familia" aria-labelledby="f-${esc(fam)}">
      <div class="familia-cab"><h2 id="f-${esc(fam)}">${esc(fam)}</h2><span>${ss.length}</span></div>
      <div class="grade">${ss.map(cartao).join("")}</div>
    </section>`).join("");
}

function cartao(s) {
  const f = s.fotos[0], grave = piorAmeaca(s);
  return `<article class="cartao">
    <a href="#/especie/${s.id}" data-especie="${s.id}">
      <div class="cartao-foto" ${fundoLq(f)} data-vt="${s.id}">
        ${f ? figura(f, "s", `Foto de ${nomeTexto(s)}`) : `<div class="sem-foto"><span>${esc(s.gen[0])}</span><small>sem foto</small></div>`}
      </div>
      ${grave ? `<span class="selo-ameaca selo-${grave}" title="${AMEACA[grave]}">${grave}</span>` : ""}
      <span class="cartao-nome nome">${nomeHTML(s)}</span>
      <span class="cartao-meta">${esc(s.habito)}</span>
    </a>
    <button class="marcar" type="button" data-marcar="${s.id}" aria-pressed="${!!vistos[s.id]}" aria-label="Marcar ${esc(nomeTexto(s))} como vista">${ic("visto")}</button>
  </article>`;
}

/* ================= Ficha ================= */
const UF_GRADE = { RR: [1, 0], AP: [3, 0], AM: [1, 1], PA: [2, 1], MA: [3, 1], CE: [4, 1], RN: [5, 1], AC: [0, 2], RO: [1, 2], MT: [2, 2], TO: [3, 2], PI: [4, 2], PB: [5, 2], MS: [1, 3], GO: [2, 3], DF: [3, 3], BA: [4, 3], PE: [5, 3], PR: [1, 4], SP: [2, 4], MG: [3, 4], ES: [4, 4], AL: [5, 4], SC: [1, 5], RJ: [3, 5], SE: [5, 5], RS: [1, 6] };
function mapaUF(ufs) {
  return `<div class="ufs" role="img" aria-label="Ocorre em: ${esc(ufs.join(", ") || "sem registro de estados")}">${Object.entries(UF_GRADE).map(([uf, [x, y]]) =>
    `<span class="${ufs.includes(uf) ? "sim" : ""} ${uf === "ES" ? "es" : ""}" style="grid-column:${x + 1};grid-row:${y + 1}">${uf}</span>`).join("")}</div>`;
}

function desenharFicha(id, comAnim = true) {
  const s = POR_ID.get(id); if (!s) return false;
  const lista = filtradas(), base = lista.some(x => x.id === id) ? lista : SP;
  const i = base.findIndex(x => x.id === id), ant = base[i - 1], prox = base[i + 1];
  const amb = G.ambientes[s.amb];
  const marca = (rot, cat) => `<span class="marca ${GRAVES.includes(cat) ? `ameacada ${cat}` : ""}" title="${AMEACA[cat] || cat}"><b>${esc(cat)}</b>${rot}: ${esc(AMEACA[cat] || cat)}</span>`;
  const el = $("#ficha");
  el.innerHTML = `
  <div class="ficha-flutua">
    <button class="btn-redondo" type="button" data-fechar-ficha aria-label="Voltar para a lista">${ic("voltar")}</button>
    <span class="flutua-nome nome" aria-hidden="true">${nomeHTML(s)}</span>
    <button class="btn-redondo" type="button" data-marcar="${s.id}" aria-pressed="${!!vistos[s.id]}">${ic("visto")}<span class="rot">${vistos[s.id] ? "Vista" : "Marcar como vista"}</span></button>
  </div>
  <div class="ficha-layout">
    <div class="galeria">
      ${s.fotos.length ? `<div class="galeria-trilho" id="trilho">${s.fotos.map((f, k) =>
        `<button type="button" data-luz="${k}" ${fundoLq(f)} aria-label="Abrir foto ${k + 1} de ${s.fotos.length} em tela cheia" ${k === 0 ? `data-vt-ficha` : ""}><img src="${img(f, "l")}" alt="${esc(nomeTexto(s))}, foto ${k + 1}" ${k ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async"></button>`).join("")}</div>
        ${s.fotos.length > 1 ? `<div class="galeria-pontos" id="pontos">${s.fotos.map((_, k) => `<i class="${k ? "" : "atual"}"></i>`).join("")}</div>` : ""}
        <span class="galeria-ampliar">${ic("ampliar")}</span>`
      : `<div class="galeria-vazia sem-foto" data-vt-ficha><span>${esc(s.gen[0])}</span><small>O guia ainda não tem foto desta espécie</small></div>`}
    </div>
    <div class="ficha-texto">
      <p class="ficha-fam">${esc(s.fam)}</p>
      <h2 class="ficha-nome nome" id="ficha-titulo">${nomeHTML(s)}</h2>
      ${s.autor ? `<p class="ficha-autor">${esc(s.autor)}</p>` : ""}
      <p class="ficha-visto-em" data-id="${s.id}">${vistos[s.id] ? `Vista em ${dataBR(vistos[s.id])}` : ""}</p>
      <div class="ficha-marcas">
        ${s.es === "NE" && s.br === "NE"
          ? `<span class="marca"><b>NE</b>Não avaliada nas listas de ameaça do ES e do Brasil</span>`
          : `${marca("Espírito Santo", s.es)}${marca("Brasil", s.br)}`}
      </div>

      <div class="ficha-bloco">
        <h3>Como reconhecer</h3>
        ${s.desc ? `<p class="ficha-desc">${esc(s.desc)}</p>` : `<p class="ficha-desc ausente">O guia impresso não traz descrição para esta espécie.</p>`}
      </div>

      <div class="ficha-bloco">
        <dl class="ficha-dados">
          <div><dt>Forma de vida</dt><dd>${esc(s.habito)}</dd></div>
          <div><dt>Fitofisionomia</dt><dd>${esc(s.amb)}</dd></div>
          ${s.origem ? `<div class="largo"><dt>Origem e endemismo</dt><dd>${esc(s.origem)}</dd></div>` : ""}
          ${s.voucher ? `<div class="largo"><dt>Material testemunho</dt><dd>${esc(s.voucher)}</dd></div>` : ""}
        </dl>
      </div>

      ${s.dist || s.uf.length ? `<div class="ficha-bloco">
        <h3>Distribuição geográfica</h3>
        <div class="distribuicao">${mapaUF(s.uf)}<div>
          ${s.dist ? `<p>${esc(s.dist)}</p>` : ""}
          <p>${s.uf.length ? `Ocorre em ${s.uf.length === 1 ? "1 estado" : `${s.uf.length} estados`}: ${esc(s.uf.join(", "))}.` : "Estados de ocorrência não informados no guia."}</p>
        </div></div>
      </div>` : ""}

      ${s.amb && s.amb !== "Não informada" ? `<div class="ficha-bloco">
        <h3>Onde procurar</h3>
        <a class="ficha-ambiente" href="#/especies?amb=${encodeURIComponent(s.amb)}">
          <div class="mini" ${fundoLq(amb)}>${figura(amb, "s", "")}</div>
          <div><strong>${esc(s.amb)}</strong><span>Ver as ${SP.filter(x => x.amb === s.amb).length} espécies deste ambiente</span></div>
        </a>
      </div>` : ""}

      <nav class="ficha-nav" aria-label="Outras espécies">
        ${ant ? `<a href="#/especie/${ant.id}" data-trocar="${ant.id}"><small>Anterior</small><span class="nome">${nomeHTML(ant)}</span></a>` : ""}
        ${prox ? `<a class="prox" href="#/especie/${prox.id}" data-trocar="${prox.id}"><small>Próxima</small><span class="nome">${nomeHTML(prox)}</span></a>` : ""}
      </nav>
      <p class="ficha-pagina">Página ${s.id} do guia impresso.</p>
    </div>
  </div>`;
  el.classList.toggle("sem-anim", !comAnim);
  el.hidden = false;
  el.scrollTop = 0;
  document.documentElement.classList.add("travado");
  document.title = `${nomeTexto(s)} · Pedra do Cabrito`;
  const flutua = $(".ficha-flutua", el), gal = $(".galeria", el);
  el.onscroll = () => flutua.classList.toggle("rolado", el.scrollTop > gal.offsetHeight - 70);
  const trilho = $("#trilho");
  if (trilho) trilho.addEventListener("scroll", () => {
    const k = Math.round(trilho.scrollLeft / trilho.clientWidth);
    document.querySelectorAll("#pontos i").forEach((p, j) => p.classList.toggle("atual", j === k));
  }, { passive: true });
  return true;
}
function fecharFicha() {
  $("#ficha").hidden = true;
  $("#ficha").innerHTML = "";
  document.documentElement.classList.remove("travado");
  document.title = "Plantas da Pedra do Cabrito";
}

/* ================= Tela cheia com zoom ================= */
let luzFotos = [], luzLegenda = "";
function abrirLuz(fotos, k, legenda, ehMapa = false) {
  luzFotos = fotos; luzLegenda = legenda;
  const el = $("#luz");
  el.innerHTML = `
    <div class="luz-trilho" id="luz-trilho">${fotos.map((f, j) => `<div class="luz-slide ${ehMapa ? "mapa-fundo" : ""}"><img src="${img(f, "l")}" alt="${esc(legenda.replace(/<[^>]+>/g, ""))}, foto ${j + 1}" draggable="false"></div>`).join("")}</div>
    <div class="luz-topo"><button class="btn-redondo" type="button" data-fechar-luz aria-label="Fechar">${ic("fechar")}</button><span class="luz-conta" id="luz-conta"></span></div>
    <div class="luz-legenda">${legenda}</div>`;
  el.hidden = false;
  document.documentElement.classList.add("travado");
  const trilho = $("#luz-trilho");
  requestAnimationFrame(() => { trilho.scrollLeft = k * trilho.clientWidth; contarLuz(); });
  trilho.addEventListener("scroll", () => { contarLuz(); }, { passive: true });
  trilho.querySelectorAll(".luz-slide img").forEach(zoomavel);
  $("[data-fechar-luz]").focus({ preventScroll: true });
}
let luzAtual = 0;
function contarLuz() {
  const t = $("#luz-trilho"); if (!t) return;
  const k = Math.round(t.scrollLeft / t.clientWidth);
  if (k !== luzAtual) t.querySelectorAll("img").forEach(i => i._reset?.());
  luzAtual = k;
  $("#luz-conta").textContent = luzFotos.length > 1 ? `${k + 1} de ${luzFotos.length}` : "";
}
function fecharLuz() {
  const el = $("#luz"); el.hidden = true; el.innerHTML = "";
  if ($("#ficha").hidden) document.documentElement.classList.remove("travado");
}
function zoomavel(im) {
  const slide = im.parentElement;
  let s = 1, x = 0, y = 0, d0 = 0, s0 = 1, px = 0, py = 0, x0 = 0, y0 = 0, ultimo = 0;
  const pts = new Map();
  const aplicar = () => { im.style.transform = s > 1 ? `translate(${x}px,${y}px) scale(${s})` : ""; slide.classList.toggle("zoom", s > 1); };
  const limitar = () => {
    const mx = (im.clientWidth * (s - 1)) / 2, my = (im.clientHeight * (s - 1)) / 2;
    x = Math.max(-mx, Math.min(mx, x)); y = Math.max(-my, Math.min(my, y));
  };
  im._reset = () => { s = 1; x = y = 0; aplicar(); };
  slide.addEventListener("pointerdown", e => {
    pts.set(e.pointerId, e);
    if (pts.size === 2) { const [a, b] = [...pts.values()]; d0 = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); s0 = s; }
    else { px = e.clientX; py = e.clientY; x0 = x; y0 = y; }
    if (s > 1 || pts.size === 2) slide.setPointerCapture?.(e.pointerId);
  });
  slide.addEventListener("pointermove", e => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, e);
    if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      s = Math.max(1, Math.min(5, s0 * Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) / d0));
      limitar(); aplicar();
    } else if (s > 1) { x = x0 + e.clientX - px; y = y0 + e.clientY - py; limitar(); aplicar(); }
  });
  const soltar = e => {
    pts.delete(e.pointerId);
    if (pts.size === 1) { const [a] = [...pts.values()]; px = a.clientX; py = a.clientY; x0 = x; y0 = y; }
    if (s <= 1.02) { s = 1; x = y = 0; aplicar(); }
  };
  slide.addEventListener("pointerup", e => {
    const agora = Date.now();
    if (pts.size === 1 && agora - ultimo < 280) {
      if (s > 1) { s = 1; x = y = 0; }
      else { s = 2.5; const r = im.getBoundingClientRect(); x = (r.left + r.width / 2 - e.clientX) * 1.5; y = (r.top + r.height / 2 - e.clientY) * 1.5; limitar(); }
      aplicar(); ultimo = 0;
    } else ultimo = agora;
    soltar(e);
  });
  slide.addEventListener("pointercancel", soltar);
  slide.addEventListener("wheel", e => { if (!e.ctrlKey) return; e.preventDefault(); s = Math.max(1, Math.min(5, s * (e.deltaY < 0 ? 1.1 : .9))); limitar(); aplicar(); }, { passive: false });
}

/* ================= Rotas ================= */
let rotaAnterior = null, rolagemLista = 0, listaPronta = false, navegouDentro = false;
function analisar() {
  const h = location.hash.replace(/^#/, "");
  const m = h.match(/^\/especie\/(\d+)(?:\/foto\/(\d+))?/);
  if (m) return { vista: "ficha", id: Number(m[1]), foto: m[2] != null ? Number(m[2]) : null };
  if (h.startsWith("/especies")) return { vista: "lista" };
  return { vista: "inicio" };
}
function aplicarRota(origem = "nav") {
  const r = analisar(), antes = rotaAnterior;
  if (r.vista === "lista" && location.hash.includes("?")) {
    lerFiltroDaUrl();
    history.replaceState(null, "", "#/especies");  // o filtro vira estado; voltar não o reaplica
    if (listaPronta) desenharLista();
  }
  if (r.vista === "inicio") {
    if (antes && antes.vista === "lista") rolagemLista = scrollY;
    fecharLuz(); fecharFicha();
    document.body.dataset.vista = "inicio";
    if (antes && antes.vista !== "inicio") scrollTo(0, 0);
  } else {
    if (!listaPronta) { desenharLista(); listaPronta = true; }
    if (document.body.dataset.vista !== "lista") {
      document.body.dataset.vista = "lista";
      requestAnimationFrame(() => scrollTo(0, (antes && antes.vista === "inicio") ? rolagemLista : scrollY));
    }
    if (r.vista === "lista") { fecharLuz(); fecharFicha(); }
    else {
      const mesma = antes && antes.vista === "ficha" && antes.id === r.id && !$("#ficha").hidden;
      if (!mesma && !desenharFicha(r.id, origem !== "vt")) { history.replaceState(null, "", "#/especies"); return aplicarRota(); }
      if (r.foto != null) { const s = POR_ID.get(r.id); if (s.fotos.length) abrirLuz(s.fotos, Math.min(r.foto, s.fotos.length - 1), `<span class="nome">${nomeHTML(s)}</span>`); }
      else fecharLuz();
    }
  }
  rotaAnterior = r;
}
function ir(hash, { substituir = false, vt = null } = {}) {
  navegouDentro = true;
  const mudar = () => { substituir ? history.replaceState(null, "", hash) : history.pushState(null, "", hash); aplicarRota(vt ? "vt" : "nav"); };
  if (vt && document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    vt.style.viewTransitionName = "foto";
    const t = document.startViewTransition(() => { vt.style.viewTransitionName = ""; mudar(); const alvo = $("[data-vt-ficha]"); if (alvo) alvo.style.viewTransitionName = "foto"; });
    t.ready.catch(() => {}); t.finished.catch(() => {}).finally(() => { const alvo = $("[data-vt-ficha]"); if (alvo) alvo.style.viewTransitionName = ""; });
  } else mudar();
}
function voltar(padrao) {
  if (navegouDentro && history.state !== undefined && history.length > 1) history.back();
  else ir(padrao, { substituir: true });
}
window.addEventListener("popstate", () => {
  const antes = rotaAnterior, depois = analisar();
  const voltaDaFicha = antes?.vista === "ficha" && antes.foto == null && depois.vista === "lista";
  const ficha = $("[data-vt-ficha]");
  if (voltaDaFicha && ficha && document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    ficha.style.viewTransitionName = "foto";
    const t = document.startViewTransition(() => {
      ficha.style.viewTransitionName = "";
      aplicarRota();
      const tile = document.querySelector(`[data-vt="${antes.id}"]`);
      if (tile) { tile.style.viewTransitionName = "foto"; const r = tile.getBoundingClientRect(); if (r.top < 120 || r.bottom > innerHeight) tile.scrollIntoView({ block: "center" }); }
    });
    t.ready.catch(() => {}); t.finished.catch(() => {}).finally(() => { const tile = document.querySelector(`[data-vt="${antes.id}"]`); if (tile) tile.style.viewTransitionName = ""; });
  } else aplicarRota();
});

/* ================= Eventos ================= */
document.addEventListener("click", e => {
  const t = e.target.closest("a, button"); if (!t) return;
  if (t.matches("[data-marcar]")) { e.preventDefault(); alternarVisto(Number(t.dataset.marcar)); desenharChips(); return; }
  if (t.matches("[data-especie]")) { e.preventDefault(); ir(`#/especie/${t.dataset.especie}`, { vt: t.querySelector("[data-vt]") }); return; }
  if (t.matches("[data-trocar]")) { e.preventDefault(); ir(`#/especie/${t.dataset.trocar}`, { substituir: true }); $("#ficha").scrollTop = 0; return; }
  if (t.matches("[data-fechar-ficha]")) { e.preventDefault(); voltar("#/especies"); return; }
  if (t.matches("[data-luz]")) { const r = analisar(); ir(`#/especie/${r.id}/foto/${t.dataset.luz}`); return; }
  if (t.matches("[data-fechar-luz]")) { if (analisar().foto != null) voltar(`#/especie/${analisar().id}`); else fecharLuz(); return; }
  if (t.matches("[data-abrir-mapa]")) { abrirLuz([G.mapa], 0, "Localização da Pedra do Cabrito", true); return; }
  if (t.matches("[data-baixar]")) { baixarTudo(); return; }
  if (t.matches("[data-instalar]")) { instalar?.prompt(); instalar = null; desenharOffline(); return; }
  if (t.matches("[data-limpar-busca]")) { filtro.q = ""; const q = $("#q"); q.value = ""; t.hidden = true; q.focus(); desenharChips(); desenharGrade(); return; }
  if (t.matches("[data-limpar-tudo]")) { Object.assign(filtro, { q: "", amb: "", hab: "", flag: "" }); desenharLista(); return; }
  if (t.matches(".chip")) {
    const g = t.dataset.grupo, v = t.dataset.valor;
    filtro[g] = filtro[g] === v ? "" : v;
    desenharChips(); desenharGrade();
    if (scrollY > $("#grade").offsetTop) scrollTo({ top: 0 });
    return;
  }
  if (t.matches('a[href^="#/"]')) { e.preventDefault(); ir(t.getAttribute("href")); return; }
});
let tBusca;
document.addEventListener("input", e => {
  if (e.target.id !== "q") return;
  filtro.q = e.target.value;
  $("[data-limpar-busca]").hidden = !filtro.q;
  clearTimeout(tBusca); tBusca = setTimeout(() => { desenharChips(); desenharGrade(); }, 120);
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    if (!$("#luz").hidden) { $("[data-fechar-luz]")?.click(); return; }
    if (!$("#ficha").hidden) { voltar("#/especies"); return; }
  }
  if (!$("#luz").hidden && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
    const t = $("#luz-trilho"); t.scrollBy({ left: (e.key === "ArrowRight" ? 1 : -1) * t.clientWidth, behavior: "smooth" });
  } else if (!$("#ficha").hidden && $("#luz").hidden && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
    const alvo = $(e.key === "ArrowRight" ? ".ficha-nav .prox" : ".ficha-nav a:not(.prox)");
    alvo?.click();
  }
  if (e.key === "/" && document.body.dataset.vista === "lista" && document.activeElement?.id !== "q") { e.preventDefault(); $("#q").focus(); }
});

/* ================= Início ================= */
desenharInicio();
history.replaceState(null, "", location.hash || "#/");
aplicarRota("inicial");
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
})();
