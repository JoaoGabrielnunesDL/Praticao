// Chamadas reutilizáveis à API PratiCão (mesma origem).
(function () {
  const ROTAS_PUBLICAS = ['/login', '/cadastro'];
  const MSG_REDE = 'Não foi possível conectar ao servidor. Tente novamente.';
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
  function apiFetch(caminho, opcoes) {
    const config = Object.assign({}, opcoes || {});
    config.headers = new Headers(config.headers || {});
    const token = window.auth ? window.auth.getToken() : localStorage.getItem('token');
    if (token && !config.headers.has('Authorization')) config.headers.set('Authorization', 'Bearer ' + token);
    return fetch(caminho, config).then(function (resposta) {
      if (resposta.status === 401 && token && ROTAS_PUBLICAS.indexOf(caminho) === -1) {
        if (window.auth) window.auth.limparSessao();
        window.dispatchEvent(new CustomEvent('sessao-invalida'));
      }
      return resposta;
    });
  }
  window.api = {
    MSG_REDE: MSG_REDE,
    apiFetch: apiFetch,
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
