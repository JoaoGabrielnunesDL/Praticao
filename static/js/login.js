// login.js — abas e integração dos formulários com a API.
(function () {
  var abaEntrar = document.getElementById('aba-entrar');
  var abaCadastro = document.getElementById('aba-cadastro');
  var painelEntrar = document.getElementById('painel-entrar');
  var painelCadastro = document.getElementById('painel-cadastro');
  var mensagemPagina = document.getElementById('mensagem-pagina');
  var cartaoAutenticacao = document.getElementById('cartao-autenticacao');
  var contextoArea = document.getElementById('contexto-area');
  var acessoNegado = document.getElementById('acesso-negado-login');
  var areaInformada = new URLSearchParams(window.location.search).get('area');
  var areaSolicitada = areaInformada === 'tutor' || areaInformada === 'funcionario' ? areaInformada : null;
  var enviandoLogin = false;
  var enviandoCadastro = false;

  if (window.auth.getToken()) cartaoAutenticacao.hidden = true;
  if (areaSolicitada === 'tutor' || areaSolicitada === 'funcionario') {
    document.getElementById('contexto-area-titulo').textContent = areaSolicitada === 'tutor' ? 'Área do Tutor' : 'Área do Funcionário';
    document.getElementById('contexto-area-mensagem').textContent = areaSolicitada === 'tutor'
      ? 'Entre ou cadastre-se para acessar sua área de tutor.'
      : 'Entre com sua conta para acessar a área do funcionário.';
    contextoArea.hidden = false;
  }

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

  function perfilNome(perfil) {
    return { tutor: 'tutor', funcionario: 'funcionário', administrador: 'administrador' }[perfil] || 'usuário';
  }

  function mostrarAcessoAreaNegado(usuario) {
    var nomeArea = areaSolicitada === 'funcionario' ? 'funcionário' : 'tutor';
    document.getElementById('acesso-negado-mensagem').textContent = 'Você já está autenticado como ' + perfilNome(usuario.perfil) + ' e não possui acesso à área do ' + nomeArea + '.';
    cartaoAutenticacao.hidden = true;
    contextoArea.hidden = true;
    acessoNegado.hidden = false;
    document.getElementById('acesso-negado-voltar').onclick = function () { window.ui.irParaPaginaInicial(usuario); };
  }

  function resolverNext(usuario) {
    var next = new URLSearchParams(window.location.search).get('next');
    if (!next || next.indexOf('\\') >= 0 || next.indexOf('//') === 0) return Promise.resolve(null);
    var destino;
    try { destino = new URL(next, window.location.origin); } catch (_) { return Promise.resolve(null); }
    if (destino.origin !== window.location.origin) return Promise.resolve(null);
    var permissoes = {
      '/': ['tutor', 'funcionario', 'administrador'],
      '/index.html': ['tutor', 'funcionario', 'administrador'],
      '/perfil.html': ['tutor', 'funcionario', 'administrador'],
      '/tutor.html': ['tutor'],
      '/agendar.html': ['tutor'],
      '/painel.html': ['funcionario', 'administrador'],
      '/admin.html': ['administrador']
    };
    var permitidos = permissoes[destino.pathname];
    if (!permitidos || permitidos.indexOf(usuario.perfil) === -1) return Promise.resolve(null);
    return fetch(destino.pathname, { method: 'HEAD', credentials: 'same-origin' }).then(function (resposta) {
      return resposta.ok ? destino.pathname + destino.search + destino.hash : null;
    }).catch(function () { return null; });
  }

  function destinoAposLogin(usuario) {
    return resolverNext(usuario).then(function (destino) {
      if (destino) return destino;
      return window.ui.irParaPaginaInicial(usuario).then(function () { return null; });
    });
  }

  function carregarUsuario(token) {
    return window.api.apiFetch('/me', { headers: { Authorization: 'Bearer ' + token } }).then(function (resposta) {
      if (!resposta.ok) throw new Error('Não foi possível carregar os dados da conta.');
      return buscarCorpo(resposta);
    }).then(function (usuario) {
      if (!usuario || !usuario.id) throw new Error('A resposta da conta está incompleta.');
      window.api.salvarSessao(token, usuario);
      if (areaSolicitada && !window.ui.usuarioPodeAcessarArea(usuario, areaSolicitada)) {
        mostrarAcessoAreaNegado(usuario);
        return null;
      }
      return destinoAposLogin(usuario).then(function (destino) { if (destino) window.location.href = destino; });
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
          var texto = resposta.status === 401 ? 'E-mail ou senha inválidos.' : resposta.status === 422 ? 'Preencha o e-mail e a senha.' : window.api.mensagemDeErro(corpo);
          throw new Error(texto);
        }
        if (!corpo || !corpo.access_token) throw new Error('O servidor não retornou o token de acesso.');
        return carregarUsuario(corpo.access_token);
      });
    });
  }

  document.getElementById('form-login').addEventListener('submit', function (evento) {
    evento.preventDefault();
    if (enviandoLogin) return;
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
    enviandoLogin = true;
    botao.disabled = true;
    botao.setAttribute('aria-busy', 'true');
    botao.textContent = 'Entrando...';
    entrar(email, senha).catch(function (erro) {
      erroDoFormulario('erro-login', erro instanceof TypeError || erro.message === 'Failed to fetch' ? window.api.MSG_REDE : erro.message);
    }).then(function () { enviandoLogin = false; botao.disabled = false; botao.removeAttribute('aria-busy'); botao.textContent = 'Entrar'; });
  });

  document.getElementById('form-cadastro').addEventListener('submit', function (evento) {
    evento.preventDefault();
    if (enviandoCadastro) return;
    erroDoFormulario('erro-cadastro', '');
    var campos = {
      nome: document.getElementById('cad-nome'),
      telefone: document.getElementById('cad-telefone'), email: document.getElementById('cad-email'),
      senha: document.getElementById('cad-senha'), confirma: document.getElementById('cad-confirma'),
      aceite: document.getElementById('cad-aceite')
    };
    var valido = true;
    function conferir(campo, erro) { if (!window.validacao.mostrarErro(campo, erro)) valido = false; }
    conferir(campos.nome, campos.nome.value.trim().length < 2 || campos.nome.value.trim().length > 100 ? 'Informe um nome entre 2 e 100 caracteres.' : '');
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
    enviandoCadastro = true;
    botao.disabled = true;
    botao.setAttribute('aria-busy', 'true');
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
        window.ui.mostrarSucesso('Cadastro realizado com sucesso. Entrando na sua conta.');
        exibirMensagem('Cadastro realizado com sucesso. Entrando na sua conta.', 'info');
        return entrar(dados.email, dados.senha);
      });
    }).catch(function (erro) {
      erroDoFormulario('erro-cadastro', erro.message === 'Failed to fetch' ? window.api.MSG_REDE : erro.message);
    }).then(function () { enviandoCadastro = false; botao.disabled = false; botao.removeAttribute('aria-busy'); botao.textContent = 'Criar conta'; });
  });

  var parametros = new URLSearchParams(window.location.search);
  if (parametros.get('msg') === 'agendar') exibirMensagem('Entre ou cadastre-se para concluir seu agendamento.');
  if (parametros.get('msg') === 'sessao-expirada') exibirMensagem('Sua sessão expirou. Faça login novamente.', 'erro');

  // Remove o aviso da barra de endereço depois de apresentá-lo.
  if (parametros.has('msg')) {
    parametros.delete('msg');
    var consulta = parametros.toString();
    history.replaceState(null, '', window.location.pathname + (consulta ? '?' + consulta : '') + window.location.hash);
  }

  // Confere a sessão sem deixar o 401 do /me recarregar esta página.
  var tokenSalvo = window.auth.getToken();
  if (tokenSalvo) {
    window.api.apiFetch('/me', { headers: { Authorization: 'Bearer ' + tokenSalvo } })
      .then(function (resposta) {
        if (resposta.status === 401) {
          window.api.limparSessao();
          cartaoAutenticacao.hidden = false;
          return null;
        }
        if (!resposta.ok) throw new Error('Falha ao confirmar a sessão.');
        return window.api.lerJsonSeguro(resposta);
      })
      .then(function (usuario) {
        if (!usuario || !usuario.id) return;
        window.api.salvarSessao(tokenSalvo, usuario);
        if (areaSolicitada && !window.ui.usuarioPodeAcessarArea(usuario, areaSolicitada)) {
          mostrarAcessoAreaNegado(usuario);
          return null;
        }
        return destinoAposLogin(usuario).then(function (destino) { if (destino) window.location.href = destino; });
      })
      .catch(function () { cartaoAutenticacao.hidden = false; exibirMensagem(window.api.MSG_REDE, 'erro'); });
  }

  document.querySelectorAll('[data-em-breve]').forEach(function (link) {
    link.addEventListener('click', function (evento) {
      evento.preventDefault();
      exibirMensagem('Em breve! Estamos preparando essa novidade.', 'info');
    });
  });
})();
