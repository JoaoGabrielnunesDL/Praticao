// Sessão local compartilhada entre as páginas e abas.
(function () {
  const CHAVE_TOKEN = 'token';
  const CHAVE_USUARIO = 'usuario';
  function getToken() { try { return localStorage.getItem(CHAVE_TOKEN); } catch (_) { return null; } }
  function getUsuario() {
    try { return JSON.parse(localStorage.getItem(CHAVE_USUARIO)); } catch (_) { return null; }
  }
  function salvarSessao(token, usuario) {
    localStorage.setItem(CHAVE_TOKEN, token);
    localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
    window.dispatchEvent(new CustomEvent('sessao-atualizada'));
  }
  function limparSessao() {
    localStorage.removeItem(CHAVE_TOKEN);
    localStorage.removeItem(CHAVE_USUARIO);
    window.dispatchEvent(new CustomEvent('sessao-atualizada'));
  }
  function estaLogado() { return Boolean(getToken() && getUsuario()); }
  function sair() {
    const token = getToken();
    limparSessao();
    if (token) fetch('/logout', { method: 'POST', headers: { Authorization: 'Bearer ' + token }, keepalive: true }).catch(function () {});
    window.location.href = 'index.html';
  }
  window.auth = { getToken, getUsuario, salvarSessao, limparSessao, estaLogado, sair };
  window.addEventListener('storage', function (evento) {
    if (evento.key === CHAVE_TOKEN || evento.key === CHAVE_USUARIO || evento.key === null) {
      window.dispatchEvent(new CustomEvent('sessao-atualizada'));
    }
  });
})();
