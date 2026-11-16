// Painel do Administrador (Visão geral). Usa a API real:
//   GET /admin/usuarios            -> indicadores de usuários
//   GET /agendamentos?data=HOJE    -> indicadores, gráfico e prévia da agenda
// Os números são calculados a partir dos dados do banco (nada fixo na tela).
const LIMITE_PREVIA = 5;
const ORDEM = ['AGENDADO', 'CONFIRMADO', 'CONCLUIDO', 'CANCELADO'];
let agendamentosHoje = [];
let carregando = false;

const urlAgenda = status => `painel-funcionario.html?data=${hojeISO()}` + (status && status !== 'TODOS' ? `&status=${status}` : '');
const pct = (n, total) => (total ? (n / total) * 100 : 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';

function erroBloco(id, texto) {
  const caixa = $(id);
  caixa.textContent = texto || '';
  caixa.hidden = !texto;
}

// ---------- usuários ----------
function desenharUsuarios(lista) {
  const conta = f => lista.filter(f).length;
  $('u-total').textContent = lista.length;
  $('u-tutor').textContent = conta(u => u.perfil === 'tutor');
  $('u-funcionario').textContent = conta(u => u.perfil === 'funcionario');
  $('u-administrador').textContent = conta(u => u.perfil === 'administrador');
  $('u-inativas').textContent = conta(u => !u.ativo);
}

async function carregarUsuarios() {
  try {
    desenharUsuarios(await api('/admin/usuarios'));
    erroBloco('erro-usuarios', '');
  } catch (x) {
    erroBloco('erro-usuarios', 'Não foi possível carregar os usuários. ' + (x.status === 401 ? '' : 'Tente novamente.'));
    if (x.status === 401) tratarErro(x);
  }
}

// ---------- agendamentos, gráfico e prévia ----------
function desenharAgendamentos() {
  const total = agendamentosHoje.length;
  const contagem = Object.fromEntries(ORDEM.map(s => [s, agendamentosHoje.filter(a => a.status === s).length]));

  $('a-total').textContent = total;
  $('g-total').textContent = total;
  ORDEM.forEach(s => { $('a-' + s).textContent = contagem[s]; });

  // Rosca: cada status ocupa uma fatia proporcional (mesma fonte de dados dos cartões).
  let acumulado = 0;
  const fatias = ORDEM.filter(s => contagem[s]).map(s => {
    const ini = acumulado;
    acumulado += (contagem[s] / total) * 100;
    return `${STATUS[s].cor} ${ini}% ${acumulado}%`;
  });
  $('rosca').style.background = total ? `conic-gradient(${fatias.join(',')})` : '#e3eaf6';

  $('legenda').innerHTML = ORDEM.map(s => `<li><a href="${urlAgenda(s)}"><i style="background:${STATUS[s].cor}"></i>${STATUS[s].plural}<span class="pct">${pct(contagem[s], total)}</span></a></li>`).join('');

  // Prévia: os primeiros atendimentos do dia (a API já devolve em ordem de horário).
  const previa = agendamentosHoje.slice(0, LIMITE_PREVIA);
  $('previa').innerHTML = previa.length
    ? `<div class="cab-prev" aria-hidden="true"><span>Horário</span><span>Serviço</span><span>Pet</span><span>Tutor</span><span>Status</span></div>`
      + previa.map(a => `<button type="button" class="linha-ag" data-id="${a.id}"><strong>${hora(a)}</strong><span>${esc(a.servico_nome)}</span><span>${esc(a.animal_nome)}</span><span>${esc(a.tutor_nome)}</span><span class="status ${STATUS[a.status].classe}">${STATUS[a.status].texto}</span></button>`).join('')
      + (total > previa.length ? `<p class="nota">Mostrando ${previa.length} de ${total} agendamentos de hoje.</p>` : '')
    : '<div class="vazio"><span>📅</span>Não existem agendamentos registrados para hoje.</div>';
}

async function carregarAgenda() {
  try {
    agendamentosHoje = await api('/agendamentos?data=' + hojeISO());
    desenharAgendamentos();
    erroBloco('erro-agenda', '');
    $('ultima').textContent = 'Última atualização: ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch (x) {
    // Mantém os números anteriores na tela e avisa só neste bloco.
    erroBloco('erro-agenda', 'Não foi possível carregar os agendamentos. ' + (x.status === 401 ? '' : 'Tente novamente.'));
    if (x.status === 401) tratarErro(x);
  }
}

// Atualiza os dois blocos juntos; um erro em um não derruba o outro.
async function atualizar(manual) {
  if (carregando) return;
  carregando = true;
  const botao = $('btn-atualizar');
  botao.disabled = true;
  botao.textContent = 'Atualizando...';
  await Promise.all([carregarUsuarios(), carregarAgenda()]);
  botao.disabled = false;
  botao.textContent = '↻ Atualizar';
  carregando = false;
  if (manual && $('erro-agenda').hidden && $('erro-usuarios').hidden) mostrarMensagem('sucesso', 'Dados do painel atualizados com sucesso!');
}

// ---------- detalhes de um agendamento ----------
function abrirDetalhes(id) {
  const ag = agendamentosHoje.find(a => a.id === id);
  if (!ag) return;
  const s = STATUS[ag.status];
  $('det-conteudo').innerHTML = `<span class="status ${s.classe}">${s.texto}</span>
    <dl class="dados">
      <dt>Tutor</dt><dd>${esc(ag.tutor_nome)}</dd>
      <dt>Animal</dt><dd>${esc(ag.animal_nome)}</dd>
      <dt>Serviço</dt><dd>${esc(ag.servico_nome)}</dd>
      <dt>Horário</dt><dd>${hora(ag)} (${dataBR(ag)})</dd>
      <dt>Duração</dt><dd>${ag.servico_duracao_min} minutos</dd>
      <dt>Valor</dt><dd>${moeda(ag.servico_preco)}</dd>
      <dt>Observações</dt><dd>${ag.observacao ? esc(ag.observacao) : 'Nenhuma observação.'}</dd>
    </dl>`;
  $('det-agenda').href = urlAgenda(ag.status);
  $('dlg-detalhes').showModal();
}

function iniciar() {
  // Os números dos agendamentos abrem a agenda de hoje já filtrada.
  document.querySelectorAll('.num[data-status]').forEach(a => { a.href = urlAgenda(a.dataset.status); });
  $('ver-agenda').href = urlAgenda();

  $('btn-atualizar').addEventListener('click', () => atualizar(true));
  $('previa').addEventListener('click', e => {
    const linha = e.target.closest('.linha-ag');
    if (linha) abrirDetalhes(Number(linha.dataset.id));
  });

  atualizar(false);
  // Atualização automática a cada 60 s, só com a aba visível e sem interromper outra consulta.
  setInterval(() => { if (document.visibilityState === 'visible') atualizar(false); }, 60000);
}

if (Auth.exigirPerfil(['administrador'])) iniciar();
