// Gerenciar usuários (administrador). Usa a API real:
//   GET   /admin/usuarios/busca?busca=&perfil=&situacao=&pagina=&tamanho=   -> lista paginada (5 por página)
//   GET   /admin/usuarios/{id}/detalhes                                    -> painel lateral
//   PATCH /admin/usuarios/{id}/desativar   |   /ativar
//   DELETE /admin/usuarios/{id}            (exclusão permanente; a API recusa se tiver animais ou for a própria conta)
//   GET   /me   (para o administrador não desativar a própria conta)
// Aceita filtros pela URL (vindos do painel): ?perfil=tutor  ou  ?situacao=inativas
const POR_PAGINA = 5;
let estado = { itens: [], pagina: 1, total: 0, totalPaginas: 0 };
let meuId = null;
let ocupado = false;
let ultimaBusca = 0; // descarta respostas antigas quando a pessoa digita rápido

const filtrosAtivos = () => !!($('busca').value.trim() || $('f-perfil').value || $('f-situacao').value);
const dataCadastro = iso => iso.slice(0, 10).split('-').reverse().join('/');
const dataHoraBR = iso => `${iso.slice(0, 10).split('-').reverse().join('/')} às ${iso.slice(11, 16)}`;

// ---------- tabela ----------
function linhaHTML(u) {
  const ehEu = u.id === meuId;
  const alternar = ehEu
    ? '<span class="peq">Sua conta</span>'
    : u.ativo
      ? `<button type="button" class="acao cancelar" data-id="${u.id}" data-acao="desativar">Desativar</button>`
      : `<button type="button" class="acao concluir" data-id="${u.id}" data-acao="ativar">Reativar</button>`;
  return `<article class="reg">
    <strong>${esc(u.nome)}</strong>
    <span class="peq">${esc(u.email)}</span>
    <span><span class="etiqueta">${esc(PERFIL_TEXTO[u.perfil] || u.perfil)}</span></span>
    <span><span class="status ${u.ativo ? 'ativa' : 'inativa'}">${u.ativo ? 'Ativo' : 'Inativo'}</span></span>
    <div class="acoes">
      <button type="button" class="acao detalhes" data-id="${u.id}" data-acao="detalhes">Ver detalhes</button>
      ${alternar}
      ${ehEu ? '' : `<button type="button" class="acao excluir" data-id="${u.id}" data-acao="excluir" aria-label="Excluir ${esc(u.nome)} permanentemente">Excluir</button>`}
    </div>
  </article>`;
}

function renderPaginacao() {
  const { pagina, total, totalPaginas, itens } = estado;
  $('paginacao').hidden = !total;
  if (!total) return;
  const botoes = [`<button type="button" data-pag="${pagina - 1}" aria-label="Página anterior" ${pagina === 1 ? 'disabled' : ''}>‹</button>`];
  for (let n = 1; n <= totalPaginas; n++) {
    botoes.push(`<button type="button" data-pag="${n}" class="${n === pagina ? 'atual' : ''}" ${n === pagina ? 'aria-current="page"' : ''}>${n}</button>`);
  }
  botoes.push(`<button type="button" data-pag="${pagina + 1}" aria-label="Próxima página" ${pagina === totalPaginas ? 'disabled' : ''}>›</button>`);
  $('paginas').innerHTML = botoes.join('');
  const ini = (pagina - 1) * POR_PAGINA + 1;
  $('contagem').textContent = `Mostrando ${ini} a ${ini + itens.length - 1} de ${total} registro${total === 1 ? '' : 's'}`;
}

function render() {
  const { itens, total } = estado;
  if (!itens.length) {
    // três situações diferentes: nada cadastrado, busca sem resultado (erro tem a sua própria mensagem)
    // Nada cadastrado x pesquisa sem resultado (esta oferece limpar os filtros).
    $('lista').innerHTML = !total && !filtrosAtivos()
      ? Estados.vazio({ icone: '', titulo: 'Nenhum usuário cadastrado.', texto: 'Os usuários aparecerão aqui assim que forem registrados no sistema.' })
      : Estados.vazio({ icone: '', titulo: 'Nenhum usuário encontrado.', texto: 'Nenhum usuário corresponde aos filtros escolhidos.', botao: { texto: 'Limpar filtros', attr: 'data-limpar' } });
  } else {
    $('lista').innerHTML = '<div class="cab" aria-hidden="true"><span>Nome</span><span>E-mail</span><span>Perfil</span><span>Situação</span><span>Ações</span></div>'
      + itens.map(linhaHTML).join('');
  }
  renderPaginacao();
}

async function carregar(pagina = estado.pagina) {
  const minha = ++ultimaBusca;
  $('lista').innerHTML = '<p class="carregando">Carregando usuários...</p>';
  const p = new URLSearchParams({ pagina, tamanho: POR_PAGINA });
  const termo = $('busca').value.trim();
  if (termo) p.set('busca', termo);
  if ($('f-perfil').value) p.set('perfil', $('f-perfil').value);
  if ($('f-situacao').value) p.set('situacao', $('f-situacao').value);
  try {
    if (meuId === null) meuId = (await api('/me')).id;
    const r = await api('/admin/usuarios/busca?' + p);
    if (minha !== ultimaBusca) return;
    // Se a página atual ficou vazia (ex.: desativou o último da página 2), volta para a última existente.
    if (!r.itens.length && r.total && pagina > 1) return carregar(r.total_paginas);
    estado = { itens: r.itens, pagina: r.pagina, total: r.total, totalPaginas: r.total_paginas };
    render();
  } catch (x) {
    if (minha !== ultimaBusca) return;
    estado = { itens: [], pagina: 1, total: 0, totalPaginas: 0 };
    $('paginacao').hidden = true;
    $('lista').innerHTML = Estados.erro(x, 'id="btn-tentar"');
    tratarErro(x);
  }
}

// ---------- painel de detalhes ----------
async function verDetalhes(id) {
  const dlg = $('dlg-detalhes');
  $('det-corpo').innerHTML = '<p class="carregando">Carregando...</p>';
  if (!dlg.open) dlg.showModal();
  try {
    const u = await api(`/admin/usuarios/${id}/detalhes`);
    const ags = u.ultimos_agendamentos.map(a => {
      const st = STATUS[a.status] || { texto: a.status, classe: '' };
      return `<li><span><strong>${esc(a.servico_nome)} - ${esc(a.animal_nome)}</strong><small>${dataHoraBR(a.data_hora)}</small></span>
        <span class="status ${st.classe}">${esc(st.texto)}</span></li>`;
    }).join('');
    $('det-corpo').innerHTML = `
      <div class="det-topo"><div class="avatar">${esc(u.nome.charAt(0).toUpperCase())}</div>
        <div><strong>${esc(u.nome)}</strong><span>${esc(u.email)}</span></div></div>
      <dl class="dados">
        <dt>Perfil:</dt><dd><span class="etiqueta">${esc(PERFIL_TEXTO[u.perfil] || u.perfil)}</span></dd>
        <dt>Situação:</dt><dd><span class="status ${u.ativo ? 'ativa' : 'inativa'}">${u.ativo ? 'Ativo' : 'Inativo'}</span></dd>
        <dt>Telefone:</dt><dd>${u.telefone ? esc(u.telefone) : '—'}</dd>
        <dt>Cadastro:</dt><dd>${dataCadastro(u.data_cadastro)}</dd>
      </dl>
      <h3>Últimos agendamentos</h3>
      ${ags ? `<ul class="lista-ag">${ags}</ul>` : '<p class="sub">Nenhum agendamento.</p>'}`;
  } catch (x) {
    dlg.close();
    tratarErro(x);
  }
}

// ---------- desativar / reativar (com confirmação) ----------
async function alterar(id, acao) {
  if (ocupado) return;
  const u = estado.itens.find(x => x.id === id);
  if (!u) return;
  let ok;
  if (acao === 'desativar') {
    // Aviso extra se o usuário ainda tem agendamentos por vir (eles NÃO são cancelados).
    let aviso = '';
    try {
      const d = await api(`/admin/usuarios/${id}/detalhes`);
      if (d.agendamentos_futuros) aviso = ` Atenção: há ${d.agendamentos_futuros} agendamento(s) futuro(s); eles não serão cancelados automaticamente.`;
    } catch { /* o aviso é só um extra: se falhar, segue sem ele */ }
    ok = await perguntar({ titulo: 'Desativar conta?', texto: `${u.nome} não conseguirá mais entrar no sistema. O histórico é mantido.${aviso}`, rotulo: 'Desativar' });
  } else {
    ok = await perguntar({ titulo: 'Reativar conta?', texto: `${u.nome} voltará a ter acesso ao sistema.`, rotulo: 'Reativar' });
  }
  if (!ok) return;
  ocupado = true;
  $('lista').classList.add('ocupada');
  try {
    await api(`/admin/usuarios/${id}/${acao}`, { method: 'PATCH' });
    mostrarMensagem('sucesso', acao === 'desativar' ? 'Usuário desativado com sucesso!' : 'Usuário reativado com sucesso!');
    await carregar(); // recarrega do servidor: nada aparece como concluído sem a resposta da API
  } catch (x) {
    tratarErro(x);
  } finally {
    ocupado = false;
    $('lista').classList.remove('ocupada');
  }
}

// ---------- excluir permanentemente ----------
function confirmarExclusao(u) {
  const dlg = $('dlg-excluir');
  $('exc-nome').textContent = `${u.nome} (${u.email})`;
  // Troca de gerente: excluir o administrador antigo. Quem exclui continua como administrador.
  $('exc-aviso-admin').hidden = u.perfil !== 'administrador';
  dlg.returnValue = '';
  dlg.showModal();
  return new Promise(resolver => dlg.addEventListener('close', () => resolver(dlg.returnValue === 'ok'), { once: true }));
}

async function excluir(id) {
  if (ocupado) return;
  const u = estado.itens.find(x => x.id === id);
  if (!u || !(await confirmarExclusao(u))) return;
  ocupado = true;
  $('lista').classList.add('ocupada');
  try {
    await api(`/admin/usuarios/${id}`, { method: 'DELETE' }); // 204: sem corpo
    mostrarMensagem('sucesso', 'Usuário excluído permanentemente.');
    await carregar();
  } catch (x) {
    // 409 = tem animais (use Desativar); 404 = já foi excluído por outra pessoa
    if (x.status === 401) tratarErro(x); else mostrarMensagem('erro', x.message);
    if (x.status === 404) await carregar();
  } finally {
    ocupado = false;
    $('lista').classList.remove('ocupada');
  }
}

// ---------- início ----------
function iniciar() {
  const params = new URLSearchParams(location.search);
  if (PERFIL_TEXTO[params.get('perfil')]) $('f-perfil').value = params.get('perfil');
  if (['ativas', 'inativas'].includes(params.get('situacao'))) $('f-situacao').value = params.get('situacao');

  let espera;
  $('filtros').addEventListener('submit', e => e.preventDefault());
  $('busca').addEventListener('input', () => { clearTimeout(espera); espera = setTimeout(() => carregar(1), 350); });
  ['f-perfil', 'f-situacao'].forEach(id => $(id).addEventListener('change', () => carregar(1)));
  $('btn-atualizar').addEventListener('click', () => carregar()); // mantém filtros e página
  $('lista').addEventListener('click', e => {
    if (e.target.id === 'btn-tentar') return carregar();
    if (e.target.closest('[data-limpar]')) { $('busca').value = ''; $('f-perfil').value = ''; $('f-situacao').value = ''; return carregar(1); }
    const b = e.target.closest('[data-acao]');
    if (!b) return;
    const id = Number(b.dataset.id);
    if (b.dataset.acao === 'detalhes') verDetalhes(id);
    else if (b.dataset.acao === 'excluir') excluir(id);
    else alterar(id, b.dataset.acao);
  });
  $('paginas').addEventListener('click', e => {
    const b = e.target.closest('[data-pag]');
    if (b && !b.disabled) carregar(Number(b.dataset.pag));
  });
  $('det-fechar').addEventListener('click', () => $('dlg-detalhes').close());
  $('dlg-detalhes').addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.close(); }); // clique fora fecha
  carregar(1);
}

if (Auth.exigirPerfil(['administrador'])) iniciar();
