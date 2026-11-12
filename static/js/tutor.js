// Resumo da área do tutor: somente leitura dos dados disponíveis na API.
(function () {
  if (!window.ui.exigirPerfil(['tutor'])) return;

  var saudacao = document.getElementById('saudacao');
  var resumoAnimais = document.getElementById('resumo-animais');
  var resumoAgendamento = document.getElementById('resumo-agendamento');
  var main = document.querySelector('main');
  function obterJson(caminho) {
    return window.api.apiFetch(caminho).then(function (resposta) {
      return window.api.lerJsonSeguro(resposta).then(function (corpo) {
        if (!resposta.ok) {
          var erro = new Error('Falha na resposta da API.');
          erro.status = resposta.status;
          throw erro;
        }
        return corpo;
      });
    });
  }

  function criarErroVisual(alvo, mensagem, tentarNovamente) {
    var estado = document.createElement('section');
    estado.className = 'ui-estado ui-estado--erro';
    estado.setAttribute('role', 'alert');
    var texto = document.createElement('p');
    texto.className = 'ui-estado__mensagem';
    texto.textContent = mensagem;
    estado.appendChild(texto);
    if (typeof tentarNovamente === 'function') {
      var botao = document.createElement('button');
      botao.type = 'button';
      botao.className = 'ui-botao ui-botao--primario';
      botao.textContent = 'Tentar novamente';
      botao.addEventListener('click', tentarNovamente);
      estado.appendChild(botao);
    }
    alvo.replaceChildren(estado);
  }

  function tratarFalha(alvo, erro, tentarNovamente, mensagem) {
    if (erro && erro.status === 401) return;
    if (erro && erro.status === 403) {
      window.ui.mostrarSemPermissao(main, window.auth.getUsuario());
      return;
    }
    if (erro instanceof TypeError || (erro && erro.message === 'Failed to fetch')) {
      window.ui.mostrarErroConexao(alvo, tentarNovamente);
      return;
    }
    criarErroVisual(alvo, mensagem || 'Não foi possível carregar estas informações. Tente novamente.', tentarNovamente);
  }

  function primeiroNome(nome) {
    return (nome || '').trim().split(/\s+/)[0] || '';
  }

  function mostrarSaudacao(usuario) {
    var texto = document.createElement('p');
    texto.className = 'tutor-boas-vindas__saudacao';
    var nome = primeiroNome(usuario && usuario.nome);
    texto.textContent = nome ? 'Olá, ' + nome + '!' : 'Olá!';
    saudacao.replaceChildren(texto);
  }

  function mostrarAnimais(animais) {
    if (!Array.isArray(animais)) throw new Error('Resposta de animais inválida.');
    if (!animais.length) {
      window.ui.mostrarVazio(resumoAnimais, 'Você ainda não cadastrou nenhum animal.', {
        texto: 'Cadastrar animal',
        aoClicar: function () { window.location.assign('animais.html'); }
      });
      return;
    }
    var texto = document.createElement('p');
    texto.className = 'tutor-card__contagem';
    var quantidade = document.createElement('strong');
    quantidade.textContent = animais.length === 1 ? '1 animal' : animais.length + ' animais';
    texto.appendChild(quantidade);
    texto.appendChild(document.createTextNode(' ' + (animais.length === 1 ? 'cadastrado' : 'cadastrados')));
    var link = document.createElement('a');
    link.className = 'tutor-card__acao';
    link.href = 'animais.html';
    link.textContent = 'Ver meus animais';
    resumoAnimais.replaceChildren(texto, link);
  }

  function dataValida(valor) {
    if (typeof valor !== 'string') return null;
    var data = new Date(valor);
    return Number.isNaN(data.getTime()) ? null : data;
  }

  function formatarData(data) {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(data);
  }

  function formatarHora(data) {
    return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(data);
  }

  function mostrarProximoAgendamento(agendamentos, animais, servicos) {
    if (!Array.isArray(agendamentos) || !Array.isArray(animais) || !Array.isArray(servicos)) {
      throw new Error('Resposta de agendamentos inválida.');
    }
    var animaisDoTutor = new Map(animais.map(function (animal) { return [String(animal.id), animal]; }));
    var servicosPorId = new Map(servicos.map(function (servico) { return [String(servico.id), servico]; }));
    var agora = new Date();
    var proximo = agendamentos.map(function (agendamento) {
      return { registro: agendamento, data: dataValida(agendamento.data_hora) };
    }).filter(function (item) {
      return item.data && item.data > agora &&
        (item.registro.status === 'AGENDADO' || item.registro.status === 'CONFIRMADO') &&
        animaisDoTutor.has(String(item.registro.animal_id));
    }).sort(function (a, b) { return a.data - b.data; })[0];

    if (!proximo) {
      window.ui.mostrarVazio(resumoAgendamento, 'Você ainda não possui agendamentos.', {
        texto: 'Agendar serviço',
        aoClicar: function () { window.location.assign('agendar.html'); }
      });
      return;
    }

    var agendamento = proximo.registro;
    var animal = animaisDoTutor.get(String(agendamento.animal_id));
    var servico = servicosPorId.get(String(agendamento.servico_id));
    var card = document.createElement('div');
    card.className = 'tutor-agendamento';
    var nomeAnimal = document.createElement('p');
    nomeAnimal.className = 'tutor-agendamento__animal';
    nomeAnimal.textContent = animal.nome;
    var nomeServico = document.createElement('p');
    nomeServico.className = 'tutor-agendamento__servico';
    nomeServico.textContent = servico ? servico.nome : 'Serviço não disponível';
    var dataHora = document.createElement('p');
    dataHora.className = 'tutor-agendamento__data-hora';
    dataHora.textContent = formatarData(proximo.data) + ' · ' + formatarHora(proximo.data);
    var status = document.createElement('span');
    status.className = 'tutor-status' + (agendamento.status === 'CONFIRMADO' ? ' tutor-status--confirmado' : '');
    status.textContent = agendamento.status === 'CONFIRMADO' ? 'Confirmado' : 'Agendado';
    card.append(nomeAnimal, nomeServico, dataHora, status);
    resumoAgendamento.replaceChildren(card);
  }

  function iniciarCarregamento() {
    window.ui.mostrarCarregando(saudacao, 'Carregando...');
    window.ui.mostrarCarregando(resumoAnimais, 'Carregando...');
    window.ui.mostrarCarregando(resumoAgendamento, 'Carregando...');
  }

  function carregarPainel() {
    iniciarCarregamento();
    return obterJson('/me').then(function (usuario) {
      if (!usuario || !usuario.id) throw new Error('Não foi possível carregar sua conta.');
      window.api.salvarSessao(window.auth.getToken(), usuario);
      if (!window.ui.exigirPerfil(['tutor'])) return null;
      mostrarSaudacao(usuario);
      return Promise.allSettled([obterJson('/animais'), obterJson('/agendamentos'), obterJson('/servicos')]).then(function (resultados) {
        var resultadoAnimais = resultados[0];
        var resultadoAgendamentos = resultados[1];
        var resultadoServicos = resultados[2];
        if (resultados.some(function (r) { return r.status === 'rejected' && r.reason && r.reason.status === 401; })) return;
        if (resultados.some(function (r) { return r.status === 'rejected' && r.reason && r.reason.status === 403; })) {
          window.ui.mostrarSemPermissao(main, usuario);
          return;
        }
        if (resultadoAnimais.status === 'fulfilled') {
          try { mostrarAnimais(resultadoAnimais.value); }
          catch (erroAnimais) { tratarFalha(resumoAnimais, erroAnimais, carregarPainel); }
        } else {
          tratarFalha(resumoAnimais, resultadoAnimais.reason, carregarPainel);
        }
        if (resultadoAgendamentos.status === 'fulfilled' && resultadoAnimais.status === 'fulfilled' && resultadoServicos.status === 'fulfilled') {
          try { mostrarProximoAgendamento(resultadoAgendamentos.value, resultadoAnimais.value, resultadoServicos.value); }
          catch (erroAgendamento) { tratarFalha(resumoAgendamento, erroAgendamento, carregarPainel); }
        } else {
          var falha = [resultadoAgendamentos, resultadoAnimais, resultadoServicos].find(function (r) { return r.status === 'rejected'; });
          tratarFalha(resumoAgendamento, falha && falha.reason, carregarPainel);
        }
      });
    }).catch(function (erro) {
      if (erro && erro.status === 401) return;
      if (erro && erro.status === 403) {
        window.ui.mostrarSemPermissao(main, window.auth.getUsuario());
        return;
      }
      tratarFalha(saudacao, erro, carregarPainel, 'Não foi possível carregar sua conta. Tente novamente.');
      tratarFalha(resumoAnimais, erro, carregarPainel, 'Não foi possível carregar seus animais. Tente novamente.');
      tratarFalha(resumoAgendamento, erro, carregarPainel, 'Não foi possível carregar seu próximo agendamento. Tente novamente.');
    });
  }

  carregarPainel();
})();
