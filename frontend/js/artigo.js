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
  raiz.innerHTML = vazioDicas('🔍', 'Conteúdo não encontrado', 'Este artigo não existe ou não está disponível.')
    + '<p class="dica-centro"><a class="btn btn-laranja" href="curiosidades.html">Ver todas as dicas</a></p>';
}

function mostrarArtigo(a) {
  const cat = CATEGORIAS_DICAS[a.categoria];
  const [hrefVoltar, textoVoltar] = destinoVoltar();
  const relacionados = artigosPublicados().filter(r => r.categoria === a.categoria && r.id !== a.id).slice(0, 3);
  document.title = `${a.titulo} - PratiCão`;

  raiz.innerHTML = `
    <a class="dica-voltar" href="${hrefVoltar}">${textoVoltar}</a>
    <article>
      <header class="artigo-cab bloco">
        <div class="artigo-img">${imagemArtigo(a)}</div>
        <div>
          <p class="artigo-meta"><span class="etiqueta">${cat.icone} ${cat.nome}</span> <time datetime="${a.data_publicacao}">Publicado em ${dataLonga(a.data_publicacao)}</time></p>
          <h1>${esc(a.titulo)}</h1>
          <p class="artigo-intro">${esc(a.introducao)}</p>
        </div>
      </header>
      ${a.topicos.map(t => `<section class="bloco artigo-topico"><h2>${esc(t.titulo)}</h2><ul>${t.itens.map(i => `<li>${esc(i)}</li>`).join('')}</ul></section>`).join('')}
      <aside class="artigo-importante" role="note"><strong>⚠️ Importante</strong><p>${esc(a.importante)}</p><p class="peq">${esc(AVISO_VETERINARIO)}</p></aside>
    </article>
    ${relacionados.length ? `<section aria-labelledby="t-rel"><h2 id="t-rel" class="cur-resultado">Leia também</h2><div class="dica-grade">${relacionados.map(r => cartaoArtigo(r, params.get('de') === 'dicas' ? 'dicas' : 'curiosidades', params.get('cat') || '')).join('')}</div></section>` : ''}
    <p class="artigo-rodape">
      <a class="btn btn-contorno" href="${hrefVoltar}">${textoVoltar}</a>
      <a class="btn btn-laranja" href="dicas.html?categoria=${a.categoria}">Ver mais dicas de ${cat.nome.toLowerCase()}</a>
    </p>`;
}

ativarImagemPadrao(raiz);
if (artigo) mostrarArtigo(artigo); else mostrarNaoEncontrado();
