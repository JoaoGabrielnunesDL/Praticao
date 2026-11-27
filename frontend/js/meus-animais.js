// Meus Animais (tutor). Usa a API real (cada chamada já devolve só os dados do tutor logado):
//   GET /animais   |   POST /animais   |   PUT /animais/{id}   |   DELETE /animais/{id}   (corpo: nome, especie, raca)
//   GET /agendamentos   (para os indicadores e para saber o que impede a exclusão)
// Cadastrar e editar usam o mesmo formulário. Os indicadores são calculados na hora, a partir dos dados da API.
let animais = [];
let agendamentos = [];
let editandoId = null; // null = cadastrando
let ocupado = false;

const ICONE = { 'cão': '🐶', 'cao': '🐶', 'gato': '🐱' };
const iconeDe = a => ICONE[String(a.especie).toLowerCase()] || '🐾';

// Fotos ilustrativas (a API não guarda foto do animal): cão e gato têm arte própria; outras espécies ficam com o ícone.
const FOTO = { 'cão': 'img/animais/foto-cao.webp', 'cao': 'img/animais/foto-cao.webp', 'gato': 'img/animais/foto-gato.webp' };
const IC_EDITAR = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>';
const IC_EXCLUIR = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6"/></svg>';

function fotoHTML(a) {
  const src = FOTO[String(a.especie).toLowerCase()];
  return src
    ? `<div class="an-foto com-foto" aria-hidden="true"><img src="${src}" alt="" loading="lazy" decoding="async"><span class="an-ilustrativa">Imagem ilustrativa</span></div>`
    : `<div class="an-foto" aria-hidden="true">${iconeDe(a)}</div>`;
}

function cartaoHTML(a) {
  return `<article class="an-card">
    ${fotoHTML(a)}
    <div class="corpo">
      <h3>${esc(a.nome)}</h3>
      <span><span class="etiqueta"><span class="pc-ic pc-f-pata" aria-hidden="true"></span> ${esc(a.especie)}</span></span>
      <p class="raca">${a.raca ? esc(a.raca) : 'Raça indefinida'}</p>
      <a class="agendar" href="agendamento.html?animal=${a.id}"><span class="pc-ic pc-f-calendario" aria-hidden="true"></span> Agendar serviço</a>
      <div class="acoes">
        <button type="button" class="acao confirmar" data-acao="editar" data-id="${a.id}">${IC_EDITAR} Editar</button>
        <button type="button" class="acao cancelar" data-acao="excluir" data-id="${a.id}">${IC_EXCLUIR} Excluir</button>
      </div>
    </div>
  </article>`;
}

function render() {
  const n = animais.length;
  const especies = new Set(animais.map(a => a.especie.trim().toLowerCase())).size;
  const ativos = agendamentos.filter(g => g.status === 'AGENDADO' || g.status === 'CONFIRMADO').length;
  const concluidos = agendamentos.filter(g => g.status === 'CONCLUIDO').length;
  $('ind-animais').textContent = n;
  $('ind-especies').textContent = especies;
  $('ind-ativos').textContent = ativos;
  $('ind-concluidos').textContent = concluidos;
  $('sub-lista').textContent = n === 1 ? '1 animal cadastrado' : n + ' animais cadastrados';
  // Sem animal não há como agendar: os atalhos de agendamento levam ao cadastro.
  $('lista').innerHTML = n
    ? animais.map(cartaoHTML).join('')
    : '<div class="vazio"><span class="pc-ic pc-f-pata" aria-hidden="true"></span>Você ainda não cadastrou nenhum animal<p>Cadastre seu primeiro pet para poder agendar serviços.</p><button type="button" class="btn btn-laranja btn-pequeno" data-novo>+ Cadastrar Animal</button></div>';
}

async function carregar() {
  $('erro-tela').hidden = true;
  $('conteudo').hidden = false;
  try {
    [animais, agendamentos] = await Promise.all([api('/animais'), api('/agendamentos')]);
    render();
  } catch (x) {
    if (x.status === 401) return tratarErro(x);
    $('conteudo').hidden = true;
    $('erro-texto').textContent = x.message;
    $('erro-tela').hidden = false;
  }
}

// ---------- formulário (cadastrar / editar) ----------
function abrirFormulario(animal) {
  editandoId = animal ? animal.id : null;
  $('an-form-titulo').textContent = animal ? 'Editar Animal' : 'Cadastrar Animal';
  $('an-erro').hidden = true;
  $('a-nome').value = animal ? animal.nome : '';
  const sel = $('a-especie');
  // Se a espécie guardada não estiver na lista, ela é acrescentada para não se perder ao editar.
  if (animal && ![...sel.options].some(o => o.value === animal.especie)) sel.add(new Option(animal.especie, animal.especie));
  sel.value = animal ? animal.especie : '';
  $('a-raca').value = animal && animal.raca ? animal.raca : '';
  $('dlg-animal').showModal();
  $('a-nome').focus();
}

function mostrarErroForm(texto) { const e = $('an-erro'); e.textContent = texto; e.hidden = false; }

async function salvar(e) {
  e.preventDefault();
  if (ocupado) return;
  const nome = $('a-nome').value.trim().replace(/\s+/g, ' ');
  const especie = $('a-especie').value;
  const raca = $('a-raca').value.trim();
  if (!nome) return mostrarErroForm('Informe o nome do animal.');
  if (!especie) return mostrarErroForm('Selecione a espécie.');
  ocupado = true;
  $('an-salvar').disabled = true;
  try {
    const corpo = JSON.stringify({ nome, especie, raca: raca || null });
    const opcoes = { method: editandoId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: corpo };
    await api(editandoId ? '/animais/' + editandoId : '/animais', opcoes);
    $('dlg-animal').close();
    mostrarMensagem('sucesso', editandoId ? 'Animal atualizado com sucesso.' : 'Animal cadastrado com sucesso.');
    await carregar(); // a listagem e os indicadores são atualizados
  } catch (x) {
    if (x.status === 401) { $('dlg-animal').close(); tratarErro(x); } else mostrarErroForm(x.message);
  } finally {
    ocupado = false;
    $('an-salvar').disabled = false;
  }
}

async function excluir(a) {
  // Animal com agendamentos não pode ser excluído (a API também bloqueia, com erro 409).
  if (agendamentos.some(g => g.animal_id === a.id)) {
    return mostrarMensagem('erro', `${a.nome} possui agendamentos e não pode ser excluído.`);
  }
  const ok = await perguntar({
    titulo: 'Excluir animal?',
    texto: `Tem certeza de que deseja excluir o cadastro de ${a.nome}?`,
    rotulo: 'Confirmar exclusão',
  });
  if (!ok) return;
  try {
    await api('/animais/' + a.id, { method: 'DELETE' });
    mostrarMensagem('sucesso', 'Animal excluído.');
    await carregar();
  } catch (x) {
    tratarErro(x); // ex.: 409 "Animal possui agendamentos e não pode ser excluído"
  }
}

// ---------- janela de lista (indicadores clicáveis) ----------
function itemLista(a, comDetalhes) {
  const detalhe = comDetalhes ? `<small>${esc(a.especie)} · ${a.raca ? esc(a.raca) : 'Raça indefinida'}</small>` : '';
  return `<div class="lista-item"><span class="lista-foto" aria-hidden="true">${iconeDe(a)}</span><div><strong>${esc(a.nome)}</strong>${detalhe}</div></div>`;
}

function abrirLista(tipo) {
  if (!animais.length) return mostrarMensagem('erro', 'Você ainda não cadastrou nenhum animal.');
  if (tipo === 'animais') {
    $('lista-titulo').textContent = 'Animais cadastrados';
    $('lista-corpo').innerHTML = animais.map(a => itemLista(a, false)).join('');
  } else {
    // Agrupa por espécie: cada animal aparece com nome, espécie e raça.
    $('lista-titulo').textContent = 'Espécies diferentes';
    const grupos = new Map();
    animais.forEach(a => { const k = a.especie.trim(); grupos.set(k, [...(grupos.get(k) || []), a]); });
    $('lista-corpo').innerHTML = [...grupos].map(([esp, itens]) =>
      `<p class="lista-grupo">${esc(esp)} (${itens.length})</p>` + itens.map(a => itemLista(a, true)).join('')).join('');
  }
  $('dlg-lista').showModal();
}

function iniciar() {
  $('lista-fechar').addEventListener('click', () => $('dlg-lista').close());
  // Clicar fora da janelinha também fecha.
  $('dlg-lista').addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.close(); });
  document.addEventListener('click', e => {
    if (e.target.closest('[data-novo]')) return abrirFormulario(null);
    const ind = e.target.closest('[data-lista]');
    if (ind) return abrirLista(ind.dataset.lista);
    const b = e.target.closest('[data-acao]');
    if (!b) return;
    const a = animais.find(x => x.id === Number(b.dataset.id));
    if (!a) return;
    b.dataset.acao === 'editar' ? abrirFormulario(a) : excluir(a);
  });
  // "Agendar" sem nenhum animal cadastrado: o animal é obrigatório, então abre o cadastro.
  document.querySelectorAll('#atalho-agendar,[data-agendar]').forEach(l => l.addEventListener('click', e => {
    if (animais.length === 0) { e.preventDefault(); mostrarMensagem('erro', 'Cadastre pelo menos um animal para poder agendar.'); abrirFormulario(null); }
  }));
  $('form-animal').addEventListener('submit', salvar);
  $('an-cancelar').addEventListener('click', () => $('dlg-animal').close());
  $('tentar').addEventListener('click', carregar);
  carregar().then(() => { if (new URLSearchParams(location.search).get('novo') === '1' && !$('conteudo').hidden) abrirFormulario(null); });
}

if (Auth.exigirPerfil(['tutor'])) iniciar();
