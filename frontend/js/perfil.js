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
  st.textContent = eu.ativo ? 'Ativa' : 'Inativa';
  st.className = 'status ' + (eu.ativo ? 'ativa' : 'inativa');
  $('avatar').textContent = (eu.nome || '?').trim().charAt(0).toUpperCase();
  const info = INFO_CONTA[eu.perfil];
  if (info) { $('info-conta-t').textContent = 'Conta ' + (eu.perfil === 'tutor' ? 'do Tutor' : eu.perfil === 'funcionario' ? 'do Funcionário' : 'do Administrador'); $('info-conta-p').textContent = info; }
}

// Texto da faixa de avisos, conforme o tipo de conta (o que cada perfil realmente acessa no menu).
const INFO_CONTA = {
  tutor: 'Você está logado como tutor e pode gerenciar seus animais e agendamentos.',
  funcionario: 'Você está logado como funcionário e pode gerenciar a agenda e os relatórios.',
  administrador: 'Você está logado como administrador e pode gerenciar usuários, serviços e a agenda.',
};

// Menu "Minha área" (só navegação): mesmos destinos do menu do cabeçalho de cada perfil.
const MENU_AREA = {
  tutor: [['Painel', 'painel.html', 'casa'], ['Meus Animais', 'meus-animais.html', 'pata'], ['Novo Agendamento', 'agendamento.html', 'calendario'], ['Meus Agendamentos', 'meus-agendamentos.html', 'lista'], ['Meu Perfil', 'perfil.html', 'usuario']],
  funcionario: [['Agenda', 'painel-funcionario.html', 'calendario'], ['Relatórios', 'relatorios.html', 'grafico'], ['Meu Perfil', 'perfil.html', 'usuario']],
  administrador: [['Visão geral', 'painel-admin.html', 'casa'], ['Usuários', 'admin-usuarios.html', 'usuario'], ['Agenda', 'painel-funcionario.html', 'calendario'], ['Serviços', 'gerenciar-servicos.html', 'tesoura'], ['Relatórios', 'relatorios.html', 'grafico'], ['Meu Perfil', 'perfil.html', 'usuario']],
};
function montarMenuArea() {
  const itens = MENU_AREA[Auth.perfil()] || MENU_AREA.tutor;
  $('pf-links').innerHTML = itens.map(([texto, href, ic]) => {
    const atual = href === 'perfil.html';
    const icone = ic === 'pata'
      ? '<svg class="ic" viewBox="0 0 80 72" width="26" height="24" aria-hidden="true"><use href="#pata"/></svg>'
      : `<svg class="ic" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><use href="#i-${ic}"/></svg>`;
    return `<li><a href="${href}"${atual ? ' aria-current="page" class="ativo"' : ''}>${icone}${texto}</a></li>`;
  }).join('');
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
async function sair(opcoes = {}) {
  const { titulo = 'Sair da conta?', texto = 'Tem certeza de que deseja sair da sua conta?', rotulo = 'Sim, sair', destino = 'login.html' } = opcoes;
  if (!(await perguntar({ titulo, texto, rotulo }))) return;
  try { await api('/logout', { method: 'POST' }); } catch { /* mesmo sem resposta da API, a sessão local é encerrada */ }
  Auth.limpar();
  location.href = destino;
}

// Troca de senha: não há rota para isso com a pessoa logada; o caminho é o fluxo de recuperação (e-mail).
function redefinirSenha() {
  sair({
    titulo: 'Redefinir a senha?',
    texto: 'Para trocar a senha você vai sair da conta e seguir o passo a passo de recuperação por e-mail. Deseja continuar?',
    rotulo: 'Sim, continuar',
    destino: 'redefinir-senha.html',
  });
}

function iniciar() {
  // "Voltar" leva ao início de cada perfil (tutor: painel; funcionário e administrador: seus painéis).
  $('voltar').href = Auth.rotaInicial(Auth.perfil(), null);
  $('editar').addEventListener('click', abrirEdicao);
  $('ed-cancelar').addEventListener('click', () => $('dlg-editar').close());
  $('form-dados').addEventListener('submit', salvarDados);
  $('sair').addEventListener('click', () => sair());
  $('trocar-senha').addEventListener('click', redefinirSenha);
  montarMenuArea();
  $('tentar').addEventListener('click', carregar);
  carregar();
}

if (Auth.exigirPerfil(['tutor', 'funcionario', 'administrador'])) iniciar();
