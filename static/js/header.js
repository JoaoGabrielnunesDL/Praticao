// Cabeçalho compartilhado: sessão, navegação por perfil e controles globais.
(function () {
  const PAGINA_LOGIN = 'login.html';
  const MENU_POR_PERFIL = {
    tutor: [
      { texto: 'Painel', href: 'tutor.html' },
      { texto: 'Meus animais', href: 'animais.html' },
      { texto: 'Novo agendamento', href: 'agendar.html' },
      { texto: 'Meus agendamentos' },
      { texto: 'Serviços', href: 'servicos.html' },
      { texto: 'Perfil', href: 'perfil.html' }
    ],
    funcionario: [
      { texto: 'Agenda' },
      { texto: 'Gerenciar serviços' },
      { texto: 'Relatórios' },
      { texto: 'Perfil', href: 'perfil.html' }
    ],
    administrador: [
      { texto: 'Visão geral' },
      { texto: 'Usuários' },
      { texto: 'Agenda' },
      { texto: 'Serviços' },
      { texto: 'Relatórios' },
      { texto: 'Perfil', href: 'perfil.html' }
    ]
  };
  const CHAVE_FONTE = 'tamanhoFonte';
  const TAMANHOS_FONTE = { menor: 87.5, normal: 100, maior: 125 };
  const slot = document.querySelector('[data-auth-slot]');
  const botaoMenu = document.getElementById('botao-menu');
  const menuMobile = document.getElementById('menu-mobile');
  const aviso = document.getElementById('aviso-cabecalho');
  const cabecalho = document.querySelector('.cabecalho');
  const navDesktop = document.querySelector('.menu-principal');
  const menusOriginais = [navDesktop, menuMobile].filter(Boolean).map(function (nav) { return { elemento: nav, html: nav.innerHTML, label: nav.getAttribute('aria-label') }; });

  function nomeApresentacao(nome) {
    const partes = (nome || '').trim().split(/\s+/).filter(Boolean);
    if (!partes.length) return 'Usuário';
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
  function linkMenu(href, texto, atual) {
    const link = document.createElement('a'); link.href = href; link.textContent = texto;
    if (atual) link.setAttribute('aria-current', 'page');
    return link;
  }
  function renderizarMenus() {
    const usuario = auth.getUsuario();
    document.querySelectorAll('[data-area]').forEach(function (link) {
      link.hidden = Boolean(usuario && usuario.perfil === 'tutor' && link.dataset.area === 'funcionario');
    });
    if (!auth.getToken() || !usuario) {
      menusOriginais.forEach(function (item) { item.elemento.innerHTML = item.html; item.elemento.setAttribute('aria-label', item.label || 'Menu principal'); });
      ajustarCtaHome(null);
      return;
    }
    const itens = MENU_POR_PERFIL[usuario.perfil] || [{ texto: 'Perfil', href: 'perfil.html' }];
    const itensNav = usuario.perfil === 'tutor'
      ? itens.filter(function (dados) { return Boolean(dados.href); })
      : [{ texto: 'Início', href: 'index.html#inicio' }, { texto: 'Perfil', href: 'perfil.html' }];
    const pagina = location.pathname.split('/').pop() || 'index.html';
    menusOriginais.forEach(function (item) {
      item.elemento.replaceChildren();
      itensNav.forEach(function (dados) { item.elemento.appendChild(linkMenu(dados.href, dados.texto, dados.href.split('#')[0] === pagina)); });
      item.elemento.setAttribute('aria-label', usuario.perfil === 'tutor' ? 'Menu do Tutor' : 'Menu do usuário');
    });
    ajustarCtaHome(usuario);
  }
  function ajustarCtaHome(usuario) {
    const cta = document.querySelector('[data-cta-home]');
    if (!cta) return;
    if (usuario && usuario.perfil === 'tutor') { cta.href = 'animais.html'; cta.firstChild.textContent = 'Meus animais '; }
    else if (usuario && (usuario.perfil === 'funcionario' || usuario.perfil === 'administrador')) { cta.href = '#servicos'; cta.firstChild.textContent = 'Conheça nossos serviços '; }
    else { cta.href = '#agendamento'; cta.firstChild.textContent = 'Agendar Banho & Tosa '; }
  }
  function renderizarSessao() {
    if (slot) {
      slot.replaceChildren();
      const usuario = auth.getUsuario();
      if (!auth.getToken() || !usuario) {
        const link = document.createElement('a'); link.href = PAGINA_LOGIN; link.className = 'btn-sessao'; link.textContent = 'Entrar / Cadastrar'; slot.appendChild(link);
      } else {
        const area = document.createElement('div'); area.className = 'usuario-menu';
        const gatilho = document.createElement('button'); gatilho.type = 'button'; gatilho.className = 'usuario-menu__gatilho';
        gatilho.setAttribute('aria-haspopup', 'menu'); gatilho.setAttribute('aria-expanded', 'false');
        const avatar = document.createElement('span'); avatar.className = 'usuario-menu__avatar'; avatar.textContent = iniciais(usuario.nome); avatar.setAttribute('aria-hidden', 'true');
        const nome = document.createElement('span'); nome.className = 'usuario-menu__nome'; nome.title = usuario.nome || '';
        function ajustarNome() { nome.textContent = matchMedia('(max-width: 639px)').matches ? (usuario.nome || '').trim().split(/\s+/)[0] || 'Usuário' : nomeApresentacao(usuario.nome); }
        ajustarNome();
        const seta = document.createElement('span'); seta.className = 'usuario-menu__seta'; seta.setAttribute('aria-hidden', 'true'); seta.textContent = '⌄';
        gatilho.append(avatar, nome, seta);
        const menu = document.createElement('div'); menu.className = 'usuario-menu__painel'; menu.setAttribute('role', 'menu'); menu.hidden = true;
        const nomeCompleto = document.createElement('div'); nomeCompleto.className = 'usuario-menu__completo'; nomeCompleto.textContent = usuario.nome || ''; nomeCompleto.setAttribute('role', 'presentation');
        menu.appendChild(nomeCompleto);
        const itensPerfil = MENU_POR_PERFIL[usuario.perfil] || [{ texto: 'Perfil', href: 'perfil.html' }];
        const controles = [];
        itensPerfil.forEach(function (dados) {
          const item = document.createElement(dados.href ? 'a' : 'button');
          if (dados.href) item.href = dados.href;
          else { item.type = 'button'; item.dataset.menuIndisponivel = 'true'; }
          item.className = 'usuario-menu__item'; item.setAttribute('role', 'menuitem'); item.tabIndex = -1; item.textContent = dados.texto;
          menu.appendChild(item); controles.push(item);
        });
        const divisor = document.createElement('div'); divisor.className = 'usuario-menu__divisor'; divisor.setAttribute('role', 'separator');
        const sair = document.createElement('button'); sair.type = 'button'; sair.className = 'usuario-menu__item'; sair.setAttribute('role', 'menuitem'); sair.tabIndex = -1; sair.textContent = 'Sair';
        menu.append(divisor, sair);
        controles.push(sair); area.append(gatilho, menu); slot.appendChild(area);
        function fechar(devolverFoco) { menu.hidden = true; gatilho.setAttribute('aria-expanded', 'false'); if (devolverFoco) gatilho.focus(); }
        function abrir() { menu.hidden = false; gatilho.setAttribute('aria-expanded', 'true'); controles[0].focus(); }
        gatilho.addEventListener('click', function () { menu.hidden ? abrir() : fechar(false); });
        menu.addEventListener('keydown', function (e) {
          const i = controles.indexOf(document.activeElement);
          if (e.key === 'Escape') { e.preventDefault(); fechar(true); }
          else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); controles[(i + (e.key === 'ArrowDown' ? 1 : controles.length - 1)) % controles.length].focus(); }
          else if (e.key === 'Home') { e.preventDefault(); controles[0].focus(); }
          else if (e.key === 'End') { e.preventDefault(); controles[controles.length - 1].focus(); }
          else if (e.key === 'Tab') fechar(false);
        });
        document.addEventListener('click', function fora(e) { if (!area.contains(e.target)) fechar(false); });
        menu.addEventListener('click', function (e) {
          const indisponivel = e.target.closest('[data-menu-indisponivel]');
          if (!indisponivel) return;
          e.preventDefault(); fechar(false);
          if (window.ui) window.ui.mostrarInformacao('Esta área ainda não está disponível.');
          else if (aviso) { aviso.textContent = 'Esta área ainda não está disponível.'; aviso.hidden = false; }
        });
        menu.addEventListener('click', function (e) { if (e.target.closest('a')) fechar(false); });
        sair.addEventListener('click', function () { auth.sair(); });
      }
    }
    renderizarMenus();
  }
  function validarSessao() {
    if (/\/login\.html$/i.test(location.pathname) || !auth.getToken()) return;
    // As páginas protegidas consultam /me no próprio fluxo; evitar um segundo pedido.
    if (document.querySelector('script[src*="js/tutor.js"], script[src*="js/animais.js"], script[src*="js/perfil.js"], script[src*="js/agendar.js"]')) return;
    const token = auth.getToken();
    api.apiFetch('/me', { headers: { Authorization: 'Bearer ' + token } }).then(function (r) {
      if (!r.ok) return null;
      return api.lerJsonSeguro(r);
    }).then(function (usuario) { if (usuario) auth.salvarSessao(token, usuario); }).catch(function () {});
  }
  function aplicarFonte(tamanho) { document.documentElement.style.fontSize = TAMANHOS_FONTE[tamanho] + '%'; try { localStorage.setItem(CHAVE_FONTE, tamanho); } catch (_) {} }
  try { const f = localStorage.getItem(CHAVE_FONTE); if (TAMANHOS_FONTE[f]) aplicarFonte(f); } catch (_) {}
  document.querySelectorAll('[data-fonte]').forEach(function (b) { b.addEventListener('click', function () { aplicarFonte(b.dataset.fonte); }); });
  document.addEventListener('click', function (e) {
    const link = e.target.closest('[data-area]');
    if (!link) return;
    e.preventDefault();
    const area = link.dataset.area;
    if (!auth.estaLogado()) { location.href = PAGINA_LOGIN + '?area=' + encodeURIComponent(area); return; }
    const usuario = auth.getUsuario();
    if (area === 'tutor' && usuario.perfil !== 'tutor') {
      if (aviso) { aviso.textContent = 'Acesso restrito a tutores.'; aviso.hidden = false; setTimeout(function () { aviso.hidden = true; }, 5000); }
      return;
    }
    if (area && !ui.usuarioPodeAcessarArea(usuario, area)) {
      if (aviso) { aviso.textContent = 'Você já está autenticado como ' + (usuario.perfil || 'usuário') + ' e não possui acesso a esta área.'; aviso.hidden = false; setTimeout(function () { aviso.hidden = true; }, 5000); }
      return;
    }
    if (area === 'tutor' && usuario.perfil === 'tutor') { location.href = 'tutor.html'; return; }
    if (aviso) { aviso.textContent = 'O painel desta área ainda não está disponível.'; aviso.hidden = false; setTimeout(function () { aviso.hidden = true; }, 4000); }
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
