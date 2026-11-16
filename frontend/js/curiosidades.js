// Dicas e Curiosidades (pública, não precisa de login).
// Mostra as categorias com os artigos em destaque. Com algo digitado na busca, mostra os resultados.
const conteudo = $('conteudo');

function secaoCategoria(chave) {
  const cat = CATEGORIAS_DICAS[chave];
  const destaques = artigosPublicados().filter(a => a.categoria === chave && a.destaque);
  const cartoes = destaques.length
    ? destaques.map(a => cartaoArtigo(a, 'curiosidades')).join('')
    : vazioDicas('📝', 'Nenhuma dica disponível no momento', 'Estamos preparando novos conteúdos para ajudar você a cuidar ainda melhor do seu pet.');
  return `<section class="cur-secao" aria-labelledby="t-${chave}">
    <div class="cur-secao-info">
      <span class="cur-icone" aria-hidden="true">${cat.icone}</span>
      <div><h2 id="t-${chave}">${cat.nome}</h2><p>${esc(cat.descricao)}</p></div>
      <a class="btn btn-contorno btn-pequeno cur-mais" href="dicas.html?categoria=${chave}">Ver mais dicas de ${cat.nome.toLowerCase()} →</a>
    </div>
    <div class="dica-grade">${cartoes}</div>
  </section>`;
}

function render() {
  const termo = $('busca').value.trim();
  $('limpar-busca').hidden = !termo;
  if (!termo) {
    conteudo.innerHTML = Object.keys(CATEGORIAS_DICAS).map(secaoCategoria).join('');
    return;
  }
  const achados = buscarArtigos(artigosPublicados(), termo);
  conteudo.innerHTML = `<h2 class="cur-resultado">${achados.length} resultado${achados.length === 1 ? '' : 's'} para “${esc(termo)}”</h2>`
    + (achados.length
      ? `<div class="dica-grade">${achados.map(a => cartaoArtigo(a, 'curiosidades')).join('')}</div>`
      : vazioDicas('🔎', 'Nenhuma dica encontrada', 'Tente buscar por outra palavra, como "ração", "água" ou "passeio".'));
}

$('form-busca').addEventListener('submit', e => e.preventDefault());
$('busca').addEventListener('input', render);
$('limpar-busca').addEventListener('click', () => { $('busca').value = ''; render(); $('busca').focus(); });
ativarImagemPadrao(conteudo);
render();
