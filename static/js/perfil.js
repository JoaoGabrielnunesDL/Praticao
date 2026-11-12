// Consulta e atualiza os dados permitidos da conta autenticada.
(function () {
  var perfisPermitidos = ['tutor', 'funcionario', 'administrador'];
  if (!window.ui.exigirPerfil(perfisPermitidos)) return;

  var token = window.auth.getToken();
  var tela = document.querySelector('main');
  var carregando = document.getElementById('perfil-carregando');
  var conteudo = document.getElementById('perfil-conteudo');
  var dados = document.getElementById('perfil-dados');
  var falha = document.getElementById('perfil-falha');
  var formulario = document.getElementById('perfil-formulario');
  var campoNome = document.getElementById('perfil-nome-edicao');
  var campoEmail = document.getElementById('perfil-email-edicao');
  var campoTelefone = document.getElementById('perfil-telefone-edicao');
  var botaoEditar = document.getElementById('perfil-editar');
  var botaoVoltar = document.getElementById('perfil-voltar');
  var botaoSalvar = document.getElementById('perfil-salvar');
  var botaoCancelar = document.getElementById('perfil-cancelar');
  var erroGeral = document.getElementById('perfil-erro');
  var sucessoGeral = document.getElementById('perfil-sucesso');
  var formularioSenha = document.getElementById('perfil-senha-formulario');
  var campoSenhaAtual = document.getElementById('perfil-senha-atual');
  var campoSenhaNova = document.getElementById('perfil-senha-nova');
  var campoSenhaConfirmar = document.getElementById('perfil-senha-confirmar');
  var botaoAtualizarSenha = document.getElementById('perfil-senha-atualizar');
  var menuTutor = document.getElementById('perfil-menu-tutor');
  var usuarioAtual = null;
  var salvando = false;
  var alterandoSenha = false;

  function lerResposta(resposta) {
    return window.api.lerJsonSeguro(resposta).then(function (corpo) {
      if (!resposta.ok) {
        var erro = new Error(mensagemErro(resposta.status, corpo));
        erro.status = resposta.status;
        erro.corpo = corpo;
        throw erro;
      }
      return corpo;
    });
  }

  function mensagemErro(status, corpo) {
    if (status === 409 && corpo && typeof corpo.detail === 'string' && /e-?mail/i.test(corpo.detail)) return 'Este e-mail já está em uso.';
    if (corpo && typeof corpo.detail === 'string') return corpo.detail;
    if (status === 422) return 'Confira os dados informados e tente novamente.';
    if (corpo && Array.isArray(corpo.detail)) return 'Confira os campos destacados e tente novamente.';
    if (status >= 500) return 'O servidor não conseguiu atualizar seu perfil. Tente novamente.';
    return 'Não foi possível concluir a solicitação. Tente novamente.';
  }

  function nomePerfil(perfil) {
    var tipos = { tutor: 'Tutor', funcionario: 'Funcionário', administrador: 'Administrador' };
    return tipos[perfil] || 'Conta';
  }

  function mostrarDados(usuario) {
    usuarioAtual = usuario;
    window.auth.salvarSessao(token, usuario);
    document.getElementById('perfil-nome').textContent = usuario.nome || '';
    document.getElementById('perfil-email').textContent = usuario.email || '';
    document.getElementById('perfil-telefone-exibicao').textContent = usuario.telefone || 'Não informado';
    document.getElementById('perfil-tipo').textContent = nomePerfil(usuario.perfil);
    document.getElementById('perfil-status').textContent = usuario.ativo ? 'Ativa' : 'Desativada';
    menuTutor.hidden = usuario.perfil !== 'tutor';
    tela.classList.toggle('perfil-layout--com-menu', usuario.perfil === 'tutor');
    document.getElementById('ano-atual').textContent = String(new Date().getFullYear());
    carregando.hidden = true;
    falha.hidden = true;
    conteudo.hidden = false;
    dados.hidden = false;
    botaoEditar.hidden = false;
    botaoVoltar.hidden = false;
  }

  function mostrarErro(erro) {
    carregando.hidden = true;
    conteudo.hidden = true;
    if (erro && erro.status === 401) return;
    if (erro && erro.status === 403) {
      window.ui.mostrarSemPermissao(tela, window.auth.getUsuario());
      return;
    }
    falha.hidden = false;
    if (erro instanceof TypeError || (erro && erro.message === 'Failed to fetch')) {
      window.ui.mostrarErroConexao(falha, carregarPerfil);
      return;
    }
    var mensagem = erro && erro.message ? erro.message : 'Não foi possível carregar seus dados.';
    falha.replaceChildren();
    var texto = document.createElement('p');
    texto.className = 'mensagem-erro';
    texto.setAttribute('role', 'alert');
    texto.textContent = mensagem;
    var tentar = document.createElement('button');
    tentar.type = 'button';
    tentar.className = 'btn btn--contorno';
    tentar.textContent = 'Tentar novamente';
    tentar.addEventListener('click', carregarPerfil);
    falha.append(texto, tentar);
  }

  function tratarErroAtualizacao(erro) {
    if (erro && erro.status === 401) return;
    if (erro && erro.status === 403) {
      window.ui.mostrarSemPermissao(tela, window.auth.getUsuario());
      return;
    }
    erroGeral.textContent = erro instanceof TypeError || (erro && erro.message === 'Failed to fetch')
      ? window.api.MSG_REDE
      : (erro && erro.message ? erro.message : 'Não foi possível atualizar seus dados.');
    erroGeral.hidden = false;
    sucessoGeral.hidden = true;
  }

  function carregarPerfil() {
    carregando.hidden = false;
    conteudo.hidden = true;
    falha.hidden = true;
    window.ui.mostrarCarregando(carregando, 'Carregando perfil...');
    return window.api.apiFetch('/me').then(lerResposta).then(function (usuario) {
      if (!usuario || perfisPermitidos.indexOf(usuario.perfil) === -1) {
        window.ui.mostrarSemPermissao(tela, usuario || window.auth.getUsuario());
        return;
      }
      mostrarDados(usuario);
    }).catch(mostrarErro);
  }

  function limparErros() {
    erroGeral.textContent = '';
    erroGeral.hidden = true;
    sucessoGeral.textContent = '';
    sucessoGeral.hidden = true;
    window.validacao.mostrarErro(campoNome, '');
    window.validacao.mostrarErro(campoTelefone, '');
  }

  function entrarEdicao() {
    if (!usuarioAtual) return;
    limparErros();
    campoNome.value = usuarioAtual.nome || '';
    campoEmail.value = usuarioAtual.email || '';
    campoTelefone.value = usuarioAtual.telefone || '';
    dados.hidden = true;
    document.querySelector('.perfil__acoes').hidden = true;
    formulario.hidden = false;
    campoNome.focus();
  }

  function cancelarEdicao() {
    if (salvando) return;
    limparErros();
    formulario.reset();
    formulario.hidden = true;
    dados.hidden = false;
    document.querySelector('.perfil__acoes').hidden = false;
    botaoEditar.focus();
  }

  function validar() {
    var nome = campoNome.value.trim();
    var telefone = campoTelefone.value.trim();
    var valido = true;
    if (nome.length < 2) {
      window.validacao.mostrarErro(campoNome, 'Informe um nome com pelo menos 2 caracteres.');
      valido = false;
    } else if (nome.length > 100) {
      window.validacao.mostrarErro(campoNome, 'O nome deve ter no máximo 100 caracteres.');
      valido = false;
    } else {
      window.validacao.mostrarErro(campoNome, '');
    }
    if (telefone.length > 20) {
      window.validacao.mostrarErro(campoTelefone, 'O telefone deve ter no máximo 20 caracteres.');
      valido = false;
    } else {
      window.validacao.mostrarErro(campoTelefone, '');
    }
    if (!valido) (campoNome.getAttribute('aria-invalid') === 'true' ? campoNome : campoTelefone).focus();
    return valido;
  }

  function marcarCarregando(ativo) {
    salvando = ativo;
    botaoSalvar.disabled = ativo;
    botaoCancelar.disabled = ativo;
    botaoSalvar.setAttribute('aria-busy', String(ativo));
    botaoSalvar.textContent = ativo ? 'Salvando...' : 'Salvar alterações';
    campoNome.disabled = ativo;
    campoTelefone.disabled = ativo;
  }

  function enviar(evento) {
    evento.preventDefault();
    if (salvando || !validar()) return;
    salvarComConfirmacao();
  }

  function salvarComConfirmacao() {
    var telefone = campoTelefone.value.trim();
    var confirmacao = telefone || !usuarioAtual.telefone ? Promise.resolve(true) : window.ui.confirmarExclusao(
      'O campo telefone está vazio. Salvar agora irá remover o telefone cadastrado. Deseja continuar?',
      'Confirmar telefone vazio'
    );
    confirmacao.then(function (confirmado) {
      if (!confirmado) return;
      marcarCarregando(true);
      erroGeral.textContent = '';
      erroGeral.hidden = true;
      sucessoGeral.textContent = '';
      sucessoGeral.hidden = true;
      var payload = { nome: campoNome.value.trim(), telefone: telefone || null };
      return window.api.apiFetch('/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(lerResposta).then(function (usuario) {
        mostrarDados(usuario);
        formulario.reset();
        formulario.hidden = true;
        document.querySelector('.perfil__acoes').hidden = false;
        erroGeral.hidden = true;
        sucessoGeral.textContent = 'Perfil atualizado com sucesso.';
        sucessoGeral.hidden = false;
      }).catch(function (erro) {
        if (erro && erro.status !== 401 && erro.status !== 403) {
          erroGeral.textContent = erro.message || 'Não foi possível atualizar seus dados.';
          erroGeral.hidden = false;
          if (erro.status === 422 && erro.corpo && Array.isArray(erro.corpo.detail)) {
            erro.corpo.detail.forEach(function (item) {
              if (item.loc && item.loc.indexOf('nome') >= 0) window.validacao.mostrarErro(campoNome, 'Confira o nome informado.');
              if (item.loc && item.loc.indexOf('telefone') >= 0) window.validacao.mostrarErro(campoTelefone, 'Confira o telefone informado.');
            });
          }
        }
        tratarErroAtualizacao(erro);
      }).finally(function () { marcarCarregando(false); });
    });
  }

  function bytesUtf8(valor) {
    return new TextEncoder().encode(valor).length;
  }

  function limparErrosSenha() {
    window.validacao.mostrarErro(campoSenhaAtual, '');
    window.validacao.mostrarErro(campoSenhaNova, '');
    window.validacao.mostrarErro(campoSenhaConfirmar, '');
  }

  function validarSenha() {
    var atual = campoSenhaAtual.value;
    var nova = campoSenhaNova.value;
    var confirmacao = campoSenhaConfirmar.value;
    var valido = true;

    if (!atual) {
      window.validacao.mostrarErro(campoSenhaAtual, 'Informe sua senha atual.');
      valido = false;
    } else {
      window.validacao.mostrarErro(campoSenhaAtual, '');
    }
    if (!nova) {
      window.validacao.mostrarErro(campoSenhaNova, 'Informe a nova senha.');
      valido = false;
    } else if (nova.length < 6) {
      window.validacao.mostrarErro(campoSenhaNova, 'A nova senha deve ter pelo menos 6 caracteres.');
      valido = false;
    } else if (bytesUtf8(nova) > 72) {
      window.validacao.mostrarErro(campoSenhaNova, 'A nova senha não pode exceder 72 bytes em UTF-8.');
      valido = false;
    } else if (nova === atual) {
      window.validacao.mostrarErro(campoSenhaNova, 'A nova senha deve ser diferente da senha atual.');
      valido = false;
    } else {
      window.validacao.mostrarErro(campoSenhaNova, '');
    }
    if (!confirmacao) {
      window.validacao.mostrarErro(campoSenhaConfirmar, 'Confirme a nova senha.');
      valido = false;
    } else if (nova !== confirmacao) {
      window.validacao.mostrarErro(campoSenhaConfirmar, 'As novas senhas não coincidem.');
      valido = false;
    } else {
      window.validacao.mostrarErro(campoSenhaConfirmar, '');
    }

    if (!valido) {
      [campoSenhaAtual, campoSenhaNova, campoSenhaConfirmar].some(function (campo) {
        if (campo.getAttribute('aria-invalid') === 'true') {
          campo.focus();
          return true;
        }
        return false;
      });
    }
    return valido;
  }

  function marcarCarregandoSenha(ativo) {
    alterandoSenha = ativo;
    botaoAtualizarSenha.disabled = ativo;
    botaoAtualizarSenha.setAttribute('aria-busy', String(ativo));
    botaoAtualizarSenha.textContent = ativo ? 'Atualizando...' : 'Atualizar senha';
    campoSenhaAtual.disabled = ativo;
    campoSenhaNova.disabled = ativo;
    campoSenhaConfirmar.disabled = ativo;
  }

  function enviarSenha(evento) {
    evento.preventDefault();
    if (alterandoSenha || !validarSenha()) return;

    erroGeral.hidden = true;
    sucessoGeral.hidden = true;
    limparErrosSenha();
    marcarCarregandoSenha(true);
    window.api.apiFetch('/me/alterar-senha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senha_atual: campoSenhaAtual.value, nova_senha: campoSenhaNova.value })
    }).then(lerResposta).then(function () {
      formularioSenha.reset();
      limparErrosSenha();
      erroGeral.hidden = true;
      sucessoGeral.textContent = 'Senha atualizada com sucesso!';
      sucessoGeral.hidden = false;
    }).catch(function (erro) {
      if (erro && erro.status === 401) return;
      if (erro && erro.status === 403) {
        window.ui.mostrarSemPermissao(tela, window.auth.getUsuario());
        return;
      }
      if (erro && erro.status === 400 && erro.message === 'A senha atual está incorreta.') {
        window.validacao.mostrarErro(campoSenhaAtual, erro.message);
        campoSenhaAtual.focus();
        sucessoGeral.hidden = true;
        return;
      }
      if (erro && erro.status === 400 && erro.message === 'A nova senha deve ser diferente da senha atual.') {
        window.validacao.mostrarErro(campoSenhaNova, erro.message);
        campoSenhaNova.focus();
        sucessoGeral.hidden = true;
        return;
      }
      if (erro && erro.status === 422 && erro.corpo && Array.isArray(erro.corpo.detail)) {
        var detalhe = erro.corpo.detail[0];
        var mensagem = detalhe && detalhe.msg ? detalhe.msg.replace(/^Value error,\s*/i, '') : 'Confira a nova senha informada.';
        window.validacao.mostrarErro(campoSenhaNova, mensagem);
        campoSenhaNova.focus();
        sucessoGeral.hidden = true;
        return;
      }
      tratarErroAtualizacao(erro);
    }).finally(function () { marcarCarregandoSenha(false); });
  }

  botaoEditar.addEventListener('click', entrarEdicao);
  botaoVoltar.addEventListener('click', function () { window.ui.irParaPaginaInicial(usuarioAtual); });
  botaoCancelar.addEventListener('click', cancelarEdicao);
  document.getElementById('perfil-sair').addEventListener('click', function (evento) {
    evento.preventDefault();
    window.auth.sair();
  });
  document.querySelectorAll('[data-perfil-em-breve]').forEach(function (botao) {
    botao.addEventListener('click', function () { window.ui.mostrarInformacao('A tela de agendamentos ainda não está disponível.'); });
  });
  formulario.addEventListener('submit', enviar);
  formularioSenha.addEventListener('submit', enviarSenha);
  [campoSenhaAtual, campoSenhaNova, campoSenhaConfirmar].forEach(function (campo) {
    campo.addEventListener('input', function () {
      window.validacao.mostrarErro(campo, '');
      erroGeral.hidden = true;
      sucessoGeral.hidden = true;
    });
  });
  campoNome.addEventListener('input', function () {
    window.validacao.mostrarErro(campoNome, '');
    erroGeral.hidden = true;
    sucessoGeral.hidden = true;
  });
  campoTelefone.addEventListener('input', function () {
    window.validacao.mostrarErro(campoTelefone, '');
    erroGeral.hidden = true;
    sucessoGeral.hidden = true;
  });
  carregarPerfil();
})();
