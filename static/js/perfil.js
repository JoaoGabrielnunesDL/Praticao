(function () {
  const token = auth.getToken();
  if (!token) { window.location.replace('login.html'); return; }
  const tipos = { tutor: 'Tutor', funcionario: 'Funcionário', administrador: 'Administrador' };
  api.apiFetch('/me').then(function (r) {
    if (!r.ok) throw new Error('Não foi possível carregar o perfil.');
    return api.lerJsonSeguro(r);
  }).then(function (u) {
    if (!u) throw new Error('Não foi possível carregar o perfil.');
    auth.salvarSessao(token, u);
    document.getElementById('perfil-nome').textContent = u.nome;
    document.getElementById('perfil-email').textContent = u.email;
    document.getElementById('perfil-tipo').textContent = tipos[u.perfil] || 'Conta';
    document.getElementById('perfil-carregando').hidden = true;
    document.getElementById('perfil-dados').hidden = false;
  }).catch(function (e) {
    if (!auth.getToken()) { window.location.replace('login.html'); return; }
    document.getElementById('perfil-carregando').hidden = true;
    const erro = document.getElementById('perfil-erro'); erro.textContent = e.message === 'Failed to fetch' ? api.MSG_REDE : e.message; erro.hidden = false;
  });
})();
