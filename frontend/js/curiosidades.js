// Dicas e Curiosidades (pública, não precisa de login).
// Mostra as categorias com os artigos em destaque. Com algo digitado na busca, mostra os resultados.
const conteudo = $('conteudo');

// Ícones brancos dos círculos azuis (um por categoria).
const ICONES_CUR = {
  alimentacao: '<span class="pc-ic pc-f-pote"></span>',
  passeios: '<svg viewBox="0 0 64 64" fill="currentColor" aria-hidden="true"><path d="M13 29C7 25 6 19 9 12" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><rect x="12" y="24" width="33" height="17" rx="8.5"/><rect x="13" y="35" width="6" height="19" rx="3"/><rect x="21" y="36" width="6" height="18" rx="3"/><rect x="32" y="36" width="6" height="18" rx="3"/><rect x="40" y="35" width="6" height="19" rx="3"/><circle cx="46" cy="20" r="9"/><rect x="48" y="19" width="13" height="9.5" rx="4.7"/><ellipse cx="41" cy="18" rx="3.6" ry="7.5" transform="rotate(18 41 18)" stroke="#1458d1" stroke-width="1.8"/><circle cx="50" cy="17.5" r="1.5" fill="#1458d1"/><circle cx="59" cy="21.5" r="1.8" fill="#1458d1"/></svg>',
};

function secaoCategoria(chave) {
  const cat = CATEGORIAS_DICAS[chave];
  const destaques = artigosPublicados().filter(a => a.categoria === chave && a.destaque);
  const cartoes = destaques.length
    ? destaques.map(a => cartaoArtigo(a, 'curiosidades')).join('')
    : vazioDicas('📝', 'Nenhuma dica disponível no momento', 'Estamos preparando novos conteúdos para ajudar você a cuidar ainda melhor do seu pet.');
  return `<section class="cu-secao" aria-labelledby="t-${chave}">
    <a class="cu-mais" href="dicas.html?categoria=${chave}">Ver mais dicas de ${cat.nome.toLowerCase()} <span aria-hidden="true">→</span></a>
    <div class="cu-info">
      <span class="cu-icone" aria-hidden="true">${ICONES_CUR[chave] || cat.icone}</span>
      <div><h2 id="t-${chave}">${cat.nome}</h2><p>${esc(cat.descricao)}</p></div>
    </div>
    <div class="cu-cards">${cartoes}</div>
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
  conteudo.innerHTML = `<section class="cu-secao cu-resultados"><h2 class="cu-resultado">${achados.length} resultado${achados.length === 1 ? '' : 's'} para “${esc(termo)}”</h2>`
    + (achados.length
      ? `<div class="cu-cards">${achados.map(a => cartaoArtigo(a, 'curiosidades')).join('')}</div>`
      : vazioDicas('🔎', 'Nenhuma dica encontrada', 'Tente buscar por outra palavra, como "ração", "água" ou "passeio".'))
    + '</section>';
}

$('form-busca').addEventListener('submit', e => e.preventDefault());
$('busca').addEventListener('input', render);
$('limpar-busca').addEventListener('click', () => { $('busca').value = ''; render(); $('busca').focus(); });
ativarImagemPadrao(conteudo);
render();
