// Catálogo de serviços (tutor). Usa a API real:
//   GET /servicos   -> lista só os serviços ativos (id, nome, descricao, preco, duracao_min, ativo)
// A busca e as categorias funcionam no próprio navegador (poucos serviços, sem recarregar a página).
// A API ainda não tem o campo "categoria"; por isso ela é deduzida pelo nome do serviço (veja CATEGORIAS).
// "Agendar este serviço" abre agendamento.html?servico=ID para a tela de agendamento receber o serviço já escolhido.

const CATEGORIAS = [
  { id: 'todos', nome: 'Todos os serviços', icone: '🐾' },
  { id: 'banho-e-tosa', nome: 'Banho e Tosa', icone: '🛁', palavras: ['banho', 'tosa'] },
  { id: 'saude', nome: 'Cuidados de Saúde', icone: '💉', palavras: ['consulta', 'vacin', 'veterin', 'exame', 'vermifug'] },
  { id: 'estetica', nome: 'Estética', icone: '✨', palavras: ['hidrat', 'unha', 'escov', 'perfum', 'laco', 'laço'] },
  { id: 'outros', nome: 'Outros Cuidados', icone: '⚙️' }, // tudo que não se encaixa nas anteriores
];
const ICONES = [['banho', '🛁'], ['tosa', '✂️'], ['hidrat', '🧴'], ['unha', '🐾'], ['consulta', '🩺'], ['vacin', '💉']];

let servicos = [];
let categoria = 'todos';
let termo = '';

// Tira acentos e maiúsculas para a pesquisa aceitar "hidratacao" ou "HIDRATAÇÃO".
const normalizar = t => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

function categoriaDe(s) {
  const nome = normalizar(s.nome);
  const achada = CATEGORIAS.find(c => c.palavras && c.palavras.some(p => nome.includes(normalizar(p))));
  return achada ? achada.id : 'outros';
}
const nomeCategoria = id => CATEGORIAS.find(c => c.id === id).nome;
function iconeDe(s) {
  const nome = normalizar(s.nome);
  const par = ICONES.find(([p]) => nome.includes(p));
  return par ? par[1] : CATEGORIAS.find(c => c.id === categoriaDe(s)).icone;
}

// Categorias sem nenhum serviço não aparecem (exceto "Todos").
const categoriasVisiveis = () => CATEGORIAS.filter(c => c.id === 'todos' || servicos.some(s => categoriaDe(s) === c.id));

function filtrados() {
  const t = normalizar(termo);
  return servicos.filter(s =>
    (categoria === 'todos' || categoriaDe(s) === categoria) &&
    (!t || normalizar(s.nome).includes(t) || normalizar(s.descricao).includes(t)));
}

// ---------- desenho da tela ----------
function renderCategorias() {
  const visiveis = categoriasVisiveis();
  if (!visiveis.some(c => c.id === categoria)) categoria = 'todos';
  // O menu lateral e o filtro superior mostram sempre a mesma categoria (estado único).
  $('cat-lista').innerHTML = visiveis.map(c =>
    `<button type="button" data-cat="${c.id}" aria-current="${c.id === categoria}"><span aria-hidden="true">${c.icone}</span>${esc(c.nome)}</button>`).join('');
  $('filtro').innerHTML = visiveis.map(c =>
    `<option value="${c.id}"${c.id === categoria ? ' selected' : ''}>${esc(c.nome)}</option>`).join('');
}

function cartaoHTML(s) {
  const nome = esc(s.nome);
  return `<button type="button" class="cat-card${s.ativo ? '' : ' indisponivel'}" data-id="${s.id}" aria-label="Ver detalhes de ${nome}">
    <div class="topo"><span class="cat-icone" aria-hidden="true">${iconeDe(s)}</span><h3>${nome}</h3></div>
    <p>${esc(s.descricao)}</p>
    <div class="base"><span>A partir de <strong>${moeda(s.preco)}</strong></span><span class="cat-seta" aria-hidden="true">→</span></div>
  </button>`;
}

function renderGrade() {
  $('limpar-busca').hidden = !termo;
  const lista = filtrados();
  if (lista.length) { $('grade').innerHTML = lista.map(cartaoHTML).join(''); return; }

  if (!servicos.length) {
    $('grade').innerHTML = '<div class="vazio"><span>✂️</span>Nenhum serviço disponível<p>No momento não temos serviços cadastrados. Volte mais tarde.</p></div>';
  } else if (termo) {
    $('grade').innerHTML = `<div class="vazio"><span>🔍</span>Nenhum serviço encontrado<p>Não encontramos serviços com esse nome. Tente outro termo ou veja todos os serviços.</p>
      <button type="button" class="btn btn-laranja btn-pequeno" data-limpar>Limpar pesquisa</button></div>`;
  } else {
    $('grade').innerHTML = `<div class="vazio"><span>🐾</span>Nenhum serviço nesta categoria<p>No momento não temos serviços disponíveis aqui.</p>
      <button type="button" class="btn btn-laranja btn-pequeno" data-cat="todos">Ver todos os serviços</button></div>`;
  }
}

function escolherCategoria(id) {
  categoria = id; // a pesquisa digitada é mantida
  renderCategorias();
  renderGrade();
  const url = new URL(location.href);
  id === 'todos' ? url.searchParams.delete('categoria') : url.searchParams.set('categoria', id);
  history.replaceState(null, '', url); // permite recarregar/compartilhar a categoria escolhida
}

function limparBusca() {
  termo = '';
  $('busca').value = '';
  renderGrade();
  $('busca').focus();
}

// ---------- detalhes ----------
function abrirDetalhes(id) {
  const s = servicos.find(x => x.id === Number(id));
  if (!s) return;
  $('det-icone').textContent = iconeDe(s);
  $('det-titulo').textContent = s.nome;
  $('det-categoria').textContent = nomeCategoria(categoriaDe(s));
  $('det-descricao').textContent = s.descricao;
  $('det-preco').textContent = 'A partir de ' + moeda(s.preco);
  $('det-duracao').textContent = s.duracao_min + ' minutos';
  const agendar = $('det-agendar');
  if (s.ativo) { // a lista pública só traz serviços ativos; a checagem protege contra mudanças futuras
    agendar.href = 'agendamento.html?servico=' + s.id;
    agendar.removeAttribute('aria-disabled');
    agendar.textContent = 'Agendar este serviço';
  } else {
    agendar.removeAttribute('href');
    agendar.setAttribute('aria-disabled', 'true');
    agendar.textContent = 'Serviço temporariamente indisponível';
  }
  $('dlg-detalhes').showModal();
}

// ---------- carregamento ----------
async function carregar() {
  $('grade').innerHTML = Array.from({ length: 6 }, () =>
    '<div class="cat-card" aria-hidden="true"><div class="esqueleto" style="width:60%"></div><div class="esqueleto"></div><div class="esqueleto" style="width:40%"></div></div>').join('');
  try {
    servicos = await api('/servicos');
    $('mensagem').hidden = true;
    const inicial = new URLSearchParams(location.search).get('categoria');
    if (CATEGORIAS.some(c => c.id === inicial)) categoria = inicial;
    renderCategorias();
    renderGrade();
  } catch (x) {
    $('grade').innerHTML = `<div class="vazio"><span>⚠️</span>Não foi possível carregar os serviços<p>${esc(x.message)}</p>
      <button type="button" class="btn btn-laranja btn-pequeno" data-tentar>Tentar novamente</button></div>`;
    if (x.status === 401) tratarErro(x);
  }
}

function iniciar() {
  $('cat-lista').addEventListener('click', e => { const b = e.target.closest('[data-cat]'); if (b) escolherCategoria(b.dataset.cat); });
  $('filtro').addEventListener('change', e => escolherCategoria(e.target.value));
  $('busca').addEventListener('input', e => { termo = e.target.value; renderGrade(); });
  $('limpar-busca').addEventListener('click', limparBusca);
  $('grade').addEventListener('click', e => {
    if (e.target.closest('[data-limpar]')) return limparBusca();
    if (e.target.closest('[data-tentar]')) return carregar();
    const cat = e.target.closest('[data-cat]');
    if (cat) return escolherCategoria(cat.dataset.cat);
    const card = e.target.closest('.cat-card[data-id]');
    if (card) abrirDetalhes(card.dataset.id);
  });
  $('det-fechar').addEventListener('click', () => $('dlg-detalhes').close());
  $('det-agendar').addEventListener('click', e => { if (!e.currentTarget.getAttribute('href')) e.preventDefault(); });
  carregar();
}

if (Auth.exigirPerfil(['tutor'])) iniciar();
