// login.js — abas e integração dos formulários com a API.
(function () {
  const DESTINO_APOS_LOGIN_POR_PERFIL = { tutor: 'index.html', funcionario: 'index.html', administrador: 'index.html' };
  var abaEntrar = document.getElementById('aba-entrar');
  var abaCadastro = document.getElementById('aba-cadastro');
  var painelEntrar = document.getElementById('painel-entrar');
  var painelCadastro = document.getElementById('painel-cadastro');
  var mensagemPagina = document.getElementById('mensagem-pagina');

  function trocarAba(cadastro, atualizarUrl) {
    abaEntrar.setAttribute('aria-selected', String(!cadastro));
    abaCadastro.setAttribute('aria-selected', String(cadastro));
    abaEntrar.tabIndex = cadastro ? -1 : 0;
    abaCadastro.tabIndex = cadastro ? 0 : -1;
    painelEntrar.hidden = cadastro;
    painelCadastro.hidden = !cadastro;
    if (atualizarUrl) {
      if (cadastro) history.replaceState(null, '', '#cadastro');
      else history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }

  abaEntrar.addEventListener('click', function () { trocarAba(false, true); });
  abaCadastro.addEventListener('click', function () { trocarAba(true, true); });
  document.getElementById('ir-cadastro').addEventListener('click', function () { trocarAba(true, true); abaCadastro.focus(); });
  document.getElementById('ir-entrar').addEventListener('click', function () { trocarAba(false, true); abaEntrar.focus(); });
  [abaEntrar, abaCadastro].forEach(function (aba) {
    aba.addEventListener('keydown', function (evento) {
      if (evento.key !== 'ArrowLeft' && evento.key !== 'ArrowRight') return;
      evento.preventDefault();
      var proxima = aba === abaEntrar ? abaCadastro : abaEntrar;
      trocarAba(proxima === abaCadastro, true);
      proxima.focus();
    });
  });
  trocarAba(window.location.hash === '#cadastro', false);

  function exibirMensagem(texto, tipo) {
    mensagemPagina.textContent = texto;
    mensagemPagina.hidden = !texto;
    mensagemPagina.className = tipo === 'erro' ? 'mensagem-erro' : 'mensagem-info';
  }

  function erroDoFormulario(id, texto) {
    var caixa = document.getElementById(id);
    caixa.textContent = texto;
    caixa.hidden = !texto;
  }

  function buscarCorpo(resposta) { return window.api.lerJsonSeguro(resposta); }

  function carregarUsuario(token) {
    return window.api.apiFetch('/me', { headers: { Authorization: 'Bearer ' + token } }).then(function (resposta) {
      if (!resposta.ok) throw new Error('Não foi possível carregar os dados da conta.');
      return buscarCorpo(resposta);
    }).then(function (usuario) {
      if (!usuario || !usuario.id) throw new Error('A resposta da conta está incompleta.');
      window.api.salvarSessao(token, usuario);
      window.location.href = DESTINO_APOS_LOGIN_POR_PERFIL[usuario.perfil] || 'index.html';
    });
  }

  function entrar(email, senha) {
    var dados = new URLSearchParams();
    dados.append('username', email);
    dados.append('password', senha);
    return window.api.apiFetch('/login', {
      method: 'POST',
      body: dados
    }).then(function (resposta) {
      return buscarCorpo(resposta).then(function (corpo) {
        if (!resposta.ok) {
          var texto = resposta.status === 422 ? 'Preencha o e-mail e a senha.' : window.api.mensagemDeErro(corpo);
          throw new Error(texto);
        }
        if (!corpo || !corpo.access_token) throw new Error('O servidor não retornou o token de acesso.');
        return carregarUsuario(corpo.access_token);
      });
    });
  }

  document.getElementById('form-login').addEventListener('submit', function (evento) {
    evento.preventDefault();
    erroDoFormulario('erro-login', '');
    var email = document.getElementById('login-email').value.trim();
    var senha = document.getElementById('login-senha').value;
    var campoEmail = document.getElementById('login-email');
    var campoSenha = document.getElementById('login-senha');
    var erroEmail = !email ? 'Informe seu e-mail.' : (!window.validacao.emailValido(email) ? 'Informe um e-mail válido.' : '');
    var erroSenha = !senha ? 'Informe sua senha.' : '';
    window.validacao.mostrarErro(campoEmail, erroEmail);
    window.validacao.mostrarErro(campoSenha, erroSenha);
    if (erroEmail || erroSenha) { erroDoFormulario('erro-login', 'Confira os campos destacados.'); (erroEmail ? campoEmail : campoSenha).focus(); return; }
    var botao = document.getElementById('botao-login');
    botao.disabled = true;
    botao.textContent = 'Entrando...';
    entrar(email, senha).catch(function (erro) {
      erroDoFormulario('erro-login', erro instanceof TypeError || erro.message === 'Failed to fetch' ? window.api.MSG_REDE : erro.message);
    }).then(function () { botao.disabled = false; botao.textContent = 'Entrar'; });
  });

  document.getElementById('form-cadastro').addEventListener('submit', function (evento) {
    evento.preventDefault();
    erroDoFormulario('erro-cadastro', '');
    var campos = {
      nome: document.getElementById('cad-nome'), cpf: document.getElementById('cad-cpf'),
      telefone: document.getElementById('cad-telefone'), email: document.getElementById('cad-email'),
      senha: document.getElementById('cad-senha'), confirma: document.getElementById('cad-confirma'),
      aceite: document.getElementById('cad-aceite')
    };
    var valido = true;
    function conferir(campo, erro) { if (!window.validacao.mostrarErro(campo, erro)) valido = false; }
    conferir(campos.nome, campos.nome.value.trim().length < 2 || campos.nome.value.trim().length > 100 ? 'Informe um nome entre 2 e 100 caracteres.' : '');
    conferir(campos.cpf, campos.cpf.value && !window.validacao.cpfValido(campos.cpf.value) ? 'Confira o CPF informado.' : '');
    conferir(campos.telefone, campos.telefone.value && window.validacao.somenteNumeros(campos.telefone.value).length < 10 ? 'Confira o telefone ou deixe o campo vazio.' : '');
    conferir(campos.email, !window.validacao.emailValido(campos.email.value) ? 'Informe um e-mail válido.' : '');
    conferir(campos.senha, campos.senha.value.length < 6 ? 'A senha precisa ter pelo menos 6 caracteres.' : '');
    conferir(campos.confirma, campos.confirma.value !== campos.senha.value ? 'As senhas não conferem.' : '');
    conferir(campos.aceite, !campos.aceite.checked ? 'Aceite os termos para continuar.' : '');
    if (!valido) {
      var primeiroErro = document.querySelector('[aria-invalid="true"]');
      if (primeiroErro) primeiroErro.focus();
      return;
    }

    var botao = document.getElementById('botao-cadastro');
    botao.disabled = true;
    botao.textContent = 'Criando conta...';
    var dados = {
      nome: campos.nome.value.trim(), email: campos.email.value.trim(), senha: campos.senha.value,
      telefone: campos.telefone.value.trim() || null
    };
    window.api.apiFetch('/cadastro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    }).then(function (resposta) {
      return buscarCorpo(resposta).then(function (corpo) {
        if (!resposta.ok) {
          var texto = resposta.status === 422 ? 'Confira os campos obrigatórios e tente novamente.' : window.api.mensagemDeErro(corpo);
          throw new Error(texto);
        }
        return entrar(dados.email, dados.senha);
      });
    }).catch(function (erro) {
      erroDoFormulario('erro-cadastro', erro.message === 'Failed to fetch' ? window.api.MSG_REDE : erro.message);
    }).then(function () { botao.disabled = false; botao.textContent = 'Criar conta'; });
  });

  var parametros = new URLSearchParams(window.location.search);
  if (parametros.get('msg') === 'agendar') exibirMensagem('Entre ou cadastre-se para concluir seu agendamento.');
  if (parametros.get('msg') === 'sessao-expirada') exibirMensagem('Sua sessão expirou. Entre novamente para continuar.');

  // Remove o aviso da barra de endereço depois de apresentá-lo.
  if (parametros.has('msg')) {
    parametros.delete('msg');
    var consulta = parametros.toString();
    history.replaceState(null, '', window.location.pathname + (consulta ? '?' + consulta : '') + window.location.hash);
  }

  // Confere a sessão sem deixar o 401 do /me recarregar esta página.
  var tokenSalvo = window.auth.getToken();
  if (tokenSalvo) {
    fetch(window.api.apiUrl('/me'), { headers: { Authorization: 'Bearer ' + tokenSalvo } })
      .then(function (resposta) {
        if (resposta.status === 401) {
          window.api.limparSessao();
          return null;
        }
        if (!resposta.ok) throw new Error('Falha ao confirmar a sessão.');
        return window.api.lerJsonSeguro(resposta);
      })
      .then(function (usuario) {
        if (!usuario || !usuario.id) return;
        window.api.salvarSessao(tokenSalvo, usuario);
        window.location.href = DESTINO_APOS_LOGIN_POR_PERFIL[usuario.perfil] || 'index.html';
      })
      .catch(function () { exibirMensagem(window.api.MSG_REDE, 'erro'); });
  }

  document.querySelectorAll('[data-em-breve]').forEach(function (link) {
    link.addEventListener('click', function (evento) {
      evento.preventDefault();
      exibirMensagem('Em breve! Estamos preparando essa novidade.', 'info');
    });
  });
})();
