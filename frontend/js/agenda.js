// Agenda do Dia (funcionário/administrador). Usa a API real:
//   GET   /agendamentos?data=AAAA-MM-DD                       (um dia)
//   GET   /agendamentos?inicio=AAAA-MM-DD&fim=AAAA-MM-DD      (botões "Últimos 7 dias" e "Último mês")
//   PATCH /agendamentos/{id}/status   corpo: {"status": "CONFIRMADO" | "CONCLUIDO" | "CANCELADO"}
const PERFIS = ['funcionario', 'administrador'];

// Ações permitidas em cada status (mesmas regras do back: Pendente→Confirmado→Concluído, ou Cancelado).
const ACOES = {
  AGENDADO: [['CONFIRMADO', 'Confirmar', 'confirmar'], ['CANCELADO', 'Cancelar', 'cancelar']],
  CONFIRMADO: [['CONCLUIDO', 'Concluir', 'concluir'], ['CANCELADO', 'Cancelar', 'cancelar']],
};
const SUCESSO = {
  CONFIRMADO: 'Agendamento confirmado com sucesso.',
  CONCLUIDO: 'Atendimento concluído com sucesso.',
  CANCELADO: 'Agendamento cancelado com sucesso.',
};

let agendamentos = [];
let filtro = 'TODOS';
let ocupado = false;
let periodo = null;   // null = um dia só (campo Data); {inicio, fim} = botão de período ativo

const dataIso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dataCurta = iso => iso.split('-').reverse().join('/');

// Últimos 7 dias = hoje e os 6 dias anteriores. Último mês = o mês anterior inteiro.
function calcularPeriodo(nome) {
  const h = new Date();
  if (nome === '7dias') return { inicio: dataIso(new Date(h.getFullYear(), h.getMonth(), h.getDate() - 6)), fim: dataIso(h) };
  return { inicio: dataIso(new Date(h.getFullYear(), h.getMonth() - 1, 1)), fim: dataIso(new Date(h.getFullYear(), h.getMonth(), 0)) };
}

function marcarAtalho(nome) {
  document.querySelectorAll('[data-atalho]').forEach(b => {
    b.classList.toggle('ativo', b.dataset.atalho === nome);
    b.setAttribute('aria-pressed', b.dataset.atalho === nome);
  });
  const info = $('info-periodo');
  info.hidden = !periodo;
  if (periodo) info.textContent = `Período: ${dataCurta(periodo.inicio)} a ${dataCurta(periodo.fim)}`;
}

// ---------- desenho da lista ----------
function botoes(ag) {
  return (ACOES[ag.status] || [])
    .map(([novo, texto, classe]) => `<button type="button" class="acao ${classe}" data-acao="${novo}" data-id="${ag.id}">${texto}</button>`)
    .join('');
}

function itemHTML(ag) {
  const s = STATUS[ag.status];
  return `<article class="item" data-id="${ag.id}">
    <strong class="c-hora">${periodo ? dataBR(ag).slice(0, 5) + '<br>' : ''}${hora(ag)}</strong>
    <span class="c-tutor">${esc(ag.tutor_nome)}</span>
    <span class="c-animal">${esc(ag.animal_nome)}</span>
    <span class="c-servico">${esc(ag.servico_nome)}</span>
    <span class="c-status"><span class="status ${s.classe}">${s.texto}</span>${Pagamento.chipStaffHTML(ag, true)}</span>
    <div class="acoes">${botoes(ag)}<button type="button" class="acao detalhes">Detalhes</button></div>
  </article>`;
}

function render() {
  document.querySelectorAll('.ind').forEach(b => {
    const f = b.dataset.filtro;
    b.querySelector('strong').textContent = f === 'TODOS' ? agendamentos.length : agendamentos.filter(a => a.status === f).length;
    b.classList.toggle('ativo', f === filtro);
    b.setAttribute('aria-pressed', f === filtro);
  });

  const visiveis = filtro === 'TODOS' ? agendamentos : agendamentos.filter(a => a.status === filtro);
  if (!agendamentos.length) {
    $('lista').innerHTML = `<div class="vazio"><span>📅</span>Nenhum agendamento ${periodo ? 'neste período' : 'para esta data'}.</div>`;
  } else if (!visiveis.length) {
    $('lista').innerHTML = '<div class="vazio"><span>🔎</span>Nenhum agendamento com este status.</div>';
  } else {
    $('lista').innerHTML = `<div class="cab-lista" aria-hidden="true"><span>${periodo ? 'Data / hora' : 'Horário'}</span><span>Tutor</span><span>Animal</span><span>Serviço</span><span>Status / pagamento</span><span>Ações</span></div>`
      + visiveis.map(itemHTML).join('');
  }
}

async function carregar() {
  $('lista').innerHTML = '<p class="carregando">Carregando agendamentos...</p>';
  try {
    agendamentos = await api(periodo
      ? `/agendamentos?inicio=${periodo.inicio}&fim=${periodo.fim}`
      : '/agendamentos?data=' + $('data').value);
    render();
  } catch (x) {
    agendamentos = [];
    $('lista').innerHTML = Estados.erro(x);
    tratarErro(x);
  }
}

// ---------- janelas ----------
function resumo(ag) {
  return `<dt>Tutor</dt><dd>${esc(ag.tutor_nome)}</dd><dt>Animal</dt><dd>${esc(ag.animal_nome)}</dd>
          <dt>Serviço</dt><dd>${esc(ag.servico_nome)}</dd><dt>Horário</dt><dd>${hora(ag)}</dd>`;
}

function confirmar(titulo, texto, ag, rotulo) {
  const dlg = $('dlg-confirmar');
  $('conf-titulo').textContent = titulo;
  $('conf-texto').textContent = texto;
  $('conf-dados').innerHTML = resumo(ag);
  $('conf-ok').textContent = rotulo;
  dlg.returnValue = '';
  dlg.showModal();
  return new Promise(resolver => dlg.addEventListener('close', () => resolver(dlg.returnValue === 'ok'), { once: true }));
}

function abrirDetalhes(id) {
  const ag = agendamentos.find(a => a.id === id);
  if (!ag) return;
  const s = STATUS[ag.status];
  $('det-conteudo').innerHTML = `<span class="status ${s.classe}">${s.texto}</span>
    <dl class="dados">${resumo(ag)}
      <dt>Data</dt><dd>${dataBR(ag)}</dd>
      <dt>Duração</dt><dd>${ag.servico_duracao_min} minutos</dd>
      <dt>Valor</dt><dd>${moeda(ag.servico_preco)}</dd>
      <dt>Pagamento</dt><dd>${esc(Pagamento.detalheEquipe(ag))}</dd>
      <dt>Observações</dt><dd>${ag.observacao ? esc(ag.observacao) : 'Nenhuma observação.'}</dd>
    </dl>`;
  $('det-acoes').innerHTML = botoes(ag);
  $('dlg-detalhes').showModal();
}

// ---------- ações (confirmar, concluir, cancelar) ----------
async function agir(id, novo) {
  if (ocupado) return;
  const ag = agendamentos.find(a => a.id === id);
  if (!ag) return;
  if (novo === 'CANCELADO' && !(await confirmar('Cancelar agendamento?', 'Tem certeza de que deseja cancelar este agendamento?', ag, 'Confirmar cancelamento'))) return;
  if (novo === 'CONCLUIDO' && !(await confirmar('Concluir atendimento?', 'Confirme que o serviço foi realizado.', ag, 'Concluir atendimento'))) return;

  ocupado = true;                       // evita cliques repetidos enquanto a API responde
  $('lista').classList.add('ocupada');
  try {
    const atualizado = await api(`/agendamentos/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: novo }),
    });
    agendamentos = agendamentos.map(a => (a.id === id ? atualizado : a));
    render();
    mostrarMensagem('sucesso', SUCESSO[novo]);
  } catch (x) {
    // 400 = o status já mudou (ex.: outro funcionário alterou). Recarrega a agenda.
    tratarErro(x, x.status === 400 ? ' A agenda foi atualizada.' : '');
    if (x.status === 400) await carregar();
  } finally {
    ocupado = false;
    $('lista').classList.remove('ocupada');
  }
}

// ---------- início ----------
function iniciar() {
  // O painel do administrador abre a agenda já filtrada: ?data=AAAA-MM-DD&status=AGENDADO
  const params = new URLSearchParams(location.search);
  const dataUrl = params.get('data');
  const statusUrl = params.get('status');
  $('data').value = /^\d{4}-\d{2}-\d{2}$/.test(dataUrl || '') ? dataUrl : hojeISO();
  if (STATUS[statusUrl]) filtro = statusUrl;

  if (Auth.perfil() === 'administrador') {
    $('selo-pagina').textContent = 'Administração';
    $('titulo-pagina').textContent = 'Agenda';
    $('sub-pagina').textContent = 'Consulte e gerencie os atendimentos de qualquer data.';
    document.title = 'Agenda - PratiCão';
  }

  // Filtrar e Hoje voltam para a visão de um dia só.
  $('filtro-data').addEventListener('submit', e => { e.preventDefault(); periodo = null; marcarAtalho(null); filtro = 'TODOS'; carregar(); });
  $('btn-hoje').addEventListener('click', () => { $('data').value = hojeISO(); periodo = null; marcarAtalho(null); filtro = 'TODOS'; carregar(); });
  document.querySelectorAll('[data-atalho]').forEach(b => b.addEventListener('click', () => {
    periodo = calcularPeriodo(b.dataset.atalho);
    marcarAtalho(b.dataset.atalho);
    filtro = 'TODOS';
    carregar();
  }));
  document.querySelectorAll('.ind').forEach(b => b.addEventListener('click', () => { filtro = b.dataset.filtro; render(); }));

  $('lista').addEventListener('click', e => {
    if (e.target.closest('[data-tentar]')) return carregar();
    const botao = e.target.closest('[data-acao]');
    if (botao) return agir(Number(botao.dataset.id), botao.dataset.acao);
    const item = e.target.closest('.item');
    if (item) abrirDetalhes(Number(item.dataset.id));
  });
  $('det-acoes').addEventListener('click', e => {
    const botao = e.target.closest('[data-acao]');
    if (!botao) return;
    $('dlg-detalhes').close();
    agir(Number(botao.dataset.id), botao.dataset.acao);
  });

  carregar();
}

if (Auth.exigirPerfil(PERFIS)) iniciar();
