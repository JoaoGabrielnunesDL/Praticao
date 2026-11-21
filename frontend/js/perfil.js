// Meu Perfil (tutor, funcionário e administrador). Usa a API real, sem alterações no back-end:
//   GET /me   |   PUT /me {nome, telefone}   |   POST /logout
// A troca de senha é feita pelo fluxo "Esqueci minha senha" da tela de login (redefinir-senha.html).
// O e-mail, o tipo de conta e o status são só consulta. A validação final de tudo é da API.
let eu = null;
let ocupado = false;

const apenasDigitos = t => String(t).replace(/\D/g, '');
function mascaraTel(t) {
  const d = apenasDigitos(t);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return t;
}

function render() {
  $('v-nome').textContent = eu.nome;
  $('v-email').textContent = eu.email;
  const tel = $('v-tel');
  tel.textContent = eu.telefone ? mascaraTel(eu.telefone) : 'Não informado';
  tel.classList.toggle('vazio-val', !eu.telefone);
  $('ola').textContent = 'Olá, ' + (eu.nome || '').trim().split(' ')[0] + '!';
  $('v-tipo').textContent = PERFIL_TEXTO[eu.perfil] || eu.perfil;
  const st = $('v-status');
  st.textContent = eu.ativo ? '✔ Ativa' : 'Inativa';
  st.className = 'status ' + (eu.ativo ? 'ativa' : 'inativa');
  $('avatar').textContent = (eu.nome || '?').trim().charAt(0).toUpperCase();
}

async function carregar() {
  $('erro-tela').hidden = true;
  $('conteudo').hidden = false;
  try {
    eu = await api('/me');
    render();
  } catch (x) {
    if (x.status === 401) return tratarErro(x);
    $('conteudo').hidden = true;
    $('erro-texto').textContent = x.message;
    $('erro-tela').hidden = false;
  }
}

// ---------- editar dados (janela) ----------
function abrirEdicao() {
  $('ed-erro').hidden = true;
  $('p-nome').value = eu.nome;
  $('p-email').value = eu.email;
  $('p-tel').value = eu.telefone || '';
  $('dlg-editar').showModal();
  $('p-nome').focus();
}

function erroEdicao(t) { const e = $('ed-erro'); e.textContent = t; e.hidden = false; }

async function salvarDados(e) {
  e.preventDefault();
  if (ocupado) return;
  const nome = $('p-nome').value.trim().replace(/\s+/g, ' ');
  const tel = $('p-tel').value.trim();
  if (nome.length < 2) return erroEdicao('Informe seu nome completo (mínimo de 2 letras).');
  if (tel && (apenasDigitos(tel).length < 10 || apenasDigitos(tel).length > 13)) return erroEdicao('Informe um telefone válido, com DDD. Ex.: (11) 99999-9999.');
  ocupado = true;
  $('ed-salvar').disabled = true;
  try {
    eu = await api('/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, telefone: tel || null }),
    });
    Auth.atualizarNome(eu.nome);
    const nomeNoCabecalho = document.querySelector('#conta .btn');
    if (nomeNoCabecalho) nomeNoCabecalho.textContent = Auth.primeiroNome();
    render();
    $('dlg-editar').close();
    mostrarMensagem('sucesso', 'Dados atualizados com sucesso!');
  } catch (x) {
    if (x.status === 401) { $('dlg-editar').close(); tratarErro(x); } else erroEdicao(x.message); // o formulário continua aberto
  } finally {
    ocupado = false;
    $('ed-salvar').disabled = false;
  }
}

// ---------- sair ----------
async function sair() {
  if (!(await perguntar({ titulo: 'Sair da conta?', texto: 'Tem certeza de que deseja sair da sua conta?', rotulo: 'Sim, sair' }))) return;
  try { await api('/logout', { method: 'POST' }); } catch { /* mesmo sem resposta da API, a sessão local é encerrada */ }
  Auth.limpar();
  location.href = 'login.html';
}

function iniciar() {
  // "Voltar" leva ao início de cada perfil (tutor: painel; funcionário e administrador: seus painéis).
  $('voltar').href = Auth.rotaInicial(Auth.perfil(), null);
  $('editar').addEventListener('click', abrirEdicao);
  $('ed-cancelar').addEventListener('click', () => $('dlg-editar').close());
  $('form-dados').addEventListener('submit', salvarDados);
  $('sair').addEventListener('click', sair);
  $('tentar').addEventListener('click', carregar);
  carregar();
}

if (Auth.exigirPerfil(['tutor', 'funcionario', 'administrador'])) iniciar();
