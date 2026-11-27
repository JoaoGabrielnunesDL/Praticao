// Gerenciar serviços (somente administrador). Usa a API real:
//   GET   /servicos?todos=true          (ativos e inativos)
//   POST  /servicos   |   PUT /servicos/{id}   corpo: nome, descricao, preco, duracao_min
//   PATCH /servicos/{id}/desativar  |  /ativar
//   DELETE /servicos/{id}           (exclusão permanente; a API recusa se houver agendamentos)
// Desativar não apaga nada: o serviço só deixa de aparecer para novos agendamentos.
// Excluir apaga de vez, por isso pede confirmação.
let servicos = [];
let carregou = false;       // false = ainda carregando ou falhou
let editandoId = null;      // null = cadastrando um novo
let salvando = false;
let ocupado = false;        // trava cliques repetidos em desativar/reativar
let origemFoco = null;      // botão que abriu o painel (o foco volta para ele)

const mobile = () => matchMedia('(max-width: 800px)').matches;
const normalizar = t => String(t ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

// ---------- lista ----------
function filtrados() {
  const termo = normalizar($('busca').value);
  const situacao = $('f-status').value;
  return servicos.filter(s =>
    (!termo || normalizar(s.nome).includes(termo)) &&
    (!situacao || (situacao === 'ativos' ? s.ativo : !s.ativo)));
}

function linhaHTML(s) {
  const nome = esc(s.nome);
  const botao = s.ativo
    ? `<button type="button" class="acao cancelar" data-acao="desativar" data-id="${s.id}" aria-label="Desativar ${nome}">Desativar</button>`
    : `<button type="button" class="acao concluir" data-acao="ativar" data-id="${s.id}" aria-label="Reativar ${nome}">Reativar</button>`;
  return `<article class="reg${s.ativo ? '' : ' desativado'}${s.id === editandoId ? ' selecionado' : ''}">
    <strong>${nome}</strong>
    <span class="peq">${s.descricao ? esc(s.descricao) : '—'}</span>
    <span><span class="rot">Preço:</span>${moeda(s.preco)}</span>
    <span><span class="rot">Duração:</span>${s.duracao_min} min</span>
    <span><span class="status ${s.ativo ? 'ativa' : 'inativa'}">${s.ativo ? '✓ Ativo' : '○ Inativo'}</span></span>
    <div class="acoes">
      <button type="button" class="acao confirmar" data-acao="editar" data-id="${s.id}" aria-label="Editar ${nome}">Editar</button>
      ${botao}
      <button type="button" class="acao excluir" data-acao="excluir" data-id="${s.id}" aria-label="Excluir ${nome} permanentemente">Excluir</button>
    </div>
  </article>`;
}

function render() {
  const lista = filtrados();
  const total = servicos.length;
  $('contagem').textContent = !total ? ''
    : lista.length === total ? `${total} ${total === 1 ? 'registro' : 'registros'}`
    : `Mostrando ${lista.length} de ${total} serviços.`;

  if (!total) {
    $('lista').innerHTML = `<div class="vazio"><span>✂️</span>Nenhum serviço cadastrado
      <p class="sub">Comece adicionando um novo serviço para a sua loja.</p>
      <button type="button" class="btn btn-laranja" data-acao="novo">+ Novo serviço</button></div>`;
  } else if (!lista.length) {
    $('lista').innerHTML = `<div class="vazio"><span>🔎</span>Nenhum serviço encontrado
      <p class="sub">Não encontramos serviços com esse nome. Verifique a pesquisa ou limpe os filtros.</p>
      <button type="button" class="btn btn-contorno" data-acao="limpar">Limpar filtros</button></div>`;
  } else {
    $('lista').innerHTML = '<div class="cab" aria-hidden="true"><span>Nome</span><span>Descrição</span><span>Preço</span><span>Duração</span><span>Status</span><span>Ações</span></div>'
      + lista.map(linhaHTML).join('');
  }
}

async function carregar() {
  carregou = false;
  $('contagem').textContent = '';
  $('lista').innerHTML = '<div class="esqueleto"></div>'.repeat(3) + '<p class="sr-only carregando">Carregando serviços...</p>';
  try {
    servicos = await api('/servicos?todos=true');
    carregou = true;
    render();
  } catch (x) {
    $('lista').innerHTML = `<div class="vazio"><span>⚠️</span>Não foi possível carregar os serviços
      <p class="sub">${esc(x.message)}</p>
      <button type="button" class="btn btn-laranja" data-acao="recarregar">Tentar novamente</button></div>`;
    if (x.status === 401) tratarErro(x);
  }
}

// ---------- mensagens ----------
function avisar(tipo, texto) {
  mostrarMensagem(tipo, texto);
  $('mensagem').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ---------- painel de cadastro/edição ----------
function limparErrosCampos() {
  ['nome', 'preco', 'duracao'].forEach(c => { $('e-' + c).textContent = ''; $('s-' + c).closest('.campo').classList.remove('invalido'); });
  $('serv-erro').hidden = true;
}

function erroCampo(campo, texto) {
  $('e-' + campo).textContent = texto;
  $('s-' + campo).closest('.campo').classList.add('invalido');
}

function abrirPainel(servico, gatilho) {
  const f = $('form-servico');
  editandoId = servico ? servico.id : null;
  origemFoco = gatilho || null;
  limparErrosCampos();
  $('serv-titulo').textContent = servico ? 'Editar serviço' : 'Cadastrar serviço';
  $('serv-salvar').textContent = servico ? 'Salvar alterações' : 'Salvar serviço';
  f.nome.value = servico ? servico.nome : '';
  f.descricao.value = servico ? servico.descricao : '';
  f.preco.value = servico ? Number(servico.preco).toFixed(2).replace('.', ',') : '';
  f.duracao.value = servico ? servico.duracao_min : '';
  $('desc-cont').textContent = f.descricao.value.length;
  $('painel').hidden = false;
  $('area').classList.add('com-painel');
  if (mobile()) { document.body.classList.add('painel-aberto'); $('painel').scrollTop = 0; }
  render();
  f.nome.focus();
}

function fecharPainel() {
  editandoId = null;
  $('painel').hidden = true;
  $('area').classList.remove('com-painel');
  document.body.classList.remove('painel-aberto');
  render();
  if (origemFoco && document.contains(origemFoco)) origemFoco.focus(); else $('btn-novo').focus();
  origemFoco = null;
}

// Aceita "60", "60,5", "60.50" e "1.200,50". Devolve NaN se não for um número válido.
function lerPreco(texto) {
  let t = texto.replace(/^R\$\s*/i, '').replace(/\s/g, '');
  if (!/^[\d.,]+$/.test(t)) return NaN;
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  return /^\d+(\.\d{1,2})?$/.test(t) ? Number(t) : NaN;
}

// Valida no navegador (a API valida de novo). Devolve o corpo da requisição ou null.
function validar() {
  const f = $('form-servico');
  limparErrosCampos();
  const nome = f.nome.value.trim();
  const preco = lerPreco(f.preco.value.trim());
  const duracaoTxt = f.duracao.value.trim();
  const duracao = /^\d+$/.test(duracaoTxt) ? Number(duracaoTxt) : NaN;
  let primeiro = null;
  const falha = (campo, msg) => { erroCampo(campo, msg); primeiro = primeiro || f[campo]; };

  if (nome.length < 2) falha('nome', nome ? 'O nome precisa ter ao menos 2 letras.' : 'Informe o nome do serviço.');
  if (!f.preco.value.trim()) falha('preco', 'Informe o preço.');
  else if (Number.isNaN(preco)) falha('preco', 'Digite um valor válido, como 60,00.');
  else if (preco <= 0) falha('preco', 'O preço deve ser maior que zero.');
  else if (preco > 99999.99) falha('preco', 'O preço máximo é R$ 99.999,99.');
  if (!duracaoTxt) falha('duracao', 'Informe a duração.');
  else if (Number.isNaN(duracao) || duracao <= 0) falha('duracao', 'Digite os minutos em número inteiro, como 60.');
  else if (duracao > 1440) falha('duracao', 'A duração máxima é 1440 minutos.');

  if (primeiro) { primeiro.focus(); return null; }
  return { nome, descricao: f.descricao.value.trim(), preco, duracao_min: duracao };
}

async function salvar(e) {
  e.preventDefault();
  if (salvando) return;
  const corpo = validar();
  if (!corpo) return;
  const edicao = editandoId !== null;
  salvando = true;
  $('serv-salvar').disabled = true;
  $('serv-salvar').textContent = 'Salvando...';
  try {
    const salvo = await api(edicao ? `/servicos/${editandoId}` : '/servicos', {
      method: edicao ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
    });
    servicos = edicao ? servicos.map(s => (s.id === salvo.id ? salvo : s)) : [...servicos, salvo];
    fecharPainel();
    avisar('sucesso', edicao ? 'Serviço atualizado com sucesso!' : 'Serviço cadastrado com sucesso!');
  } catch (x) {
    // Em qualquer erro o painel continua aberto, com os dados digitados.
    if (x.status === 401) tratarErro(x);
    else if (x.status === 409) erroCampo('nome', x.message);
    else if (x.status === 403 || x.status === 404) { fecharPainel(); avisar('erro', x.message); carregar(); }
    else {
      $('serv-erro').textContent = x.status ? 'Não foi possível salvar o serviço. ' + x.message : x.message;
      $('serv-erro').hidden = false;
    }
  } finally {
    salvando = false;
    $('serv-salvar').disabled = false;
    $('serv-salvar').textContent = editandoId !== null ? 'Salvar alterações' : 'Salvar serviço';
  }
}

// ---------- desativar / reativar ----------
function confirmarDesativacao(servico) {
  const dlg = $('dlg-desativar');
  $('des-nome').textContent = servico.nome;
  dlg.returnValue = '';
  dlg.showModal();
  return new Promise(resolver => dlg.addEventListener('close', () => resolver(dlg.returnValue === 'ok'), { once: true }));
}

// ---------- excluir permanentemente ----------
function confirmarExclusao(servico) {
  const dlg = $('dlg-excluir');
  $('exc-nome').textContent = servico.nome;
  dlg.returnValue = '';
  dlg.showModal();
  return new Promise(resolver => dlg.addEventListener('close', () => resolver(dlg.returnValue === 'ok'), { once: true }));
}

async function excluirServico(id) {
  if (ocupado) return;
  const s = servicos.find(x => x.id === id);
  if (!s || !(await confirmarExclusao(s))) return;
  ocupado = true;
  $('lista').classList.add('ocupada');
  try {
    await api(`/servicos/${id}`, { method: 'DELETE' }); // 204: sem corpo
    servicos = servicos.filter(x => x.id !== id);
    if (editandoId === id) fecharPainel();
    render();
    avisar('sucesso', 'Serviço excluído permanentemente.');
  } catch (x) {
    // 409 = tem agendamentos; 404 = já tinha sido excluído por outra pessoa (recarrega a lista)
    if (x.status === 401) tratarErro(x); else avisar('erro', x.message);
    if (x.status === 404) carregar();
  } finally {
    ocupado = false;
    $('lista').classList.remove('ocupada');
  }
}

async function alterarSituacao(id, acao) {
  if (ocupado) return;
  const s = servicos.find(x => x.id === id);
  if (!s) return;
  if (acao === 'desativar' && !(await confirmarDesativacao(s))) return;
  ocupado = true;
  $('lista').classList.add('ocupada');
  try {
    const novo = await api(`/servicos/${id}/${acao}`, { method: 'PATCH' });
    servicos = servicos.map(x => (x.id === id ? novo : x));
    render();
    avisar('sucesso', acao === 'desativar' ? 'Serviço desativado com sucesso!' : 'Serviço reativado com sucesso!');
  } catch (x) {
    tratarErro(x);
  } finally {
    ocupado = false;
    $('lista').classList.remove('ocupada');
  }
}

function limparFiltros() {
  $('busca').value = '';
  $('f-status').value = '';
  render();
}

function iniciar() {
  $('btn-novo').addEventListener('click', e => abrirPainel(null, e.currentTarget));
  $('serv-cancelar').addEventListener('click', fecharPainel);
  $('serv-voltar').addEventListener('click', fecharPainel);
  $('form-servico').addEventListener('submit', salvar);
  $('s-desc').addEventListener('input', () => { $('desc-cont').textContent = $('s-desc').value.length; });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !$('painel').hidden && !$('dlg-desativar').open && !$('dlg-excluir').open) fecharPainel();
  });

  $('filtros').addEventListener('submit', e => e.preventDefault());
  ['busca', 'f-status'].forEach(id => $(id).addEventListener('input', () => carregou && render()));
  $('btn-limpar').addEventListener('click', () => carregou && limparFiltros());

  $('lista').addEventListener('click', e => {
    const b = e.target.closest('[data-acao]');
    if (!b) return;
    const id = Number(b.dataset.id);
    switch (b.dataset.acao) {
      case 'editar': abrirPainel(servicos.find(s => s.id === id), b); break;
      case 'novo': abrirPainel(null, b); break;
      case 'limpar': limparFiltros(); break;
      case 'recarregar': carregar(); break;
      case 'excluir': excluirServico(id); break;
      default: alterarSituacao(id, b.dataset.acao); // desativar | ativar
    }
  });
  carregar();
}

// Só o administrador entra aqui (a API também recusa as outras contas).
if (Auth.exigirPerfil(['administrador'])) iniciar();
