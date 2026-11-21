// Botão principal das páginas de estado (404, acesso negado e sessão expirada).
const principal = document.getElementById('btn-principal');
const pagina = location.pathname.split('/').pop();

if (pagina === 'sessao-expirada.html') {
  // Depois de entrar de novo, volta para a tela em que a pessoa estava (se o perfil dela puder abri-la).
  const destino = Auth.destinoDaUrl();
  principal.href = destino ? 'login.html?destino=' + encodeURIComponent(destino) : 'login.html';
} else if (Auth.logado()) {
  principal.href = Auth.rotaInicial(Auth.perfil(), null); // tutor, funcionário ou administrador: cada um vai ao seu painel
} else if (pagina === 'acesso-negado.html') {
  principal.href = 'login.html';
  principal.textContent = '➜ Ir para o login';
}
