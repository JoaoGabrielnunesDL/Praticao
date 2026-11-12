// Componentes transversais de interface do PratiCão.
(function () {
  const TIPOS = ['sucesso', 'erro', 'aviso', 'informacao'];
  const PAGINA_INICIAL_POR_PERFIL = { tutor: 'tutor.html', funcionario: 'painel.html', administrador: 'admin.html' };
  const PERFIS_POR_AREA = { tutor: ['tutor'], funcionario: ['funcionario', 'administrador'] };
  let caixaToasts;
  let dialogoAtivo = null;

  function obterAlvo(alvo) { return typeof alvo === 'string' ? document.querySelector(alvo) : (alvo || null); }
  function obterCaixaToasts() {
    if (caixaToasts && caixaToasts.isConnected) return caixaToasts;
    caixaToasts = document.createElement('div');
    caixaToasts.className = 'ui-toasts';
    caixaToasts.setAttribute('aria-label', 'Notificações');
    caixaToasts.setAttribute('aria-live', 'polite');
    caixaToasts.setAttribute('aria-relevant', 'additions');
    document.body.appendChild(caixaToasts);
    return caixaToasts;
  }
  function mostrarToast(mensagem, tipo, duracao, acao) {
    const variante = TIPOS.indexOf(tipo) >= 0 ? tipo : 'informacao';
    const item = document.createElement('div');
    item.className = 'ui-toast ui-toast--' + variante;
    item.setAttribute('role', variante === 'erro' ? 'alert' : 'status');
    const texto = document.createElement('p'); texto.className = 'ui-toast__texto';
    texto.textContent = mensagem || 'Ocorreu um problema. Tente novamente.';
    if (acao && acao.texto && typeof acao.aoClicar === 'function') {
      const botaoAcao = document.createElement('button'); botaoAcao.type = 'button'; botaoAcao.className = 'ui-botao ui-botao--secundario';
      botaoAcao.textContent = acao.texto; botaoAcao.addEventListener('click', acao.aoClicar); item.appendChild(botaoAcao);
    }
    const fechar = document.createElement('button'); fechar.type = 'button'; fechar.className = 'ui-toast__fechar';
    fechar.setAttribute('aria-label', 'Fechar notificação'); fechar.textContent = '×';
    fechar.addEventListener('click', function () { item.remove(); });
    item.append(texto, fechar); obterCaixaToasts().appendChild(item);
    const tempo = Number.isFinite(duracao) ? duracao : 5000;
    if (tempo > 0) window.setTimeout(function () { item.remove(); }, tempo);
    return item;
  }
  function criarEstado(classe, mensagem, opcoes) {
    const config = opcoes || {}, estado = document.createElement('section');
    estado.className = 'ui-estado ' + classe; estado.setAttribute('role', config.role || 'status');
    if (config.titulo) { const titulo = document.createElement('h2'); titulo.className = 'ui-estado__titulo'; titulo.textContent = config.titulo; estado.appendChild(titulo); }
    const texto = document.createElement('p'); texto.className = 'ui-estado__mensagem'; texto.textContent = mensagem || ''; estado.appendChild(texto);
    return estado;
  }
  function inserirEstado(alvo, estado) { const destino = obterAlvo(alvo); if (destino) destino.replaceChildren(estado); return estado; }
  function mostrarCarregando(alvo, mensagem) {
    const estado = criarEstado('ui-estado--carregando', mensagem || 'Carregando...', { role: 'status' });
    const spinner = document.createElement('span'); spinner.className = 'ui-spinner'; spinner.setAttribute('aria-hidden', 'true');
    estado.insertBefore(spinner, estado.querySelector('.ui-estado__mensagem')); return inserirEstado(alvo, estado);
  }
  function mostrarVazio(alvo, mensagem, acao) {
    const estado = criarEstado('ui-estado--vazio', mensagem || 'Nenhum dado encontrado.');
    if (acao && acao.texto && typeof acao.aoClicar === 'function') {
      const botao = document.createElement('button'); botao.type = 'button'; botao.className = 'ui-botao ui-botao--primario';
      botao.textContent = acao.texto; botao.addEventListener('click', acao.aoClicar); estado.appendChild(botao);
    }
    return inserirEstado(alvo, estado);
  }
  function mostrarErroConexao(alvo, tentarNovamente) {
    const estado = criarEstado('ui-estado--erro', 'Não foi possível conectar ao servidor.', { titulo: 'Falha de conexão', role: 'alert' });
    if (typeof tentarNovamente === 'function') {
      const botao = document.createElement('button'); botao.type = 'button'; botao.className = 'ui-botao ui-botao--primario';
      botao.textContent = 'Tentar novamente'; botao.addEventListener('click', tentarNovamente); estado.appendChild(botao);
    }
    return inserirEstado(alvo, estado);
  }
  function safePath(url) {
    if (!url || url.indexOf('\\') >= 0 || url.indexOf('//') === 0) return null;
    try { const parsed = new URL(url, window.location.origin);
      if (parsed.origin !== window.location.origin || /\/(login|404)\.html$/i.test(parsed.pathname)) return null;
      return parsed.pathname + parsed.search + parsed.hash;
    } catch (_) { return null; }
  }
  function paginaAtualSegura() { return safePath(window.location.pathname + window.location.search + window.location.hash) || '/'; }
  function mostrarSessaoExpirada(redirecionar) {
    if (window.auth) window.auth.limparSessao();
    if (redirecionar !== false && !/\/login\.html$/i.test(window.location.pathname) && !window.__praticaoSessaoRedirecionando) {
      window.__praticaoSessaoRedirecionando = true;
      window.location.replace('login.html?msg=sessao-expirada&next=' + encodeURIComponent(paginaAtualSegura())); return;
    }
    return mostrarToast('Sua sessão expirou. Faça login novamente.', 'aviso', 7000);
  }
  function obterHome(usuario) {
    const destino = PAGINA_INICIAL_POR_PERFIL[usuario && usuario.perfil];
    if (!destino) return Promise.resolve('index.html');
    return fetch(destino, { method: 'HEAD', credentials: 'same-origin' }).then(function (r) { return r.ok ? destino : 'index.html'; }).catch(function () { return 'index.html'; });
  }
  function irParaPaginaInicial(usuario) { return obterHome(usuario).then(function (destino) { window.location.assign(destino); }); }
  function usuarioPodeAcessarArea(usuario, area) {
    return Boolean(usuario && PERFIS_POR_AREA[area] && PERFIS_POR_AREA[area].indexOf(usuario.perfil) >= 0);
  }
  function mostrarSemPermissao(alvo, usuario) {
    const estado = criarEstado('ui-estado--erro', 'Você não tem acesso a esta área.', { titulo: 'Acesso restrito', role: 'alert' });
    const botao = document.createElement('button'); botao.type = 'button'; botao.className = 'ui-botao ui-botao--primario';
    botao.textContent = 'Voltar à minha página inicial'; botao.addEventListener('click', function () { irParaPaginaInicial(usuario); });
    estado.appendChild(botao); return inserirEstado(alvo || 'main', estado);
  }
  function exigirPerfil(perfisPermitidos) {
    const token = window.auth && window.auth.getToken(), usuario = window.auth && window.auth.getUsuario();
    if (!token || !usuario) { window.location.replace('login.html?next=' + encodeURIComponent(paginaAtualSegura())); return false; }
    const permitidos = Array.isArray(perfisPermitidos) ? perfisPermitidos : [perfisPermitidos];
    if (permitidos.indexOf(usuario.perfil) === -1) { mostrarSemPermissao(document.querySelector('[data-page-content]') || document.querySelector('main'), usuario); return false; }
    return true;
  }
  function confirmarExclusao(mensagem, titulo) {
    if (dialogoAtivo) return Promise.resolve(false);
    const focoAnterior = document.activeElement, dialogo = document.createElement('dialog');
    dialogo.className = 'ui-modal'; dialogo.setAttribute('aria-labelledby', 'ui-modal-titulo');
    const cabecalho = document.createElement('h2'); cabecalho.id = 'ui-modal-titulo'; cabecalho.textContent = titulo || 'Confirmar ação';
    const texto = document.createElement('p'); texto.textContent = mensagem || 'Deseja continuar?';
    const acoes = document.createElement('div'); acoes.className = 'ui-modal__acoes';
    const cancelar = document.createElement('button'); cancelar.type = 'button'; cancelar.className = 'ui-botao ui-botao--secundario'; cancelar.textContent = 'Cancelar';
    const confirmar = document.createElement('button'); confirmar.type = 'button'; confirmar.className = 'ui-botao ui-botao--perigo'; confirmar.textContent = 'Confirmar';
    acoes.append(cancelar, confirmar); dialogo.append(cabecalho, texto, acoes); document.body.appendChild(dialogo); dialogoAtivo = dialogo;
    return new Promise(function (resolve) {
      let resolvido = false;
      function finalizar(valor) { if (resolvido) return; resolvido = true; dialogo.close(); dialogo.remove(); dialogoAtivo = null; if (focoAnterior && focoAnterior.focus) focoAnterior.focus(); resolve(valor); }
      cancelar.addEventListener('click', function () { finalizar(false); }); confirmar.addEventListener('click', function () { finalizar(true); });
      dialogo.addEventListener('cancel', function (e) { e.preventDefault(); finalizar(false); });
      dialogo.addEventListener('click', function (e) { if (e.target === dialogo) finalizar(false); });
      dialogo.showModal(); cancelar.focus();
    });
  }
  window.ui = {
    mostrarToast: mostrarToast,
    mostrarSucesso: function (m) { return mostrarToast(m, 'sucesso'); },
    mostrarErro: function (m) { return mostrarToast(m, 'erro'); },
    mostrarAviso: function (m) { return mostrarToast(m, 'aviso'); },
    mostrarInformacao: function (m) { return mostrarToast(m, 'informacao'); },
    mostrarCarregando: mostrarCarregando, mostrarVazio: mostrarVazio, mostrarErroConexao: mostrarErroConexao,
    mostrarSessaoExpirada: mostrarSessaoExpirada, mostrarSemPermissao: mostrarSemPermissao,
    irParaPaginaInicial: irParaPaginaInicial, usuarioPodeAcessarArea: usuarioPodeAcessarArea,
    paginaInicialPorPerfil: PAGINA_INICIAL_POR_PERFIL, exigirPerfil: exigirPerfil, confirmarExclusao: confirmarExclusao
  };
  window.mostrarSucesso = window.ui.mostrarSucesso;
  window.mostrarErro = window.ui.mostrarErro;
  window.mostrarAviso = window.ui.mostrarAviso;
  window.mostrarInformacao = window.ui.mostrarInformacao;
  window.mostrarCarregando = mostrarCarregando;
  window.mostrarVazio = mostrarVazio;
  window.mostrarErroConexao = mostrarErroConexao;
  window.exigirPerfil = exigirPerfil;
  window.irParaPaginaInicial = irParaPaginaInicial;
  window.PAGINA_INICIAL_POR_PERFIL = PAGINA_INICIAL_POR_PERFIL;
  window.confirmarExclusao = confirmarExclusao;

  // Links do rodapé ainda indisponíveis (data-em-breve): avisa em vez de navegar para "#".
  // Páginas que já tratam esses links (index, login) chamam preventDefault antes, então não há aviso duplicado.
  document.addEventListener('click', function (evento) {
    const link = evento.target.closest && evento.target.closest('[data-em-breve]');
    if (!link || evento.defaultPrevented) return;
    evento.preventDefault();
    mostrarToast('Em breve! Estamos preparando essa novidade.', 'informacao');
  });
})();
