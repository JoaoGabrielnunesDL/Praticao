// Pedaços de tela repetidos nas telas de dicas: cartão de artigo, imagem com plano B e mensagens de lista vazia.
// Depende de comum.js ($ e esc) e de artigos-dados.js.

// "de" diz de onde o leitor veio, para o botão Voltar do artigo (curiosidades ou dicas).
function linkArtigo(a, de = 'curiosidades', cat = '') {
  return `artigo.html?id=${a.id}&de=${de}` + (cat ? `&cat=${cat}` : '');
}

// Fotos das telas de dicas (curiosidades, lista e artigo). Cada artigo tem a sua; os que não estão aqui usam a foto cadastrada.
const D = 'img/dicas/curiosidades/';
const FOTOS_ARTIGO = {
  1: D + 'racao.webp', 2: D + 'proibidos.webp', 3: D + 'saudavel.webp',
  4: D + 'racao-b.webp', 5: D + 'saudavel-b.webp', 6: D + 'racao-c.webp',
  7: D + 'passeio-seguro.webp', 8: D + 'passeio-gatos.webp', 9: D + 'passeio-diario.webp',
  10: D + 'passeio-seguro-b.webp', 11: D + 'passeio-gatos-b.webp', 12: D + 'passeio-diario-b.webp',
};
const fotoArtigo = a => FOTOS_ARTIGO[a.id] || a.imagem || '';

// Foto grande da tela do artigo: cada uma foi recortada na proporção certa (rosto, orelhas e olhos sempre inteiros).
// Ração e legumes aparecem inteiros, por isso a moldura dessas telas tem outra proporção (3º valor "larga" = moldura mais larga).
const DA = 'img/dicas/artigo/';
const FOTOS_PAGINA = {
  1: ['artigo-1.webp', '1200 / 649', 'larga'], 4: ['artigo-4.webp', '1200 / 649', 'larga'], 6: ['artigo-6.webp', '1200 / 649', 'larga'],
  2: ['artigo-2.webp', '1 / 1'],
  3: ['artigo-3.webp', '4 / 3'], 5: ['artigo-5.webp', '4 / 3'],
  7: ['artigo-7.webp', '4 / 3'], 8: ['artigo-8.webp', '4 / 3'], 9: ['artigo-9.webp', '4 / 3'],
  10: ['artigo-10.webp', '4 / 3'], 11: ['artigo-11.webp', '4 / 3'], 12: ['artigo-12.webp', '4 / 3'],
};
function fotoPagina(a) {
  const f = FOTOS_PAGINA[a.id];
  return f ? { src: DA + f[0], proporcao: f[1], larga: f[2] === 'larga' } : null;
}

function imagemArtigo(a, srcPagina) {
  const icone = CATEGORIAS_DICAS[a.categoria].icone;
  const src = srcPagina || fotoArtigo(a);
  if (!src) return `<div class="img-ph dica-ph" role="img" aria-label="Imagem indisponível">${icone}</div>`;
  return `<img src="${esc(src)}" alt="Foto ilustrativa: ${esc(a.titulo)}" loading="lazy" decoding="async" data-icone="${icone}">`;
}

// Se a foto não carregar, troca por um ícone (imagem padrão).
function ativarImagemPadrao(raiz) {
  raiz.addEventListener('error', e => {
    const img = e.target;
    if (img.tagName !== 'IMG') return;
    const ph = document.createElement('div');
    ph.className = 'img-ph dica-ph';
    ph.setAttribute('role', 'img');
    ph.setAttribute('aria-label', 'Imagem indisponível');
    ph.textContent = img.dataset.icone || '🐾';
    img.replaceWith(ph);
  }, true);
}

function cartaoArtigo(a, de = 'curiosidades', cat = '') {
  const link = linkArtigo(a, de, cat);
  return `<article class="cu-card">
    <div class="cu-card-img">${imagemArtigo(a)}</div>
    <div class="cu-card-corpo">
      <h3><a href="${link}">${esc(a.titulo)}</a></h3>
      <p>${esc(a.resumo)}</p>
      <a class="cu-leia" href="${link}" aria-label="Leia mais: ${esc(a.titulo)}">Leia mais <span aria-hidden="true">→</span></a>
    </div>
  </article>`;
}

const vazioDicas = (icone, titulo, texto) => `<div class="vazio dica-vazio"><span>${icone}</span><strong>${esc(titulo)}</strong><p>${esc(texto)}</p></div>`;
