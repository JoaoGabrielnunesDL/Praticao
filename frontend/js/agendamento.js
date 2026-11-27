// Novo Agendamento (tutor). Usa a API real:
//   GET /servicos       -> serviços ativos (nome, preco, duracao_min)
//   GET /animais        -> animais do tutor
//   GET /agendamentos   -> agendamentos do próprio tutor (para já marcar horários dele que se sobrepõem)
//   POST /agendamentos  -> corpo: animal_id, servico_id, data_hora ("2026-12-10T14:00:00"), observacao
// A API não tem rota de disponibilidade: os horários vêm do expediente (js/config.js) e quem decide de verdade é o POST,
// que devolve 409 "Horário indisponível" se outra pessoa já ocupou o horário. Nesse caso o horário é marcado como ocupado.
let servicos = [];
let animais = [];
let meus = [];            // agendamentos ativos do tutor
let ocupadosApi = new Set(); // horários recusados pela API nesta sessão ("2026-11-20T10:00")
let enviando = false;
let alterado = false;     // o tutor mexeu no formulário? (usado ao cancelar)

const pad = n => String(n).padStart(2, '0');
const servicoSel = () => servicos.find(s => s.id === Number($('servico').value));
const animalSel = () => animais.find(a => a.id === Number($('animal').value));
const dataBRtexto = iso => iso.split('-').reverse().join('/');
const minutos = h => h * 60;

// ---------- horários ----------
// Gera os horários do dia em que o serviço cabe no expediente, sem passado e sem sobreposição.
function horariosDoDia(dataISO, servico) {
  const [ano, mes, dia] = dataISO.split('-').map(Number);
  const diaSemana = new Date(ano, mes - 1, dia).getDay();
  const [abre, fecha] = EXPEDIENTE[diaSemana];
  const agora = new Date();
  const lista = [];
  for (let m = minutos(abre); m + servico.duracao_min <= minutos(fecha); m += PASSO_MIN) {
    const hhmm = `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
    const inicio = new Date(ano, mes - 1, dia, Math.floor(m / 60), m % 60);
    const fim = new Date(inicio.getTime() + servico.duracao_min * 60000);
    let livre = inicio > agora && !ocupadosApi.has(`${dataISO}T${hhmm}`);
    // Sobreposição com um agendamento ativo do próprio tutor (a regra da API é a mesma: início < fim do outro e vice-versa).
    if (livre) livre = !meus.some(o => {
      const oi = new Date(o.data_hora);
      return inicio < new Date(oi.getTime() + o.servico_duracao_min * 60000) && oi < fim;
    });
    lista.push({ hhmm, livre });
  }
  return lista;
}

function atualizarHorarios(manter) {
  const sel = $('horario');
  const s = servicoSel();
  const data = $('data').value;
  if (!s || !data) {
    sel.innerHTML = `<option value="">Selecione ${!s ? 'um serviço' : 'uma data'}</option>`;
    $('dica-horario').textContent = 'A disponibilidade é confirmada na hora.';
    return atualizarResumo();
  }
  const lista = horariosDoDia(data, s);
  const livres = lista.filter(h => h.livre).length;
  sel.innerHTML = '<option value="">Selecione um horário</option>' +
    lista.map(h => `<option value="${h.hhmm}"${h.livre ? '' : ' disabled'}>${h.hhmm}${h.livre ? '' : ' (indisponível)'}</option>`).join('');
  if (manter && lista.some(h => h.hhmm === manter && h.livre)) sel.value = manter;
  $('dica-horario').textContent = livres ? `${livres} horário(s) disponível(is).` : 'Não há horários disponíveis nesta data. Escolha outra data.';
  atualizarResumo();
}

// ---------- resumo e validação ----------
function atualizarResumo() {
  const s = servicoSel(), a = animalSel(), d = $('data').value, h = $('horario').value;
  const set = (id, texto, ok) => { $(id).textContent = texto; $(id).classList.toggle('ok', !!ok); };
  set('r-servico', s ? s.nome : 'Não selecionado', s);
  set('r-animal', a ? `${a.nome} (${a.especie})` : 'Não selecionado', a);
  set('r-data', d && h ? `${dataBRtexto(d)} • ${h}` : 'Não selecionado', d && h);
  set('r-duracao', s ? s.duracao_min + ' minutos' : '—', s);
  $('r-valor').textContent = s ? moeda(s.preco) : '—';
  $('confirmar').disabled = !(s && a && d && h) || enviando;
}

function erroCampo(id, texto) {
  const e = $('e-' + id), campo = $(id);
  e.textContent = texto || '';
  e.hidden = !texto;
  campo.classList.toggle('invalido', !!texto);
}

function validar() {
  const hoje = hojeISO();
  const d = $('data').value;
  erroCampo('servico', servicoSel() ? '' : 'Selecione um serviço.');
  erroCampo('animal', animalSel() ? '' : 'Selecione um animal.');
  erroCampo('data', !d ? 'Informe uma data válida.' : d < hoje ? 'Não é possível agendar em data passada.' : '');
  erroCampo('horario', $('horario').value ? '' : 'Selecione um horário disponível.');
  return servicoSel() && animalSel() && d && d >= hoje && $('horario').value;
}

// ---------- envio ----------
async function confirmar(e) {
  e.preventDefault();
  if (enviando || !validar()) return;
  const s = servicoSel(), a = animalSel(), data = $('data').value, hhmm = $('horario').value;
  enviando = true;
  $('confirmar').disabled = true; // evita duplo clique
  $('confirmar').textContent = 'Enviando...';
  try {
    const ag = await api('/agendamentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ animal_id: a.id, servico_id: s.id, data_hora: `${data}T${hhmm}:00`, observacao: $('obs').value.trim() || null }),
    });
    alterado = false;
    $('suc-dados').innerHTML = `<dt>Número</dt><dd>#${ag.id}</dd><dt>Pet</dt><dd>${esc(ag.animal_nome)}</dd><dt>Serviço</dt><dd>${esc(ag.servico_nome)}</dd>
      <dt>Data</dt><dd>${dataBR(ag)}</dd><dt>Horário</dt><dd>${hora(ag)}</dd><dt>Valor</dt><dd>${moeda(ag.servico_preco)}</dd>
      <dt>Status</dt><dd><span class="status ${STATUS[ag.status].classe}">${STATUS[ag.status].texto}</span></dd>`;
    $('dlg-sucesso').showModal();
  } catch (x) {
    if (x.status === 401) tratarErro(x);
    else if (x.status === 409) { // alguém ocupou o horário antes: marca e pede outra escolha
      ocupadosApi.add(`${data}T${hhmm}`);
      atualizarHorarios();
      mostrarMensagem('erro', 'Este horário acabou de ficar indisponível. Selecione outro horário.');
    } else mostrarMensagem('erro', x.message); // os dados preenchidos são mantidos
  } finally {
    enviando = false;
    $('confirmar').innerHTML = '<span class="pc-ic pc-f-calendario" aria-hidden="true"></span> Confirmar Agendamento';
    atualizarResumo();
  }
}

async function cancelar() {
  if (alterado && !(await perguntar({ titulo: 'Deseja cancelar o agendamento?', texto: 'As informações preenchidas serão perdidas.', rotulo: 'Sim, cancelar' }))) return;
  location.href = 'painel.html';
}

function limpar() {
  $('form').reset();
  alterado = false;
  ['servico', 'animal', 'data', 'horario'].forEach(i => erroCampo(i, ''));
  if (animais.length === 1) $('animal').value = animais[0].id;
  atualizarHorarios();
  $('contador').textContent = '0/300';
}

// ---------- carregamento ----------
async function carregar() {
  $('erro-tela').hidden = true;
  $('conteudo').hidden = false;
  try {
    let ags;
    [servicos, animais, ags] = await Promise.all([api('/servicos'), api('/animais'), api('/agendamentos')]);
    meus = ags.filter(g => g.status === 'AGENDADO' || g.status === 'CONFIRMADO');
  } catch (x) {
    if (x.status === 401) return tratarErro(x);
    $('conteudo').hidden = true;
    $('erro-texto').textContent = x.message;
    $('erro-tela').hidden = false;
    return;
  }
  if (!animais.length) { $('conteudo').hidden = true; $('sem-animal').hidden = false; return; }
  $('sem-animal').hidden = true;

  $('servico').innerHTML = '<option value="">Selecione um serviço</option>' +
    servicos.map(s => `<option value="${s.id}">${esc(s.nome)} — ${moeda(s.preco)}</option>`).join('');
  $('animal').innerHTML = '<option value="">Selecione seu animal</option>' +
    animais.map(a => `<option value="${a.id}">${esc(a.nome)} (${esc(a.especie)}${a.raca ? ' • ' + esc(a.raca) : ''})</option>`).join('');

  // Vindo de outra tela (?servico= / ?animal=): já chega preenchido. Com um só animal, ele já vem escolhido.
  const q = new URLSearchParams(location.search);
  if (servicos.some(s => s.id === Number(q.get('servico')))) $('servico').value = q.get('servico');
  if (animais.some(a => a.id === Number(q.get('animal')))) $('animal').value = q.get('animal');
  else if (animais.length === 1) $('animal').value = animais[0].id;

  $('data').min = hojeISO();
  atualizarHorarios();
}

function iniciar() {
  const mudou = () => { alterado = true; };
  $('servico').addEventListener('change', () => { mudou(); erroCampo('servico', ''); atualizarHorarios($('horario').value); });
  $('animal').addEventListener('change', () => { mudou(); erroCampo('animal', ''); atualizarResumo(); });
  $('data').addEventListener('change', () => { mudou(); erroCampo('data', ''); atualizarHorarios(); });
  $('horario').addEventListener('change', () => { mudou(); erroCampo('horario', ''); atualizarResumo(); });
  $('obs').addEventListener('input', () => { mudou(); $('contador').textContent = $('obs').value.length + '/300'; });
  $('form').addEventListener('submit', confirmar);
  $('cancelar').addEventListener('click', cancelar);
  $('tentar').addEventListener('click', carregar);
  $('suc-novo').addEventListener('click', async () => {
    $('dlg-sucesso').close();
    try { meus = (await api('/agendamentos')).filter(g => g.status === 'AGENDADO' || g.status === 'CONFIRMADO'); } catch { /* mantém a lista anterior */ }
    limpar();
  });
  carregar();
}

if (Auth.exigirPerfil(['tutor'])) iniciar();
