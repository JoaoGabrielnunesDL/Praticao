// Pedaços de tela repetidos nas telas de dicas: cartão de artigo, imagem com plano B e mensagens de lista vazia.
// Depende de comum.js ($ e esc) e de artigos-dados.js.

// "de" diz de onde o leitor veio, para o botão Voltar do artigo (curiosidades ou dicas).
function linkArtigo(a, de = 'curiosidades', cat = '') {
  return `artigo.html?id=${a.id}&de=${de}` + (cat ? `&cat=${cat}` : '');
}

function imagemArtigo(a, tamanho = 'peq') {
  const icone = CATEGORIAS_DICAS[a.categoria].icone;
  const placeholder = `<div class="img-ph dica-ph" role="img" aria-label="Imagem indisponível">${icone}</div>`;
  if (!a.imagem) return placeholder;
  return `<img src="${esc(a.imagem)}" alt="Foto ilustrativa: ${esc(a.titulo)}" loading="lazy" data-icone="${icone}">`;
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
  return `<article class="dica-card">
    <div class="dica-img">${imagemArtigo(a)}</div>
    <div class="dica-corpo">
      <h3><a href="${linkArtigo(a, de, cat)}">${esc(a.titulo)}</a></h3>
      <p>${esc(a.resumo)}</p>
      <a class="btn btn-laranja btn-pequeno" href="${linkArtigo(a, de, cat)}" aria-label="Leia mais: ${esc(a.titulo)}">Leia mais →</a>
    </div>
  </article>`;
}

const vazioDicas = (icone, titulo, texto) => `<div class="vazio dica-vazio"><span>${icone}</span><strong>${esc(titulo)}</strong><p>${esc(texto)}</p></div>`;
