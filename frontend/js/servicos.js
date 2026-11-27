// Catálogo de serviços (tutor). Usa a API real:
//   GET /servicos   -> lista só os serviços ativos (id, nome, descricao, preco, duracao_min, ativo)
// A busca e as categorias funcionam no próprio navegador (poucos serviços, sem recarregar a página).
// A API ainda não tem o campo "categoria"; por isso ela é deduzida pelo nome do serviço (veja CATEGORIAS).
// "Agendar este serviço" abre agendamento.html?servico=ID para a tela de agendamento receber o serviço já escolhido.

// Ícones de linha das categorias (SVG inline, herdam a cor do texto).
const ICO = {
  todos: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>',
  banho: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="6" r="2.6"/><circle cx="6" cy="18" r="2.6"/><path d="M8 7.6L20 18M8 16.4L20 6"/></svg>',
  saude: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3v6a4 4 0 008 0V3"/><path d="M10 13v2a5 5 0 0010 0v-1"/><circle cx="20" cy="12" r="2"/></svg>',
  estetica: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 3l1.8 5.2L17 10l-5.2 1.8L10 17l-1.8-5.2L3 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg>',
  outros: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="11" r="2"/><circle cx="10" cy="6.5" r="2"/><circle cx="15" cy="6.5" r="2"/><circle cx="19" cy="11" r="2"/><path d="M12.5 12c3 0 5.500 3 5.500 5.500 0 2-1.800 2.200-3.300 1.600-1.300-.5-2.700-.5-4 0C9.200 19.700 7.500 19.500 7.500 17.500 7.500 15 9.500 12 12.500 12z"/></svg>'
};

const CATEGORIAS = [
  { id: 'todos', nome: 'Todos os serviços', icone: ICO.todos },
  { id: 'banho-e-tosa', nome: 'Banho e Tosa', icone: ICO.banho, palavras: ['banho', 'tosa'] },
  { id: 'saude', nome: 'Cuidados de Saúde', icone: ICO.saude, palavras: ['consulta', 'vacin', 'veterin', 'exame', 'vermifug'] },
  { id: 'estetica', nome: 'Estética', icone: ICO.estetica, palavras: ['hidrat', 'unha', 'escov', 'perfum', 'laco', 'laço'] },
  { id: 'outros', nome: 'Outros Cuidados', icone: ICO.outros }, // tudo que não se encaixa nas anteriores
];
// Ícones coloridos dos serviços: [palavra do nome, tom do fundo, desenho]. Se nenhum combinar, usa a patinha.
const ICONES_SVG = {
  banho: ['azul', '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M8 32h48v4a14 14 0 01-14 14H22A14 14 0 018 36z" fill="#2a7af5"/><circle cx="22" cy="27" r="8" fill="#fff" stroke="#bcd8ff" stroke-width="2"/><circle cx="34" cy="22" r="9.500" fill="#fff" stroke="#bcd8ff" stroke-width="2"/><circle cx="45" cy="27.500" r="7" fill="#fff" stroke="#bcd8ff" stroke-width="2"/><circle cx="42" cy="11" r="3.500" fill="none" stroke="#2a7af5" stroke-width="2"/><path d="M18 50l-3 6M46 50l3 6" stroke="#0a49b8" stroke-width="4" stroke-linecap="round"/><use href="#pata" x="25" y="35" width="16" height="14" style="fill:#fff"/></svg>'],
  tosa: ['roxo', '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M24 38L50 10M34 40L12 12" stroke="#8b6fe0" stroke-width="5" stroke-linecap="round"/><circle cx="18" cy="48" r="7" fill="none" stroke="#5b3fd0" stroke-width="5"/><circle cx="38" cy="52" r="7" fill="none" stroke="#5b3fd0" stroke-width="5"/></svg>'],
  hidrat: ['laranja', '<svg viewBox="0 0 64 64" aria-hidden="true"><g transform="rotate(-35 32 36)"><rect x="8" y="30" width="48" height="13" rx="5" fill="#ffb23a"/><g stroke="#f28a0c" stroke-width="3.500" stroke-linecap="round"><path d="M14 30v-10M22 30v-10M30 30v-10M38 30v-10M46 30v-10"/></g></g><path d="M48 6l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#ffb23a"/><path d="M56 22l1 2.500 2.500 1-2.500 1-1 2.500-1-2.500-2.500-1 2.500-1z" fill="#ffb23a"/></svg>'],
  unha: ['rosa', '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M18 8c8 12 14 24 18 44" stroke="#e5484d" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M42 8c-6 10-14 24-12 44" stroke="#ff7a7f" stroke-width="7" stroke-linecap="round" fill="none"/><use href="#pata" x="34" y="38" width="24" height="22" style="fill:#ff6b86"/></svg>'],
  consulta: ['rosa', '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M30 56C8 40 4 26 12 17c6-6 15-3 18 3 3-6 12-9 18-3 8 9 4 23-18 39z" fill="#ef4d5e"/><path d="M26 22h6v7h7v6h-7v7h-6v-7h-7v-6h7z" fill="#fff"/><use href="#pata" x="40" y="42" width="20" height="18" style="fill:#ff7a8a"/></svg>'],
  vacin: ['azul', '<svg viewBox="0 0 64 64" aria-hidden="true"><g transform="rotate(45 32 32)"><rect x="22" y="14" width="20" height="34" rx="4" fill="#dbeaff" stroke="#2a7af5" stroke-width="4"/><rect x="22" y="26" width="20" height="14" fill="#2a7af5"/><rect x="27" y="4" width="10" height="6" rx="2" fill="#2a7af5"/><path d="M32 48v12" stroke="#2a7af5" stroke-width="4" stroke-linecap="round"/></g><use href="#pata" x="38" y="40" width="22" height="20" style="fill:#2a7af5"/></svg>'],
  padrao: ['azul', '<svg viewBox="0 0 64 64" aria-hidden="true"><use href="#pata" x="6" y="6" width="52" height="47" style="fill:#2a7af5"/></svg>']
};
const ORDEM_ICONES = ['banho', 'tosa', 'hidrat', 'unha', 'consulta', 'vacin'];

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
// Devolve { tom, svg } do serviço (o tom colore o fundo do ícone).
function iconeDe(s) {
  const nome = normalizar(s.nome);
  const chave = ORDEM_ICONES.find(p => nome.includes(p)) || 'padrao';
  const [tom, svg] = ICONES_SVG[chave];
  return { tom, svg };
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
    `<button type="button" data-cat="${c.id}" aria-current="${c.id === categoria}"><span class="cat-ico" aria-hidden="true">${c.icone}</span>${esc(c.nome)}</button>`).join('');
  $('filtro').innerHTML = visiveis.map(c =>
    `<option value="${c.id}"${c.id === categoria ? ' selected' : ''}>${esc(c.nome)}</option>`).join('');
}

function cartaoHTML(s) {
  const nome = esc(s.nome);
  const ic = iconeDe(s);
  return `<button type="button" class="cat-card${s.ativo ? '' : ' indisponivel'}" data-id="${s.id}" aria-label="Ver detalhes de ${nome}">
    <div class="topo"><span class="cat-icone tom-${ic.tom}" aria-hidden="true">${ic.svg}</span><h3>${nome}</h3></div>
    <p>${esc(s.descricao)}</p>
    <div class="base"><span>A partir de <strong>${moeda(s.preco)}</strong></span><span class="cat-seta" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.600" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></div>
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
  const ic = iconeDe(s);
  $('det-icone').className = 'det-icone tom-' + ic.tom;
  $('det-icone').innerHTML = ic.svg;
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
