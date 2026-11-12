// Cadastro, consulta, edicao e exclusao dos animais da conta autenticada.
(function () {
  if (!window.ui.exigirPerfil(['tutor'])) return;

  var modal = document.getElementById('modal-animal');
  var formulario = document.getElementById('form-animal');
  var tituloModal = document.getElementById('formulario-titulo');
  var nome = document.getElementById('animal-nome');
  var especie = document.getElementById('animal-especie');
  var raca = document.getElementById('animal-raca');
  var campos = [nome, especie, raca];
  var botaoSalvar = document.getElementById('animal-submit');
  var botaoCancelar = document.getElementById('animal-cancelar');
  var botaoFecharModal = document.getElementById('modal-fechar');
  var botaoAbrirCadastro = document.getElementById('abrir-cadastro');
  var erroFormulario = document.getElementById('form-erro');
  var lista = document.getElementById('lista-animais');
  var contagem = document.getElementById('lista-contagem');
  var feedback = document.getElementById('animais-feedback');
  var feedbackTitulo = document.getElementById('animais-feedback-titulo');
  var feedbackMensagem = document.getElementById('animais-feedback-mensagem');
  var animais = [];
  var animalEditando = null;
  var enviando = false;
  var focoAntesDoModal = null;
  var temporizadorFeedback = null;
  var resumoTotal = document.getElementById('resumo-total');
  var resumoEspecies = document.getElementById('resumo-especies');
  var blocoMais = document.getElementById('animais-mais');
  var botaoAbrirCadastroMais = document.getElementById('abrir-cadastro-mais');

  function carregarEstado() {
    window.ui.mostrarCarregando(lista, 'Carregando seus animais...');
    lista.setAttribute('aria-busy', 'true');
    contagem.textContent = 'Carregando...';
    blocoMais.hidden = true;
  }

  function lerResposta(resposta) {
    return window.api.lerJsonSeguro(resposta).then(function (corpo) {
      if (!resposta.ok) {
        var erro = new Error(mensagemApi(resposta.status, corpo));
        erro.status = resposta.status;
        throw erro;
      }
      return corpo;
    });
  }

  function mensagemApi(status, corpo) {
    if (status === 409 && corpo && typeof corpo.detail === 'string') return corpo.detail;
    if (status === 409) return 'Este animal possui agendamentos e não pode ser excluído.';
    if (status === 422) return 'Confira os dados do animal e tente novamente.';
    if (status === 404) return 'Este animal não foi encontrado. Atualize a lista e tente novamente.';
    if (status >= 500) return 'O servidor não conseguiu concluir a solicitação. Tente novamente.';
    if (corpo && typeof corpo.detail === 'string') return corpo.detail;
    return 'Não foi possível concluir a solicitação. Tente novamente.';
  }

  function erroDeRede(erro) {
    return erro instanceof TypeError || (erro && erro.message === 'Failed to fetch');
  }

  function tratarFalha(erro, alvo) {
    if (erro && erro.status === 401) { fecharModal(true); return; }
    if (erro && erro.status === 403) {
      fecharModal(true);
      window.ui.mostrarSemPermissao(document.querySelector('main'), window.auth.getUsuario());
      return;
    }
    if (erroDeRede(erro)) {
      window.ui.mostrarErroConexao(alvo || lista, carregarAnimais);
      return;
    }
    window.ui.mostrarToast(erro && erro.message ? erro.message : 'Não foi possível carregar seus animais.', 'erro');
  }

  // Mensagem de destaque da página (sucesso ou exclusão bloqueada).
  function esconderFeedback() {
    window.clearTimeout(temporizadorFeedback);
    feedback.hidden = true;
  }

  function mostrarFeedback(tipo, titulo, mensagem) {
    window.clearTimeout(temporizadorFeedback);
    feedback.hidden = true;
    feedback.className = 'animais-feedback animais-feedback--' + tipo;
    feedback.setAttribute('role', tipo === 'bloqueio' ? 'alert' : 'status');
    feedbackTitulo.textContent = titulo;
    feedbackMensagem.textContent = mensagem;
    feedback.hidden = false;
    feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (tipo === 'sucesso') temporizadorFeedback = window.setTimeout(esconderFeedback, 8000);
  }

  // Imagens ilustrativas já existentes no projeto, escolhidas pela espécie informada.
  // Nunca representam a foto real do animal: o card exibe a etiqueta "Imagem ilustrativa".
  var IMAGENS_ESPECIE = {
    cao: { src: 'img/dica-2.jpg', posicao: '64% 30%' },
    gato: { src: 'img/dica-3.jpg', posicao: '70% 42%' }
  };
  var ICONES_ESPECIE = { cao: '🐶', gato: '🐱', ave: '🐦', coelho: '🐰', roedor: '🐹', outro: '🐾' };
  var SVG_EDITAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></svg>';
  var SVG_EXCLUIR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>';
  var SVG_PATA = '<svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="5.5" cy="10" rx="2" ry="2.6"/><ellipse cx="9.5" cy="5.6" rx="2" ry="2.6"/><ellipse cx="14.5" cy="5.6" rx="2" ry="2.6"/><ellipse cx="18.5" cy="10" rx="2" ry="2.6"/><path d="M12 11.5c-3.2 0-6 3.4-6 6.1 0 2 1.7 3 3.4 2.6 1-.3 1.7-.6 2.6-.6s1.6.3 2.6.6c1.7.4 3.4-.6 3.4-2.6 0-2.7-2.8-6.1-6-6.1Z"/></svg>';

  function tipoEspecie(valor) {
    var texto = (valor || '').toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (/\b(cao|cachorro|cachorra|cadela|canino|dog)\b/.test(texto)) return 'cao';
    if (/\b(gato|gata|felino|cat)\b/.test(texto)) return 'gato';
    if (/\b(ave|passaro|calopsita|papagaio|periquito)\b/.test(texto)) return 'ave';
    if (/\b(coelho|coelha)\b/.test(texto)) return 'coelho';
    if (/\b(roedor|hamster|porquinho|chinchila)\b/.test(texto)) return 'roedor';
    return 'outro';
  }

  function criarIlustracao() {
    var ilustracao = document.createElement('span');
    ilustracao.className = 'animal-card__ilustracao';
    ilustracao.innerHTML = SVG_PATA;
    return ilustracao;
  }

  function criarMidia(animal) {
    var tipo = tipoEspecie(animal.especie);
    var midia = document.createElement('div');
    midia.className = 'animal-card__midia';
    var imagem = IMAGENS_ESPECIE[tipo];
    if (!imagem) { midia.appendChild(criarIlustracao()); return midia; }
    var foto = document.createElement('img');
    foto.className = 'animal-card__foto';
    foto.src = imagem.src;
    foto.alt = '';
    foto.decoding = 'async';
    foto.style.objectPosition = imagem.posicao;
    var selo = document.createElement('span');
    selo.className = 'animal-card__selo';
    selo.textContent = 'Imagem ilustrativa';
    // Se a imagem não carregar, mostra a ilustração neutra em vez de uma imagem quebrada.
    foto.addEventListener('error', function () {
      foto.replaceWith(criarIlustracao());
      selo.remove();
      midia.classList.remove('animal-card__midia--foto');
    });
    midia.classList.add('animal-card__midia--foto');
    midia.append(foto, selo);
    return midia;
  }

  function botaoAcao(classe, svg, texto, rotulo) {
    var botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'animal-card__botao ' + classe;
    botao.innerHTML = svg;
    var span = document.createElement('span');
    span.className = 'animal-card__botao-texto';
    span.textContent = texto;
    botao.appendChild(span);
    botao.setAttribute('aria-label', rotulo);
    return botao;
  }

  function criarAnimalCard(animal) {
    var card = document.createElement('article');
    card.className = 'animal-card';
    card.setAttribute('aria-labelledby', 'animal-titulo-' + animal.id);

    var corpo = document.createElement('div');
    corpo.className = 'animal-card__corpo';
    var titulo = document.createElement('h3');
    titulo.className = 'animal-card__nome';
    titulo.id = 'animal-titulo-' + animal.id;
    titulo.textContent = animal.nome;
    var especieTexto = document.createElement('p');
    especieTexto.className = 'animal-card__especie';
    var icone = document.createElement('span');
    icone.setAttribute('aria-hidden', 'true');
    icone.textContent = ICONES_ESPECIE[tipoEspecie(animal.especie)];
    especieTexto.append(icone, document.createTextNode(' ' + animal.especie));
    var racaTexto = document.createElement('p');
    racaTexto.className = 'animal-card__raca' + (animal.raca ? '' : ' animal-card__raca--vazia');
    racaTexto.textContent = animal.raca ? 'Raça: ' + animal.raca : 'Raça não informada';
    corpo.append(titulo, especieTexto, racaTexto);

    var acoes = document.createElement('div');
    acoes.className = 'animal-card__acoes';
    var editar = botaoAcao('animal-card__botao--editar', SVG_EDITAR, 'Editar', 'Editar ' + animal.nome);
    editar.setAttribute('aria-haspopup', 'dialog');
    editar.addEventListener('click', function () { iniciarEdicao(animal, editar); });
    var excluir = botaoAcao('animal-card__botao--excluir', SVG_EXCLUIR, 'Excluir', 'Excluir ' + animal.nome);
    excluir.addEventListener('click', function () { excluirAnimal(animal, excluir); });
    acoes.append(editar, excluir);

    card.append(criarMidia(animal), corpo, acoes);
    return card;
  }

  function atualizarResumo() {
    // Agrupa sinônimos reconhecidos (ex.: "Cão" e "Cachorro"); demais espécies contam pelo nome informado.
    var especies = new Set(animais.map(function (animal) {
      var tipo = tipoEspecie(animal.especie);
      return tipo !== 'outro' ? tipo : (animal.especie || '').trim().toLocaleLowerCase('pt-BR');
    }).filter(Boolean));
    resumoTotal.textContent = String(animais.length);
    resumoEspecies.textContent = String(especies.size);
  }

  function criarEstadoVazio() {
    var vazio = document.createElement('div');
    vazio.className = 'animais-vazio';
    vazio.setAttribute('role', 'status');
    var icone = document.createElement('span');
    icone.className = 'animais-vazio__icone';
    icone.innerHTML = SVG_PATA;
    var titulo = document.createElement('h3');
    titulo.textContent = 'Você ainda não cadastrou nenhum animal';
    var texto = document.createElement('p');
    texto.textContent = 'Cadastre seu primeiro companheiro para começar.';
    var botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'btn btn--laranja animais-botao';
    botao.setAttribute('aria-haspopup', 'dialog');
    botao.innerHTML = '<span aria-hidden="true">+</span> Cadastrar Animal';
    botao.addEventListener('click', function () { abrirCadastro(botao); });
    vazio.append(icone, titulo, texto, botao);
    return vazio;
  }

  function desenharLista() {
    lista.setAttribute('aria-busy', 'false');
    contagem.textContent = animais.length === 1 ? '1 animal cadastrado' : animais.length + ' animais cadastrados';
    atualizarResumo();
    blocoMais.hidden = !animais.length;
    if (!animais.length) {
      lista.replaceChildren(criarEstadoVazio());
      return;
    }
    var grade = document.createElement('div');
    grade.className = 'animais-lista';
    animais.forEach(function (animal) { grade.appendChild(criarAnimalCard(animal)); });
    lista.replaceChildren(grade);
  }

  function carregarAnimais() {
    carregarEstado();
    return window.api.apiFetch('/animais').then(lerResposta).then(function (dados) {
      if (!Array.isArray(dados)) throw new Error('A resposta de animais está em um formato inesperado.');
      animais = dados;
      desenharLista();
    }).catch(function (erro) {
      lista.setAttribute('aria-busy', 'false');
      contagem.textContent = 'Não foi possível carregar a lista';
      tratarFalha(erro, lista);
    });
  }

  function validarCampo(campo, idErro, rotulo, maximo) {
    var valor = campo.value.trim();
    var mensagem = '';
    if (campo.required && !valor) mensagem = 'Informe ' + rotulo + '.';
    else if (valor && valor.length > maximo) mensagem = rotulo.charAt(0).toUpperCase() + rotulo.slice(1) + ' deve ter no máximo ' + maximo + ' caracteres.';
    var erro = document.getElementById(idErro);
    erro.textContent = mensagem;
    erro.hidden = !mensagem;
    campo.setAttribute('aria-invalid', mensagem ? 'true' : 'false');
    return !mensagem;
  }

  function validarFormulario() {
    erroFormulario.textContent = '';
    erroFormulario.hidden = true;
    var validoNome = validarCampo(nome, 'erro-animal-nome', 'o nome do animal', 100);
    var validoEspecie = validarCampo(especie, 'erro-animal-especie', 'a espécie', 50);
    var validoRaca = validarCampo(raca, 'erro-animal-raca', 'a raça', 80);
    if (!validoNome) nome.focus();
    else if (!validoEspecie) especie.focus();
    else if (!validoRaca) raca.focus();
    if (!(validoNome && validoEspecie && validoRaca)) {
      erroFormulario.textContent = 'Confira os campos destacados antes de salvar.';
      erroFormulario.hidden = false;
      return false;
    }
    return true;
  }

  function limparFormulario() {
    formulario.reset();
    animalEditando = null;
    tituloModal.textContent = 'Cadastrar Animal';
    botaoSalvar.textContent = 'Salvar animal';
    erroFormulario.textContent = '';
    erroFormulario.hidden = true;
    campos.forEach(function (campo) {
      campo.setAttribute('aria-invalid', 'false');
      var erro = document.getElementById('erro-' + campo.id);
      erro.textContent = '';
      erro.hidden = true;
    });
  }

  function abrirModal(gatilho) {
    focoAntesDoModal = gatilho || document.activeElement;
    if (!modal.open) modal.showModal();
    modal.scrollTop = 0;
    nome.focus();
  }

  function fecharModal(semDevolverFoco) {
    if (!modal.open) return;
    if (enviando && !semDevolverFoco) return;
    modal.close();
    limparFormulario();
    var alvo = focoAntesDoModal;
    focoAntesDoModal = null;
    if (!semDevolverFoco && alvo && alvo.isConnected && typeof alvo.focus === 'function') alvo.focus();
    else if (!semDevolverFoco) botaoAbrirCadastro.focus();
  }

  function abrirCadastro(gatilho) {
    if (enviando) return;
    limparFormulario();
    abrirModal(gatilho);
  }

  function preencherFormulario(animal, gatilho) {
    limparFormulario();
    animalEditando = animal.id;
    nome.value = animal.nome || '';
    especie.value = animal.especie || '';
    raca.value = animal.raca || '';
    tituloModal.textContent = 'Editar Animal';
    botaoSalvar.textContent = 'Salvar alterações';
    abrirModal(gatilho);
  }

  function iniciarEdicao(animal, botao) {
    if (enviando) return;
    enviando = true;
    botao.disabled = true;
    botao.setAttribute('aria-busy', 'true');
    var textoBotao = botao.querySelector('.animal-card__botao-texto') || botao;
    textoBotao.textContent = 'Carregando...';
    window.api.apiFetch('/animais/' + encodeURIComponent(animal.id)).then(lerResposta).then(function (animalAtual) {
      if (!animalAtual || String(animalAtual.id) !== String(animal.id)) {
        var erro = new Error('Este animal não foi encontrado. Atualize a lista e tente novamente.');
        erro.status = 404;
        throw erro;
      }
      enviando = false;
      preencherFormulario(animalAtual, botao);
    }).catch(function (erro) {
      tratarFalha(erro, lista);
      if (erro && erro.status === 404) carregarAnimais();
    }).finally(function () {
      enviando = false;
      botao.disabled = false;
      botao.removeAttribute('aria-busy');
      textoBotao.textContent = 'Editar';
    });
  }

  function marcarEnvio(ativo, atualizando) {
    enviando = ativo;
    campos.forEach(function (campo) { campo.disabled = ativo; });
    botaoSalvar.disabled = ativo;
    botaoCancelar.disabled = ativo;
    botaoFecharModal.disabled = ativo;
    if (ativo) {
      botaoSalvar.setAttribute('aria-busy', 'true');
      botaoSalvar.textContent = atualizando ? 'Salvando...' : 'Cadastrando...';
    } else {
      botaoSalvar.removeAttribute('aria-busy');
      botaoSalvar.textContent = animalEditando ? 'Salvar alterações' : 'Salvar animal';
    }
  }

  function enviarFormulario(evento) {
    evento.preventDefault();
    if (enviando || !validarFormulario()) return;
    var atualizando = animalEditando !== null;
    var payload = { nome: nome.value.trim(), especie: especie.value.trim(), raca: raca.value.trim() || null };
    var caminho = atualizando ? '/animais/' + encodeURIComponent(animalEditando) : '/animais';
    marcarEnvio(true, atualizando);
    window.api.apiFetch(caminho, {
      method: atualizando ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(lerResposta).then(function (salvo) {
      marcarEnvio(false);
      fecharModal(false);
      var nomeSalvo = (salvo && salvo.nome) || payload.nome;
      mostrarFeedback('sucesso',
        atualizando ? 'Alterações salvas!' : 'Animal cadastrado com sucesso!',
        atualizando ? 'Os dados de ' + nomeSalvo + ' foram atualizados.' : nomeSalvo + ' já aparece na sua lista de animais.');
      return carregarAnimais();
    }).catch(function (erro) {
      marcarEnvio(false);
      if (erro && (erro.status === 401 || erro.status === 403)) { tratarFalha(erro, lista); return; }
      erroFormulario.textContent = erroDeRede(erro)
        ? window.api.MSG_REDE + ' Seus dados continuam no formulário; tente novamente.'
        : (erro && erro.message) || 'Não foi possível salvar os dados do animal.';
      erroFormulario.hidden = false;
      if (erro && erro.status === 404) { fecharModal(false); carregarAnimais(); }
    });
  }

  function excluirAnimal(animal, botao) {
    if (enviando) return;
    window.ui.confirmarExclusao('Deseja excluir ' + animal.nome + '? Esta ação não pode ser desfeita.', 'Excluir animal').then(function (confirmado) {
      if (!confirmado) return;
      enviando = true;
      botao.disabled = true;
      botao.setAttribute('aria-busy', 'true');
      esconderFeedback();
      return window.api.apiFetch('/animais/' + encodeURIComponent(animal.id), { method: 'DELETE' }).then(lerResposta).then(function () {
        mostrarFeedback('sucesso', 'Animal excluído', animal.nome + ' foi removido da sua lista.');
        return carregarAnimais();
      }).catch(function (erro) {
        if (erro && erro.status === 409) {
          mostrarFeedback('bloqueio', 'Não foi possível excluir ' + animal.nome,
            'Este animal possui agendamentos registrados no histórico (inclusive cancelados ou concluídos) e não pode ser excluído.');
          botao.focus();
          return;
        }
        tratarFalha(erro, lista);
        if (erro && erro.status === 404) carregarAnimais();
      }).finally(function () {
        enviando = false;
        botao.disabled = false;
        botao.removeAttribute('aria-busy');
      });
    });
  }

  function validarPerfilReal() {
    carregarEstado();
    return window.api.apiFetch('/me').then(lerResposta).then(function (usuario) {
      if (!usuario || usuario.perfil !== 'tutor') {
        window.ui.mostrarSemPermissao(document.querySelector('main'), usuario || window.auth.getUsuario());
        return;
      }
      window.auth.salvarSessao(window.auth.getToken(), usuario);
      return carregarAnimais();
    }).catch(function (erro) {
      lista.setAttribute('aria-busy', 'false');
      tratarFalha(erro, lista);
    });
  }

  formulario.addEventListener('submit', enviarFormulario);
  botaoAbrirCadastro.addEventListener('click', function () { abrirCadastro(botaoAbrirCadastro); });
  botaoAbrirCadastroMais.addEventListener('click', function () { abrirCadastro(botaoAbrirCadastroMais); });
  botaoCancelar.addEventListener('click', function () { fecharModal(false); });
  botaoFecharModal.addEventListener('click', function () { fecharModal(false); });
  // Esc fecha o modal (exceto durante o envio) e devolve o foco a quem o abriu.
  modal.addEventListener('cancel', function (evento) {
    evento.preventDefault();
    fecharModal(false);
  });
  document.getElementById('animais-feedback-fechar').addEventListener('click', esconderFeedback);
  campos.forEach(function (campo) {
    campo.addEventListener('input', function () {
      var erro = document.getElementById('erro-' + campo.id);
      if (erro && !erro.hidden) {
        erro.textContent = '';
        erro.hidden = true;
        campo.setAttribute('aria-invalid', 'false');
      }
      if (!campos.some(function (c) { return c.getAttribute('aria-invalid') === 'true'; })) erroFormulario.hidden = true;
    });
  });

  validarPerfilReal();
})();
