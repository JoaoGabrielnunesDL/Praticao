// Relatórios do Sistema (funcionário e administrador). Usa a API real:
//   GET /relatorios/agendamentos?inicio=&fim=              -> total, por_status, por_servico (cartões e gráficos)
//   GET /relatorios/agendamentos/itens?inicio=&fim=&status=&servico_id=&pagina=&tamanho=   -> tabela paginada
//   GET /relatorios/agendamentos/exportar?...              -> arquivo CSV
// Clicar nos cartões, nas barras ou na legenda aplica um filtro na tabela (os dois filtros se combinam).
const ORDEM = ['AGENDADO', 'CONFIRMADO', 'CONCLUIDO', 'CANCELADO'];
const ICONES = { TOTAL: '📅', AGENDADO: '🕒', CONFIRMADO: '✔', CONCLUIDO: '✔', CANCELADO: '✖' };
const CORES_BARRAS = ['#0b3a9e', '#3b8cf4', '#f28a0c', '#8fb9f5', '#2e9e4f', '#8e6bd6'];
const MAX_BARRAS = 6;
const TAMANHO = 10;

let periodo = { inicio: '', fim: '' };   // período já gerado (não muda enquanto o usuário só mexe nos campos)
let filtro = { status: '', servicoId: null };
let pagina = 1;
let resumo = null;
let itensDaPagina = [];
let pedidoResumo = 0, pedidoItens = 0;   // ignoram respostas antigas se o usuário clicar rápido

const dataIso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dataCurta = iso => iso.split('-').reverse().join('/');
const porcentagem = (n, total) => (total ? ((n / total) * 100).toFixed(1).replace('.', ',') + '%' : '0%');

function consulta(comFiltros = true, extra = '') {
  let q = `inicio=${periodo.inicio}&fim=${periodo.fim}`;
  if (comFiltros && filtro.status) q += `&status=${filtro.status}`;
  if (comFiltros && filtro.servicoId) q += `&servico_id=${filtro.servicoId}`;
  return q + extra;
}

// ---------- período e atalhos ----------
function aplicarAtalho(nome) {
  const hoje = new Date();
  let ini = hoje, fim = hoje;
  if (nome === '7dias') ini = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 6);
  if (nome === 'mes') {
    ini = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  }
  if (nome === 'mesant') {   // mês anterior inteiro
    ini = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
  }
  $('inicio').value = dataIso(ini);
  $('fim').value = dataIso(fim);
  marcarAtalho(nome);
}

function marcarAtalho(nome) {
  document.querySelectorAll('[data-atalho]').forEach(b => {
    const ativo = b.dataset.atalho === nome;
    b.classList.toggle('ativo', ativo);
    b.setAttribute('aria-pressed', ativo);
  });
}

function erroDoPeriodo() {
  const inicio = $('inicio').value, fim = $('fim').value;
  if (!inicio && !fim) return 'Informe o período inicial e o final.';
  if (!inicio) return 'Informe a data inicial.';
  if (!fim) return 'Informe a data final.';
  if (fim < inicio) return 'A data inicial não pode ser depois da data final.';
  if ((new Date(fim) - new Date(inicio)) / 86400000 > 366) return 'O período máximo é de 12 meses.';
  return '';
}

// Valida na hora: mostra o aviso, marca os campos e bloqueia o botão Gerar enquanto o intervalo estiver errado.
function validarPeriodo() {
  const erro = erroDoPeriodo();
  const caixa = $('erro-periodo');
  caixa.textContent = erro;
  caixa.hidden = !erro;
  ['inicio', 'fim'].forEach(id => {
    $(id).closest('.campo-data').classList.toggle('invalido', !!erro);
    $(id).setAttribute('aria-invalid', !!erro);
  });
  $('btn-gerar').disabled = !!erro;
  return erro;
}

// ---------- cartões, gráficos e filtros ----------
function kpisHTML(r) {
  const cartao = (chave, valor, rotulo, status) =>
    `<button type="button" class="kpi ${chave}" data-status="${status}" aria-pressed="false">
      <span class="kpi-icone" aria-hidden="true">${ICONES[chave]}</span>
      <span class="kpi-texto"><strong>${valor}</strong>${rotulo}</span>
    </button>`;
  return cartao('TOTAL', r.total, 'Total', '')
    + ORDEM.map(s => cartao(s, r.por_status[s] ?? 0, STATUS[s].plural, s)).join('');
}

function barrasHTML(r) {
  const lista = r.por_servico.slice(0, MAX_BARRAS);
  if (!lista.length) return '<p class="vazio-grafico">Nenhum serviço encontrado neste período.</p>';
  const maior = Math.max(1, ...lista.map(s => s.total));
  return `<div class="barras-v">${lista.map((s, i) => `
    <button type="button" class="bv" data-servico="${s.servico_id}" aria-pressed="false" aria-label="${esc(s.nome)}: ${s.total}">
      <span class="valor">${s.total}</span>
      <span class="coluna" style="height:${Math.max(6, Math.round((s.total / maior) * 150))}px;background:${CORES_BARRAS[i % CORES_BARRAS.length]}"></span>
      <span class="nome">${esc(s.nome)}</span>
    </button>`).join('')}</div>`;
}

function roscaHTML(r) {
  let acumulado = 0;
  const fatias = ORDEM.filter(s => r.por_status[s]).map(s => {
    const de = (acumulado / r.total) * 100;
    acumulado += r.por_status[s];
    return `${STATUS[s].cor} ${de}% ${(acumulado / r.total) * 100}%`;
  });
  $('rosca').style.background = r.total ? `conic-gradient(${fatias.join(',')})` : '#e3eaf6';
  $('rosca-total').textContent = r.total;
  $('legenda').innerHTML = ORDEM.map(s => `<li><button type="button" data-status="${s}" aria-pressed="false">
      <i style="background:${STATUS[s].cor}"></i>${STATUS[s].plural}
      <span class="pct">${porcentagem(r.por_status[s], r.total)}</span></button></li>`).join('');
}

function nomeDoServico(id) {
  const s = resumo && resumo.por_servico.find(x => x.servico_id === id);
  return s ? s.nome : 'Serviço';
}

// Atualiza só o destaque e as "etiquetas" dos filtros (não redesenha os gráficos).
function marcarFiltros() {
  document.querySelectorAll('[data-status]').forEach(b => b.setAttribute('aria-pressed', b.dataset.status === filtro.status));
  document.querySelectorAll('[data-servico]').forEach(b => b.setAttribute('aria-pressed', Number(b.dataset.servico) === filtro.servicoId));
  const chips = [];
  if (filtro.status) chips.push(`<span class="chip">Status: ${STATUS[filtro.status].texto}<button type="button" data-tirar="status" aria-label="Remover filtro de status">×</button></span>`);
  if (filtro.servicoId) chips.push(`<span class="chip">Serviço: ${esc(nomeDoServico(filtro.servicoId))}<button type="button" data-tirar="servico" aria-label="Remover filtro de serviço">×</button></span>`);
  if (chips.length) chips.push('<button type="button" class="link" data-tirar="tudo">Limpar filtros</button>');
  $('chips').innerHTML = chips.join('');
}

function mudarFiltro(novo) {
  filtro = { ...filtro, ...novo };
  pagina = 1;
  marcarFiltros();
  carregarItens();
}

// ---------- tabela ----------
function itensHTML(d) {
  if (!d.itens.length) {
    return `<div class="vazio"><span>📅</span>Nenhum agendamento encontrado${filtro.status || filtro.servicoId ? ' com esses filtros' : ' neste período'}.</div>`;
  }
  const linhas = d.itens.map((i, n) => `<article class="reg clicavel" data-n="${n}" role="button" tabindex="0" aria-label="Ver detalhes do agendamento de ${esc(i.animal_nome)}">
      <strong>${dataBR(i)}</strong>
      <span><span class="rot">Horário:</span>${hora(i)}</span>
      <span><span class="rot">Pet:</span>${esc(i.animal_nome)}</span>
      <span><span class="rot">Serviço:</span>${esc(i.servico_nome)}</span>
      <span class="peq"><span class="rot">Tutor:</span>${esc(i.tutor_nome)}</span>
      <span><span class="status ${STATUS[i.status].classe}">${ICONES[i.status]} ${STATUS[i.status].texto}</span></span>
    </article>`).join('');
  const de = (d.pagina - 1) * d.tamanho + 1;
  const ate = de + d.itens.length - 1;
  return `<div class="tabela t-itens"><div class="cab" aria-hidden="true"><span>Data</span><span>Horário</span><span>Pet</span><span>Serviço</span><span>Tutor</span><span>Status</span></div>${linhas}</div>
    <div class="rodape-tabela">
      <nav class="paginacao" aria-label="Paginação">${paginacaoHTML(d)}</nav>
      <span class="sub">Mostrando ${de} a ${ate} de ${d.total} registros</span>
    </div>`;
}

// Mostra no máximo 5 números de página ao redor da atual.
function paginacaoHTML(d) {
  const total = d.total_paginas;
  let ini = Math.max(1, d.pagina - 2);
  const fim = Math.min(total, ini + 4);
  ini = Math.max(1, fim - 4);
  let html = `<button type="button" data-pg="${d.pagina - 1}" aria-label="Página anterior" ${d.pagina <= 1 ? 'disabled' : ''}>‹</button>`;
  for (let p = ini; p <= fim; p++) {
    html += `<button type="button" data-pg="${p}" ${p === d.pagina ? 'class="atual" aria-current="page"' : ''}>${p}</button>`;
  }
  return html + `<button type="button" data-pg="${d.pagina + 1}" aria-label="Próxima página" ${d.pagina >= total ? 'disabled' : ''}>›</button>`;
}

async function carregarItens() {
  const meu = ++pedidoItens;
  const caixa = $('itens');
  caixa.innerHTML = '<p class="carregando">Carregando agendamentos...</p>';
  try {
    const d = await api(`/relatorios/agendamentos/itens?${consulta(true, `&pagina=${pagina}&tamanho=${TAMANHO}`)}`);
    if (meu !== pedidoItens) return;
    // Se a página sumiu (ex.: registros mudaram), volta para a última existente.
    if (!d.itens.length && d.total > 0 && pagina > 1) { pagina = d.total_paginas; return carregarItens(); }
    itensDaPagina = d.itens;
    caixa.innerHTML = itensHTML(d);
  } catch (x) {
    if (meu !== pedidoItens) return;
    caixa.innerHTML = Estados.erro(x, 'data-recarregar');
    if (x.status === 401) tratarErro(x);
  }
}

// ---------- detalhes de um agendamento ----------
function abrirDetalhes(i) {
  const linhas = [
    ['Código', 'AG-' + String(i.id).padStart(5, '0')],
    ['Data', dataBR(i)],
    ['Horário', hora(i)],
    ['Serviço', esc(i.servico_nome)],
    ['Valor', moeda(i.servico_preco)],
    ['Duração', i.servico_duracao_min + ' min'],
    ['Pet', esc(i.animal_nome) + ' (' + esc(i.animal_especie) + (i.animal_raca ? ' · ' + esc(i.animal_raca) : '') + ')'],
    ['Tutor', esc(i.tutor_nome)],
    ['Telefone', i.tutor_telefone ? esc(i.tutor_telefone) : 'Não informado'],
    ['Status', `<span class="status ${STATUS[i.status].classe}">${STATUS[i.status].texto}</span>`],
    ['Observações', i.observacao ? esc(i.observacao) : '—'],
  ];
  $('det-conteudo').innerHTML = `<dl class="dados">${linhas.map(([t, v]) => `<dt>${t}</dt><dd>${v}</dd>`).join('')}</dl>`;
  // Atualizar o atendimento é na Agenda: abre já no dia do agendamento.
  $('det-agenda').href = 'painel-funcionario.html?data=' + i.data_hora.slice(0, 10);
  $('dlg-detalhes').showModal();
}

// ---------- exportar ----------
async function exportar() {
  const botao = $('btn-exportar');
  botao.disabled = true;
  botao.textContent = 'Gerando arquivo...';
  try {
    // O arquivo não é JSON, então não dá para usar api(): busca direto, com o token.
    const resposta = await fetch(`${API_URL}/relatorios/agendamentos/exportar?${consulta()}`, { headers: { Authorization: 'Bearer ' + Auth.token() } });
    if (!resposta.ok) {
      const dados = await resposta.json().catch(() => null);
      const erro = new Error(mensagemErro(dados));
      erro.status = resposta.status;
      throw erro;
    }
    const url = URL.createObjectURL(await resposta.blob());
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${periodo.inicio}_a_${periodo.fim}.csv`;
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    mostrarMensagem('sucesso', 'Relatório exportado com sucesso!');
  } catch (x) {
    tratarErro(x.status ? x : new Error('Não foi possível exportar o relatório. Confira se a API está rodando.'));
  } finally {
    botao.disabled = false;
    botao.textContent = '⬇ Exportar CSV';
  }
}

// ---------- gerar relatório ----------
async function gerar(e) {
  if (e) e.preventDefault();
  if (validarPeriodo()) return; // não chama a API com datas inválidas
  $('mensagem').hidden = true;
  periodo = { inicio: $('inicio').value, fim: $('fim').value };
  filtro = { status: '', servicoId: null };
  pagina = 1;
  const meu = ++pedidoResumo;
  $('btn-gerar').disabled = true;
  $('conteudo').hidden = true;
  $('estado').innerHTML = '<p class="carregando">Gerando relatório...</p>';
  try {
    const r = await api('/relatorios/agendamentos?' + consulta(false));
    if (meu !== pedidoResumo) return;
    resumo = r;
    $('estado').innerHTML = '';
    $('kpis').innerHTML = kpisHTML(r);
    $('grafico-barras').innerHTML = barrasHTML(r);
    roscaHTML(r);
    marcarFiltros();
    $('info-periodo').textContent = `Período: ${dataCurta(periodo.inicio)} a ${dataCurta(periodo.fim)} · Última atualização: ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    $('conteudo').hidden = false;
    // Período válido, mas sem registros: avisa (diferente de erro de validação) e esconde a tabela.
    $('estado').innerHTML = r.total ? '' : '<div class="aviso info"><span>Nenhum dado para o período selecionado.<small>Não foram encontrados agendamentos dentro do intervalo informado.</small></span></div>';
    document.querySelector('.detalhamento').hidden = !r.total;
    if (r.total) carregarItens();
  } catch (x) {
    if (meu !== pedidoResumo) return;
    $('estado').innerHTML = Estados.erro(x, 'data-tentar');
    if (x.status === 401) tratarErro(x);
  } finally {
    if (meu === pedidoResumo) $('btn-gerar').disabled = !!erroDoPeriodo();
  }
}

function iniciar() {
  // Período inicial: este mês.
  aplicarAtalho('mes');
  $('filtro-periodo').addEventListener('submit', gerar);
  // Os atalhos já preenchem as datas e geram o relatório (sem precisar clicar em Gerar).
  document.querySelectorAll('[data-atalho]').forEach(b => b.addEventListener('click', () => { aplicarAtalho(b.dataset.atalho); gerar(); }));
  ['inicio', 'fim'].forEach(id => $(id).addEventListener('input', () => { marcarAtalho(null); validarPeriodo(); })); // data digitada: nenhum atalho fica marcado
  $('btn-exportar').addEventListener('click', exportar);
  $('btn-imprimir').addEventListener('click', () => window.print());

  // Cartões e legenda (status); barras (serviço). Clicar de novo no mesmo item remove o filtro.
  $('conteudo').addEventListener('click', e => {
    const st = e.target.closest('[data-status]');
    if (st) return mudarFiltro({ status: st.dataset.status === filtro.status ? '' : st.dataset.status });
    const sv = e.target.closest('[data-servico]');
    if (sv) { const id = Number(sv.dataset.servico); return mudarFiltro({ servicoId: id === filtro.servicoId ? null : id }); }
    const tirar = e.target.closest('[data-tirar]');
    if (tirar) {
      const o = tirar.dataset.tirar;
      return mudarFiltro(o === 'status' ? { status: '' } : o === 'servico' ? { servicoId: null } : { status: '', servicoId: null });
    }
    const pg = e.target.closest('[data-pg]');
    if (pg && !pg.disabled) { pagina = Number(pg.dataset.pg); carregarItens(); return; }
    if (e.target.closest('[data-recarregar]')) return carregarItens();
    const linha = e.target.closest('.reg.clicavel');
    if (linha) abrirDetalhes(itensDaPagina[Number(linha.dataset.n)]);
  });
  $('conteudo').addEventListener('keydown', e => {
    const linha = e.target.closest('.reg.clicavel');
    if (linha && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); abrirDetalhes(itensDaPagina[Number(linha.dataset.n)]); }
  });
  $('estado').addEventListener('click', e => { if (e.target.closest('[data-tentar]')) gerar(); });
  gerar();
}

if (Auth.exigirPerfil(['funcionario', 'administrador'])) iniciar();
