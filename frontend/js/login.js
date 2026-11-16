// Já está logado? Não precisa ver o login.
if (Auth.logado()) location.replace(Auth.rotaInicial(Auth.perfil(), Auth.destinoDaUrl()));

const formLogin = document.getElementById('form-login');
const formCadastro = document.getElementById('form-cadastro');
const titulo = document.getElementById('titulo-cartao');
const subtitulo = document.getElementById('subtitulo-cartao');

function mostrar(qual) {
  const cadastro = qual === 'cadastro';
  formLogin.hidden = cadastro;
  formCadastro.hidden = !cadastro;
  titulo.textContent = cadastro ? 'Criar sua conta' : 'Entrar no PratiCão';
  subtitulo.textContent = cadastro ? 'Preencha os dados para se cadastrar' : 'Acesse sua conta para continuar';
  document.querySelectorAll('.erro').forEach(e => { e.hidden = true; });
}
document.querySelectorAll('[data-mostrar]').forEach(b => b.addEventListener('click', () => mostrar(b.dataset.mostrar)));
if (location.hash === '#cadastro') mostrar('cadastro');

// Botão Mostrar/Ocultar senha
document.querySelectorAll('.mostrar').forEach(b => b.addEventListener('click', () => {
  const campo = document.getElementById(b.dataset.alvo);
  const oculto = campo.type === 'password';
  campo.type = oculto ? 'text' : 'password';
  b.textContent = oculto ? 'Ocultar' : 'Mostrar';
}));

function ocupado(form, sim) {
  const botao = form.querySelector('button[type=submit]');
  botao.disabled = sim;
  botao.textContent = sim ? 'Aguarde...' : botao.dataset.texto;
}
function erro(form, mensagem) {
  const caixa = form.querySelector('.erro');
  caixa.textContent = mensagem;
  caixa.hidden = !mensagem;
}

async function entrar(email, senha, lembrar) {
  const token = await api('/login', { method: 'POST', body: new URLSearchParams({ username: email, password: senha }) });
  const eu = await api('/me', { token: token.access_token });
  Auth.salvar({ token: token.access_token, nome: eu.nome, perfil: eu.perfil }, lembrar);
  location.href = Auth.rotaInicial(eu.perfil, Auth.destinoDaUrl());
}

formLogin.addEventListener('submit', async e => {
  e.preventDefault();
  erro(formLogin, '');
  ocupado(formLogin, true);
  try {
    await entrar(formLogin.email.value.trim(), formLogin.senha.value, formLogin.lembrar.checked);
  } catch (x) {
    erro(formLogin, x.message);
    ocupado(formLogin, false);
  }
});

formCadastro.addEventListener('submit', async e => {
  e.preventDefault();
  erro(formCadastro, '');
  const f = formCadastro;
  if (f.senha.value !== f.confirmar.value) return erro(f, 'As senhas não são iguais.');
  ocupado(f, true);
  try {
    await api('/cadastro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: f.nome.value.trim(), email: f.email.value.trim(), senha: f.senha.value, telefone: f.telefone.value.trim() || null }),
    });
    await entrar(f.email.value.trim(), f.senha.value, false); // já entra na conta recém-criada
  } catch (x) {
    erro(f, x.message);
    ocupado(f, false);
  }
});
