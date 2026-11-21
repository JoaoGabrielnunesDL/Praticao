// Listagem de dicas, filtrada por categoria (?categoria=alimentacao ou passeios). Pública.
// Categoria que não existe volta para a listagem geral.
const params = new URLSearchParams(location.search);
let categoria = categoriaValida(params.get('categoria')) ? params.get('categoria') : 'todas';

function render() {
  const termo = $('busca').value.trim();
  $('limpar-busca').hidden = !termo;

  // abas
  const abas = [['todas', 'Todas']].concat(Object.entries(CATEGORIAS_DICAS).map(([k, c]) => [k, `${c.icone} ${c.nome}`]));
  $('abas').innerHTML = abas.map(([k, nome]) => `<button type="button" data-cat="${k}" class="${k === categoria ? 'ativa' : ''}" ${k === categoria ? 'aria-current="true"' : ''}>${nome}</button>`).join('');

  // título
  const nomeCat = categoria === 'todas' ? null : CATEGORIAS_DICAS[categoria].nome;
  $('titulo-lista').textContent = nomeCat ? `Mais dicas de ${nomeCat.toLowerCase()}` : 'Todas as dicas';
  $('sub-lista').textContent = nomeCat ? CATEGORIAS_DICAS[categoria].descricao : 'Leia as orientações sobre alimentação e passeios do seu pet.';
  document.title = (nomeCat ? `Dicas de ${nomeCat.toLowerCase()}` : 'Todas as dicas') + ' - PratiCão';

  // lista
  const base = artigosPublicados().filter(a => categoria === 'todas' || a.categoria === categoria);
  const achados = buscarArtigos(base, termo);
  $('contagem').textContent = base.length ? `Mostrando ${achados.length} de ${base.length} dica${base.length === 1 ? '' : 's'}.` : '';
  $('lista').innerHTML = !base.length
    ? vazioDicas('📝', 'Nenhuma dica disponível no momento', 'Estamos preparando novos conteúdos para ajudar você a cuidar ainda melhor do seu pet.')
    : !achados.length
      ? vazioDicas('🔎', 'Nenhuma dica encontrada', 'Tente buscar por outra palavra ou escolha outra categoria.')
      : `<div class="dica-grade">${achados.map(a => cartaoArtigo(a, 'dicas', categoria)).join('')}</div>`;
}

// Trocar de aba atualiza o endereço (sem recarregar), para o botão Voltar do artigo lembrar a categoria.
$('abas').addEventListener('click', e => {
  const b = e.target.closest('[data-cat]');
  if (!b) return;
  categoria = b.dataset.cat;
  history.replaceState(null, '', categoria === 'todas' ? 'dicas.html' : `dicas.html?categoria=${categoria}`);
  render();
});
$('form-busca').addEventListener('submit', e => e.preventDefault());
$('busca').addEventListener('input', render);
$('limpar-busca').addEventListener('click', () => { $('busca').value = ''; render(); $('busca').focus(); });
ativarImagemPadrao($('lista'));
render();
