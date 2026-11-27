// Meus Agendamentos (tutor). Usa a API real:
//   GET  /agendamentos             -> agendamentos do tutor logado (animal_nome, servico_nome, servico_preco, servico_duracao_min, status, observacao)
//   GET  /animais                  -> para mostrar a espécie do animal
//   POST /agendamentos/{id}/cancelar  -> a API aplica as regras (status permitido e 2h de antecedência)
// Pesquisa, filtro de status e indicadores funcionam juntos, no próprio navegador, e compartilham o mesmo estado.
// Aceita ?status=CONCLUIDO (usado pelo painel e por Meus Animais).
let agendamentos = [];
let especies = {};     // animal_id -> espécie
let statusSel = 'TODOS';
let termo = '';
let aberto = null;     // agendamento aberto nos detalhes
let ocupado = false;

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const ICONES = [['banho', '🛁'], ['tosa', '✂️'], ['hidrat', '🧴'], ['unha', '🐾'], ['consulta', '🩺'], ['vacin', '💉']];
const normalizar = t => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const iconeServico = nome => { const n = normalizar(nome); const p = ICONES.find(([k]) => n.includes(k)); return p ? p[1] : '✨'; };
const iconeAnimal = esp => ({ 'cao': '🐶', 'gato': '🐱' }[normalizar(esp)] || '🐾');
// O dia da semana é calculado a partir da data (nunca digitado).
const diaSemana = ag => DIAS[new Date(ag.data_hora).getDay()];
function duracao(min) { const h = Math.floor(min / 60), m = min % 60; return h ? (m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`) : `${m} min`; }
const textoStatus = s => STATUS[s].texto;
const especieDe = ag => especies[ag.animal_id] || '';

// ---------- filtro ----------
function filtrados() {
  const t = normalizar(termo);
  return agendamentos.filter(ag =>
    (statusSel === 'TODOS' || ag.status === statusSel) &&
    (!t || normalizar(`${ag.id} ${ag.animal_nome} ${ag.servico_nome} ${dataBR(ag)} ${textoStatus(ag.status)}`).includes(t)));
}

// ---------- desenho ----------
// Fotos ilustrativas por espécie (a API não guarda foto do animal): cão alterna entre duas fotos, gato tem a sua.
const FOTOS_CAO = ['img/agendamentos/foto-cao1.webp', 'img/agendamentos/foto-cao2.webp'];
const FOTO_GATO = 'img/agendamentos/foto-gato.webp';
function fotoPet(ag) {
  const e = normalizar(especieDe(ag));
  const src = e === 'gato' ? FOTO_GATO : e === 'cao' ? FOTOS_CAO[Math.abs(Number(ag.animal_id) || 0) % 2] : '';
  return src ? `<span class="ma-foto com-foto" aria-hidden="true"><img src="${src}" alt="" loading="lazy" decoding="async"></span>`
             : `<span class="ma-foto" aria-hidden="true">${iconeAnimal(especieDe(ag))}</span>`;
}
// Ícone e cor de cada serviço (procura pelo nome, como antes).
const SVC = [['banho', 'banho', 'azul'], ['tosa', 'tesoura', 'rosa'], ['hidrat', 'brilho', 'laranja'], ['unha', 'pata', 'rosa'], ['consulta', 'coracao', 'vermelho'], ['vacin', 'seringa', 'roxo']];
const svcDe = nome => { const n = normalizar(nome); return SVC.find(([k]) => n.includes(k)) || ['', 'brilho', 'laranja']; };

function itemHTML(ag) {
  const st = STATUS[ag.status];
  const [, forma, cor] = svcDe(ag.servico_nome);
  return `<article class="ma-item">
    <div class="ma-pet">${fotoPet(ag)}<div><strong>${esc(ag.animal_nome)}</strong><small><span class="pc-ic pc-f-pata" aria-hidden="true"></span> ${esc(especieDe(ag))}</small></div></div>
    <div class="ma-serv"><span class="ma-serv-ic ma-t-${cor}" aria-hidden="true"><span class="pc-ic pc-f-${forma}"></span></span>
      <div><strong>${esc(ag.servico_nome)}</strong><small><span class="pc-ic pc-f-calendario" aria-hidden="true"></span> ${diaSemana(ag)}, ${dataBR(ag)} às ${hora(ag)}</small><small><span class="pc-ic pc-f-relogio" aria-hidden="true"></span> Duração: ~ ${duracao(ag.servico_duracao_min)}</small>${linhaPagamento(ag)}</div></div>
    <span class="status ${st.classe}">${st.texto}</span>
    <button type="button" class="btn btn-contorno btn-pequeno" data-id="${ag.id}"><span class="pc-ic pc-f-olho" aria-hidden="true"></span> Ver detalhes</button>
  </article>`;
}

// Situação do pagamento (simulado): chip + botão "Pagar agora" enquanto não foi pago nem combinado.
const ativoAg = ag => ag.status === 'AGENDADO' || ag.status === 'CONFIRMADO';
const linhaPagamento = ag => (Pagamento.obter(ag) || ativoAg(ag))
  ? `<small class="pg-linha-pagar">${Pagamento.chipHTML(ag)}${Pagamento.pode(ag) ? `<button type="button" class="pg-mini" data-pagar="${ag.id}">Pagar agora</button>` : ''}</small>` : '';
function pagar(id) {
  const ag = agendamentos.find(a => a.id === Number(id));
  if (ag) Pagamento.abrir({ ag, aoFechar: render });
}

function render() {
  ['TODOS', 'AGENDADO', 'CONFIRMADO', 'CONCLUIDO', 'CANCELADO'].forEach(s => {
    $('n-' + s).textContent = s === 'TODOS' ? agendamentos.length : agendamentos.filter(a => a.status === s).length;
  });
  // Indicadores e filtro mostram sempre a mesma seleção.
  document.querySelectorAll('.ma-ind').forEach(b => b.setAttribute('aria-pressed', b.dataset.status === statusSel));
  $('filtro').value = statusSel;
  $('limpar-busca').hidden = !termo;

  const lista = filtrados();
  if (lista.length) { $('lista').innerHTML = lista.map(itemHTML).join(''); return; }
  if (!agendamentos.length) {
    $('lista').innerHTML = '<div class="vazio"><span class="pc-ic pc-f-calendario" aria-hidden="true"></span>Você ainda não tem agendamentos!<p>Que tal agendar o próximo cuidado do seu companheiro?</p><a class="btn btn-laranja btn-pequeno" href="agendamento.html">+ Novo Agendamento</a></div>';
  } else {
    $('lista').innerHTML = '<div class="vazio"><span class="pc-ic pc-f-busca" aria-hidden="true"></span>Nenhum agendamento encontrado<p>Nenhum atendimento corresponde à pesquisa ou ao filtro.</p><button type="button" class="btn btn-laranja btn-pequeno" data-limpar>Limpar pesquisa e filtro</button></div>';
  }
}

function escolherStatus(s) {
  statusSel = s;
  render();
  const url = new URL(location.href);
  s === 'TODOS' ? url.searchParams.delete('status') : url.searchParams.set('status', s);
  history.replaceState(null, '', url);
}

// ---------- detalhes e cancelamento ----------
function abrirDetalhes(id) {
  const ag = agendamentos.find(a => a.id === Number(id));
  if (!ag) return;
  aberto = ag;
  const st = STATUS[ag.status];
  $('det-dados').innerHTML = `<dt>Código</dt><dd>#${ag.id}</dd>
    <dt>Animal</dt><dd>${esc(ag.animal_nome)}${especieDe(ag) ? ' (' + esc(especieDe(ag)) + ')' : ''}</dd>
    <dt>Serviço</dt><dd>${esc(ag.servico_nome)}</dd>
    <dt>Data</dt><dd>${diaSemana(ag)}, ${dataBR(ag)}</dd>
    <dt>Horário</dt><dd>${hora(ag)}</dd>
    <dt>Duração</dt><dd>~ ${duracao(ag.servico_duracao_min)}</dd>
    <dt>Valor</dt><dd>${moeda(ag.servico_preco)}</dd>
    <dt>Pagamento</dt><dd>${(Pagamento.obter(ag) || ativoAg(ag)) ? Pagamento.chipHTML(ag) : '—'}</dd>
    <dt>Status</dt><dd><span class="status ${st.classe}">${st.texto}</span></dd>
    <dt>Observações</dt><dd>${ag.observacao ? esc(ag.observacao) : '—'}</dd>`;
  const ativo = ag.status === 'AGENDADO' || ag.status === 'CONFIRMADO';
  $('det-cancelar').hidden = !ativo;
  $('det-pagar').hidden = !Pagamento.pode(ag);
  $('det-novamente').hidden = ativo; // concluído ou cancelado: só consulta e novo agendamento
  $('det-novamente').href = `agendamento.html?servico=${ag.servico_id}&animal=${ag.animal_id}`;
  const aviso = $('det-aviso');
  aviso.hidden = false;
  aviso.textContent = ag.status === 'AGENDADO' ? 'Aguardando a confirmação do estabelecimento. O cancelamento é permitido com até 2 horas de antecedência.'
    : ag.status === 'CONFIRMADO' ? 'Horário confirmado pelo estabelecimento. O cancelamento é permitido com até 2 horas de antecedência.'
    : ag.status === 'CONCLUIDO' ? 'Atendimento realizado. Este agendamento não pode mais ser alterado.'
    : 'Agendamento cancelado. Para realizar o serviço, faça um novo agendamento.';
  $('dlg-detalhes').showModal();
}

async function cancelar() {
  if (ocupado || !aberto) return;
  const ag = aberto;
  $('dlg-detalhes').close();
  const ok = await perguntar({ titulo: 'Cancelar agendamento?', texto: `${ag.servico_nome} de ${ag.animal_nome} em ${dataBR(ag)} às ${hora(ag)}.`, rotulo: 'Sim, cancelar' });
  if (!ok) return;
  ocupado = true;
  try {
    await api(`/agendamentos/${ag.id}/cancelar`, { method: 'POST' });
    mostrarMensagem('sucesso', 'Agendamento cancelado.');
    await carregar(false); // atualiza a lista e os indicadores
  } catch (x) {
    // Ex.: 400 "Prazo para cancelamento encerrado" (a regra das 2 horas é da API).
    tratarErro(x, x.message === 'Prazo para cancelamento encerrado' ? ' Entre em contato com o estabelecimento para obter ajuda.' : '');
  } finally { ocupado = false; }
}

// ---------- carregamento ----------
async function carregar(mostrarEsqueleto = true) {
  $('erro-tela').hidden = true;
  $('conteudo').hidden = false;
  if (mostrarEsqueleto) $('lista').innerHTML = '<div class="ma-item esqueleto"></div>'.repeat(3);
  try {
    const [ags, ans] = await Promise.all([api('/agendamentos'), api('/animais')]);
    agendamentos = ags;
    especies = Object.fromEntries(ans.map(a => [a.id, a.especie]));
    render(); // os filtros (pesquisa e status) são preservados
  } catch (x) {
    if (x.status === 401) return tratarErro(x);
    $('conteudo').hidden = true;
    $('erro-texto').textContent = x.message;
    $('erro-tela').hidden = false;
  }
}

function iniciar() {
  const inicial = new URLSearchParams(location.search).get('status');
  if (inicial && STATUS[inicial]) statusSel = inicial;
  $('indicadores').addEventListener('click', e => { const b = e.target.closest('.ma-ind'); if (b) escolherStatus(b.dataset.status); });
  $('filtro').addEventListener('change', e => escolherStatus(e.target.value));
  $('busca').addEventListener('input', e => { termo = e.target.value; render(); });
  $('limpar-busca').addEventListener('click', () => { termo = ''; $('busca').value = ''; render(); $('busca').focus(); });
  $('lista').addEventListener('click', e => {
    if (e.target.closest('[data-limpar]')) { termo = ''; $('busca').value = ''; return escolherStatus('TODOS'); }
    const p = e.target.closest('[data-pagar]');
    if (p) return pagar(p.dataset.pagar);
    const b = e.target.closest('[data-id]');
    if (b) abrirDetalhes(b.dataset.id);
  });
  $('det-fechar').addEventListener('click', () => $('dlg-detalhes').close());
  $('det-pagar').addEventListener('click', () => {
    const ag = aberto; $('dlg-detalhes').close();
    Pagamento.abrir({ ag, aoFechar: () => { render(); abrirDetalhes(ag.id); } });
  });
  $('det-cancelar').addEventListener('click', cancelar);
  $('atualizar').addEventListener('click', () => carregar(false));
  $('tentar').addEventListener('click', () => carregar());
  carregar();
}

if (Auth.exigirPerfil(['tutor'])) iniciar();
