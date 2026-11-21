// Recuperar senha em 3 passos, na mesma tela. Usa a API real:
//   POST /recuperar-senha  {email}               -> {mensagem, token}  (token só no modo demonstração)
//   POST /redefinir-senha  {token, nova_senha}   -> {mensagem}
let tokenRecuperacao = null; // fica só na memória da página

const passos = { 1: $('passo-1'), 2: $('passo-2'), 3: $('passo-3') };
const ROTULOS = { 1: 'Passo 1 de 3 – Pedir o link', 2: 'Passo 2 de 3 – Crie uma nova senha', 3: 'Passo 3 de 3 – Concluído' };

function $(id) { return document.getElementById(id); }

function irParaPasso(n) {
  Object.entries(passos).forEach(([k, el]) => { el.hidden = Number(k) !== n; });
  $('rotulo-passo').textContent = ROTULOS[n];
}
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

// Botão Mostrar/Ocultar senha
document.querySelectorAll('.mostrar').forEach(b => b.addEventListener('click', () => {
  const campo = $(b.dataset.alvo);
  const oculto = campo.type === 'password';
  campo.type = oculto ? 'text' : 'password';
  b.textContent = oculto ? 'Ocultar' : 'Mostrar';
}));

// Força da senha (simples: tamanho + variedade de caracteres)
$('rec-nova').addEventListener('input', e => {
  const s = e.target.value;
  let pontos = 0;
  if (s.length >= 6) pontos++;
  if (s.length >= 8 && /[a-z]/.test(s) && /[A-Z0-9]/.test(s)) pontos++;
  if (s.length >= 10 && /[a-z]/.test(s) && /[A-Z]/.test(s) && /\d/.test(s)) pontos++;
  document.querySelector('.forca').className = 'forca' + (pontos ? ' nivel-' + pontos : '');
  $('forca-texto').textContent = 'Força da senha: ' + (['—', 'fraca', 'média', 'forte'][pontos]);
});

// PASSO 1: pedir o link
passos[1].addEventListener('submit', async e => {
  e.preventDefault();
  const f = passos[1];
  erro(f, '');
  const email = f.email.value.trim();
  if (!email) return erro(f, 'Informe o e-mail da sua conta.');
  ocupado(f, true);
  try {
    const r = await api('/recuperar-senha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (r.token) {
      tokenRecuperacao = r.token; // modo demonstração: segue direto para a nova senha
      irParaPasso(2);
    } else {
      erro(f, '');
      f.querySelector('.sub').textContent = r.mensagem; // sem token: o link iria por e-mail
    }
  } catch (x) {
    erro(f, x.status === 422 ? 'Informe um e-mail válido.' : x.message);
  }
  ocupado(f, false);
});

// PASSO 2: salvar a nova senha
passos[2].addEventListener('submit', async e => {
  e.preventDefault();
  const f = passos[2];
  erro(f, '');
  if (f.nova.value.length < 6) return erro(f, 'A senha precisa ter pelo menos 6 caracteres.');
  if (f.nova.value !== f.confirmar.value) return erro(f, 'As senhas não são iguais.');
  ocupado(f, true);
  try {
    await api('/redefinir-senha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: tokenRecuperacao, nova_senha: f.nova.value }),
    });
    tokenRecuperacao = null;
    f.reset();
    irParaPasso(3);
  } catch (x) {
    erro(f, x.message);
    if (x.status === 400 && /link/i.test(x.message)) {
      // link vencido ou já usado: volta ao passo 1 para pedir outro
      setTimeout(() => { irParaPasso(1); }, 2500);
    }
  }
  ocupado(f, false);
});

// Se o link de e-mail trouxer ?token=..., vai direto ao passo 2 (para quando houver envio de e-mail).
const tokenUrl = new URLSearchParams(location.search).get('token');
if (tokenUrl) { tokenRecuperacao = tokenUrl; irParaPasso(2); }
