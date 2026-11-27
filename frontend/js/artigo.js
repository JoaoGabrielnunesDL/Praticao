// Detalhe de um artigo (?id=1). Uma única tela serve para todos os artigos. Pública.
// O botão Voltar respeita de onde o leitor veio: ?de=dicas&cat=passeios volta para a lista daquela categoria.
const raiz = $('artigo');
const params = new URLSearchParams(location.search);
const artigo = /^\d+$/.test(params.get('id') || '') ? artigoPorId(params.get('id')) : null;

function destinoVoltar() {
  if (params.get('de') === 'dicas') {
    const cat = params.get('cat');
    return categoriaValida(cat) ? [`dicas.html?categoria=${cat}`, '← Voltar para a lista de dicas'] : ['dicas.html', '← Voltar para a lista de dicas'];
  }
  return ['curiosidades.html', '← Voltar para dicas'];
}

function mostrarNaoEncontrado() {
  document.title = 'Conteúdo não encontrado - PratiCão';
  raiz.innerHTML = `<section class="cu-secao ar-vazio">${vazioDicas('🔍', 'Conteúdo não encontrado', 'Este artigo não existe ou não está disponível.')}
    <p class="dica-centro"><a class="cu-leia" href="curiosidades.html">Ver todas as dicas</a></p></section>`;
}

// Bloco de texto de destaque (js/artigos-textos.js). Artigo sem texto cadastrado não mostra o bloco.
function blocoDestaque(a) {
  const t = typeof TEXTOS_ARTIGOS !== 'undefined' ? TEXTOS_ARTIGOS[a.id] : null;
  if (!t) return '';
  return `<section class="ar-destaque" aria-labelledby="t-destaque">
        <div class="ar-destaque-corpo">
          <span class="ar-etiqueta"><span aria-hidden="true">🐾</span> Para você pensar</span>
          <h2 id="t-destaque">${esc(t.titulo)}</h2>
          ${t.paragrafos.map(p => `<p>${esc(p)}</p>`).join('')}
          ${t.fecho ? `<p class="ar-fecho"><span class="ar-fecho-pata" aria-hidden="true"></span><span>${esc(t.fecho)}</span></p>` : ''}
        </div>
      </section>`;
}

function mostrarArtigo(a) {
  const cat = CATEGORIAS_DICAS[a.categoria];
  const [hrefVoltar, textoVoltar] = destinoVoltar();
  const de = params.get('de') === 'dicas' ? 'dicas' : 'curiosidades';
  const fp = fotoPagina(a);
  const relacionados = artigosPublicados().filter(r => r.categoria === a.categoria && r.id !== a.id).slice(0, 3);
  document.title = `${a.titulo} - PratiCão`;
  const voltarTopo = $('voltar-topo');
  voltarTopo.href = hrefVoltar;
  voltarTopo.innerHTML = `<span aria-hidden="true">←</span> ${textoVoltar.replace('← ', '')}`;
  $('sub-topo').textContent = cat.descricao;

  raiz.innerHTML = `
    <article>
      <header class="cu-secao ar-topo${fp && fp.larga ? ' ar-topo--larga' : ''}">
        <div class="ar-texto">
          <p class="artigo-meta"><span class="ar-etiqueta">${cat.icone} ${cat.nome}</span> <time datetime="${a.data_publicacao}">Publicado em ${dataLonga(a.data_publicacao)}</time></p>
          <h1>${esc(a.titulo)}</h1>
          <p class="artigo-intro">${esc(a.introducao)}</p>
        </div>
        <div class="ar-foto"><div class="artigo-img"${fp ? ` style="aspect-ratio:${fp.proporcao}"` : ''}>${imagemArtigo(a, fp ? fp.src : undefined)}</div></div>
      </header>
      <div class="ar-topicos">
        ${a.topicos.map((t, n) => `<section class="ar-topico"><span class="ar-num" aria-hidden="true">${n + 1}</span><h2>${esc(t.titulo)}</h2><ul>${t.itens.map(i => `<li>${esc(i)}</li>`).join('')}</ul></section>`).join('')}
      </div>
      ${blocoDestaque(a)}
      <aside class="ar-importante" role="note"><span class="pc-ic pc-f-alerta ar-alerta" aria-hidden="true"></span><div><strong>Importante</strong><p>${esc(a.importante)}</p><p class="peq">${esc(AVISO_VETERINARIO)}</p></div></aside>
    </article>
    ${relacionados.length ? `<section class="cu-secao ar-rel" aria-labelledby="t-rel"><h2 id="t-rel">Leia também</h2><div class="cu-cards dc-grade">${relacionados.map(r => cartaoArtigo(r, de, params.get('cat') || '')).join('')}</div></section>` : ''}
    <p class="ar-rodape">
      <a class="ar-voltar-btn" href="${hrefVoltar}">${textoVoltar}</a>
      <a class="cu-leia" href="dicas.html?categoria=${a.categoria}">Ver mais dicas de ${cat.nome.toLowerCase()} <span aria-hidden="true">→</span></a>
    </p>`;
}

ativarImagemPadrao(raiz);
if (artigo) mostrarArtigo(artigo); else mostrarNaoEncontrado();
