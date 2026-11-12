// Chamadas reutilizáveis à API PratiCão (mesma origem).
(function () {
  const ROTAS_PUBLICAS = ['/login', '/cadastro'];
  const MSG_REDE = 'Não foi possível conectar ao servidor.';
  const MSG_GENERICA = 'Confira os dados informados e tente novamente.';

  function lerJsonSeguro(resposta) {
    return resposta.text().then(function (texto) {
      if (!texto) return null;
      try { return JSON.parse(texto); } catch (_) { return null; }
    });
  }
  function mensagemDeErro(corpo) {
    return corpo && typeof corpo.detail === 'string' ? corpo.detail : MSG_GENERICA;
  }
  function tratarStatus(resposta, token, caminho) {
    if (resposta.status === 401 && ROTAS_PUBLICAS.indexOf(caminho) === -1) {
      if (window.ui) window.ui.mostrarSessaoExpirada();
      else if (window.auth) window.auth.limparSessao();
      window.dispatchEvent(new CustomEvent('sessao-invalida'));
    } else if (resposta.status === 403 && window.ui && ROTAS_PUBLICAS.indexOf(caminho) === -1) {
      const usuario = window.auth && window.auth.getUsuario();
      window.ui.mostrarToast('Você não tem acesso a esta área.', 'erro', 7000, {
        texto: 'Voltar à minha página inicial',
        aoClicar: function () { window.ui.irParaPaginaInicial(usuario); }
      });
    } else if (resposta.status === 404 && window.ui) {
      window.ui.mostrarAviso('O item solicitado não foi encontrado.');
    } else if (resposta.status >= 500 && window.ui) {
      window.ui.mostrarErro('O servidor encontrou um problema. Tente novamente mais tarde.');
    }
    return resposta;
  }
  function apiFetch(caminho, opcoes) {
    const config = Object.assign({}, opcoes || {});
    config.headers = new Headers(config.headers || {});
    const token = window.auth ? window.auth.getToken() : localStorage.getItem('token');
    if (token && !config.headers.has('Authorization')) config.headers.set('Authorization', 'Bearer ' + token);
    return fetch(caminho, config).then(function (resposta) {
      return tratarStatus(resposta, token, caminho);
    }).catch(function (erro) {
      if (window.ui) window.ui.mostrarErro(MSG_REDE);
      throw erro;
    });
  }
  window.api = {
    MSG_REDE: MSG_REDE,
    apiFetch: apiFetch,
    tratarStatus: tratarStatus,
    lerJsonSeguro: lerJsonSeguro,
    mensagemDeErro: mensagemDeErro,
    apiUrl: function (caminho) { return caminho; },
    primeiroNome: function (nome) { return (nome || '').trim().split(/\s+/)[0] || ''; },
    obterToken: function () { return window.auth.getToken(); },
    obterUsuario: function () { return window.auth.getUsuario(); },
    salvarSessao: function (token, usuario) { return window.auth.salvarSessao(token, usuario); },
    limparSessao: function () { return window.auth.limparSessao(); }
  };
})();
