// Área de conta e controles globais do cabeçalho.
(function () {
  const MODO_NOME_HEADER = 'primeiro_ultimo';
  const PAGINA_LOGIN = 'login.html';
  const DESTINO_PERFIL = 'perfil.html';
  const CHAVE_FONTE = 'tamanhoFonte';
  const TAMANHOS_FONTE = { menor: 87.5, normal: 100, maior: 125 };
  const slot = document.querySelector('[data-auth-slot]');
  const botaoMenu = document.getElementById('botao-menu');
  const menuMobile = document.getElementById('menu-mobile');
  const aviso = document.getElementById('aviso-cabecalho');
  const cabecalho = document.querySelector('.cabecalho');

  function nomeApresentacao(nome) {
    const partes = (nome || '').trim().split(/\s+/).filter(Boolean);
    if (!partes.length) return 'Usuário';
    if (MODO_NOME_HEADER === 'primeiro') return partes[0];
    const conectores = ['de', 'da', 'do', 'das', 'dos', 'e'];
    const sobrenomes = partes.slice(1).filter(function (p) { return conectores.indexOf(p.toLowerCase()) === -1; });
    return partes[0] + (sobrenomes.length ? ' ' + sobrenomes[sobrenomes.length - 1] : '');
  }
  function iniciais(nome) {
    const partes = (nome || '').trim().split(/\s+/).filter(Boolean);
    const conectores = ['de', 'da', 'do', 'das', 'dos', 'e'];
    const final = partes.slice(1).filter(function (p) { return conectores.indexOf(p.toLowerCase()) === -1; }).pop();
    return ((partes[0] || '?')[0] + (final ? final[0] : '')).toLocaleUpperCase('pt-BR');
  }
  function renderizarSessao() {
    if (!slot) return;
    slot.replaceChildren();
    const usuario = auth.getUsuario();
    if (!auth.getToken() || !usuario) {
      const link = document.createElement('a');
      link.href = PAGINA_LOGIN;
      link.className = 'btn-sessao';
      link.textContent = 'Entrar / Cadastrar';
      slot.appendChild(link);
      return;
    }
    const area = document.createElement('div');
    area.className = 'usuario-menu';
    const gatilho = document.createElement('button');
    gatilho.type = 'button'; gatilho.className = 'usuario-menu__gatilho';
    gatilho.setAttribute('aria-haspopup', 'menu'); gatilho.setAttribute('aria-expanded', 'false');
    const avatar = document.createElement('span'); avatar.className = 'usuario-menu__avatar'; avatar.textContent = iniciais(usuario.nome); avatar.setAttribute('aria-hidden', 'true');
    const nome = document.createElement('span'); nome.className = 'usuario-menu__nome'; nome.title = usuario.nome || '';
    function ajustarNome() { nome.textContent = window.matchMedia('(max-width: 639px)').matches ? (usuario.nome || '').trim().split(/\s+/)[0] || 'Usuário' : nomeApresentacao(usuario.nome); }
    ajustarNome();
    const seta = document.createElement('span'); seta.className = 'usuario-menu__seta'; seta.setAttribute('aria-hidden', 'true'); seta.textContent = '⌄';
    gatilho.append(avatar, nome, seta);
    const menu = document.createElement('div'); menu.className = 'usuario-menu__painel'; menu.setAttribute('role', 'menu'); menu.hidden = true;
    const nomeCompleto = document.createElement('div'); nomeCompleto.className = 'usuario-menu__completo'; nomeCompleto.textContent = usuario.nome || ''; nomeCompleto.setAttribute('role', 'presentation');
    const perfil = document.createElement('a'); perfil.href = DESTINO_PERFIL; perfil.setAttribute('role', 'menuitem'); perfil.tabIndex = -1;
    const icone = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); icone.setAttribute('viewBox', '0 0 24 24'); icone.setAttribute('aria-hidden', 'true');
    const cabeca = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); cabeca.setAttribute('cx', '12'); cabeca.setAttribute('cy', '8'); cabeca.setAttribute('r', '3.5');
    const corpo = document.createElementNS('http://www.w3.org/2000/svg', 'path'); corpo.setAttribute('d', 'M5 20c.5-3.4 3-5.2 7-5.2s6.5 1.8 7 5.2'); icone.append(cabeca, corpo);
    const textoPerfil = document.createElement('span'); textoPerfil.textContent = 'Ver meu perfil'; perfil.append(icone, textoPerfil);
    const divisor = document.createElement('div'); divisor.className = 'usuario-menu__divisor'; divisor.setAttribute('role', 'separator');
    const sair = document.createElement('button'); sair.type = 'button'; sair.setAttribute('role', 'menuitem'); sair.tabIndex = -1; sair.textContent = 'Sair';
    menu.append(nomeCompleto, perfil, divisor, sair); area.append(gatilho, menu); slot.appendChild(area);
    function fechar(devolverFoco) { menu.hidden = true; gatilho.setAttribute('aria-expanded', 'false'); if (devolverFoco) gatilho.focus(); }
    function abrir() { menu.hidden = false; gatilho.setAttribute('aria-expanded', 'true'); perfil.focus(); }
    gatilho.addEventListener('click', function () { menu.hidden ? abrir() : fechar(false); });
    gatilho.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); menu.hidden ? abrir() : fechar(false); } });
    menu.addEventListener('keydown', function (e) {
      const itens = [perfil, sair]; const i = itens.indexOf(document.activeElement);
      if (e.key === 'Escape') { e.preventDefault(); fechar(true); }
      else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); itens[(i + (e.key === 'ArrowDown' ? 1 : itens.length - 1)) % itens.length].focus(); }
      else if (e.key === 'Tab') fechar(false);
    });
    document.addEventListener('click', function fora(e) { if (!area.contains(e.target)) { fechar(false); } });
    perfil.addEventListener('click', function () { fechar(false); });
    sair.addEventListener('click', function () { auth.sair(); });
  }

  function validarSessao() {
    const token = auth.getToken();
    if (!token) return;
    fetch('/me', { headers: { Authorization: 'Bearer ' + token } }).then(function (r) {
      if (r.status === 401) { auth.limparSessao(); return null; }
      if (!r.ok) return null;
      return api.lerJsonSeguro(r);
    }).then(function (usuario) { if (usuario) auth.salvarSessao(token, usuario); }).catch(function () {});
  }
  function aplicarFonte(tamanho) { document.documentElement.style.fontSize = TAMANHOS_FONTE[tamanho] + '%'; try { localStorage.setItem(CHAVE_FONTE, tamanho); } catch (_) {} }
  try { const f = localStorage.getItem(CHAVE_FONTE); if (TAMANHOS_FONTE[f]) aplicarFonte(f); } catch (_) {}
  document.querySelectorAll('[data-fonte]').forEach(function (b) { b.addEventListener('click', function () { aplicarFonte(b.dataset.fonte); }); });
  document.querySelectorAll('[data-area]').forEach(function (link) {
    link.addEventListener('click', function (e) { e.preventDefault(); if (!auth.estaLogado()) window.location.href = PAGINA_LOGIN; else if (aviso) { aviso.textContent = 'Esta área estará disponível em breve.'; aviso.hidden = false; setTimeout(function () { aviso.hidden = true; }, 3500); } });
  });
  if (botaoMenu && menuMobile) {
    function abrirMobile(abrir) { menuMobile.hidden = !abrir; botaoMenu.setAttribute('aria-expanded', String(abrir)); }
    botaoMenu.addEventListener('click', function () { abrirMobile(menuMobile.hidden); });
    menuMobile.addEventListener('click', function (e) { if (e.target.closest('a')) abrirMobile(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menuMobile.hidden) { abrirMobile(false); botaoMenu.focus(); } });
  }
  if (cabecalho) window.addEventListener('scroll', function () { cabecalho.classList.toggle('cabecalho--rolado', window.scrollY > 4); }, { passive: true });
  renderizarSessao();
  window.addEventListener('sessao-atualizada', renderizarSessao);
  window.addEventListener('sessao-invalida', renderizarSessao);
  validarSessao();
})();
