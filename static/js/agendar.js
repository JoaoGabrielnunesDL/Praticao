// Novo agendamento do tutor: serviços e animais reais, envio para POST /agendamentos.
(function () {
  if (!window.ui.exigirPerfil(['tutor'])) return;

  var main = document.querySelector('main');
  var estado = document.getElementById('agendar-estado');
  var conteudo = document.getElementById('agendar-conteudo');
  var sucesso = document.getElementById('agendar-sucesso');
  var formulario = document.getElementById('form-agendar');
  var erroGeral = document.getElementById('agendar-erro');
  var servico = document.getElementById('ag-servico');
  var pet = document.getElementById('ag-pet');
  var data = document.getElementById('ag-data');
  var horario = document.getElementById('ag-horario');
  var observacao = document.getElementById('ag-observacao');
  var contador = document.getElementById('ag-observacao-contador');
  var botaoConfirmar = document.getElementById('ag-confirmar');
  var campos = [servico, pet, data, horario, observacao];
  var servicos = [];
  var animais = [];
  var enviando = false;

  var moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  var formatoData = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  // ---------- Utilidades ----------
  function lerResposta(resposta) {
    return window.api.lerJsonSeguro(resposta).then(function (corpo) {
      if (!resposta.ok) {
        var erro = new Error(corpo && typeof corpo.detail === 'string' ? corpo.detail : 'Não foi possível concluir a solicitação.');
        erro.status = resposta.status;
        throw erro;
      }
      return corpo;
    });
  }

  function obterJson(caminho) { return window.api.apiFetch(caminho).then(lerResposta); }

  function erroDeRede(erro) { return erro instanceof TypeError || (erro && erro.message === 'Failed to fetch'); }

  function hojeIso() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function dataHoraLocal(dia, hora) {
    if (!dia || !hora) return null;
    var p = dia.split('-').map(Number), h = hora.split(':').map(Number);
    return new Date(p[0], p[1] - 1, p[2], h[0], h[1]);
  }

  function textoDataHora(dia, hora) {
    var d = dataHoraLocal(dia, hora);
    if (!d) return 'Não selecionado';
    var texto = formatoData.format(d);
    return texto.charAt(0).toUpperCase() + texto.slice(1) + ' às ' + hora;
  }

  function servicoSelecionado() {
    return servicos.find(function (s) { return String(s.id) === servico.value; }) || null;
  }

  function petSelecionado() {
    return animais.find(function (a) { return String(a.id) === pet.value; }) || null;
  }

  function nomePet(animal) { return animal.nome + (animal.especie ? ' (' + animal.especie + ')' : ''); }

  // ---------- Estados da página ----------
  function mostrarSomente(qual) {
    conteudo.hidden = qual !== 'formulario';
    sucesso.hidden = qual !== 'sucesso';
    if (qual !== 'estado') estado.replaceChildren();
  }

  function cartaoEstado(icone, titulo, mensagem, acoes) {
    var cartao = document.createElement('section');
    cartao.className = 'cartao agendar-vazio';
    cartao.setAttribute('role', 'status');
    var simbolo = document.createElement('span');
    simbolo.className = 'agendar-vazio__icone';
    simbolo.setAttribute('aria-hidden', 'true');
    simbolo.textContent = icone;
    var h2 = document.createElement('h2');
    h2.textContent = titulo;
    var p = document.createElement('p');
    p.textContent = mensagem;
    cartao.append(simbolo, h2, p);
    if (acoes && acoes.length) {
      var area = document.createElement('div');
      area.className = 'agendar-vazio__acoes';
      acoes.forEach(function (acao) {
        var el = document.createElement(acao.href ? 'a' : 'button');
        el.className = 'btn agendar-botao ' + (acao.secundario ? 'btn--contorno' : 'btn--laranja');
        el.textContent = acao.texto;
        if (acao.href) el.href = acao.href;
        else { el.type = 'button'; el.addEventListener('click', acao.aoClicar); }
        area.appendChild(el);
      });
      cartao.appendChild(area);
    }
    return cartao;
  }

  function tratarFalhaCarregamento(erro) {
    if (erro && erro.status === 401) return; // api.js já encerra a sessão e leva ao login
    if (erro && erro.status === 403) { window.ui.mostrarSemPermissao(main, window.auth.getUsuario()); return; }
    mostrarSomente('estado');
    if (erroDeRede(erro)) { window.ui.mostrarErroConexao(estado, carregar); return; }
    estado.replaceChildren(cartaoEstado('⚠', 'Não foi possível carregar o agendamento',
      (erro && erro.message) || 'Ocorreu um erro ao buscar os dados. Tente novamente.',
      [{ texto: 'Tentar novamente', aoClicar: carregar }]));
  }

  // ---------- Carregamento ----------
  function preencherServicos() {
    servico.replaceChildren(new Option('Selecione um serviço', ''));
    servicos.forEach(function (s) {
      var rotulo = s.nome;
      if (typeof s.preco === 'number') rotulo += ' — ' + moeda.format(s.preco);
      if (s.duracao_min) rotulo += ' · ' + s.duracao_min + ' min';
      servico.appendChild(new Option(rotulo, String(s.id)));
    });
  }

  function preencherAnimais() {
    pet.replaceChildren(new Option('Selecione o pet', ''));
    animais.forEach(function (a) { pet.appendChild(new Option(nomePet(a), String(a.id))); });
    if (animais.length === 1) pet.value = String(animais[0].id);
  }

  function carregar() {
    mostrarSomente('estado');
    window.ui.mostrarCarregando(estado, 'Carregando serviços e seus pets...');
    return obterJson('/me').then(function (usuario) {
      // Confirma o perfil no servidor, sem confiar apenas no que está salvo no navegador.
      if (!usuario || usuario.perfil !== 'tutor') {
        window.ui.mostrarSemPermissao(main, usuario || window.auth.getUsuario());
        return;
      }
      window.auth.salvarSessao(window.auth.getToken(), usuario);
      return Promise.all([obterJson('/servicos'), obterJson('/animais')]).then(function (resultado) {
        if (!Array.isArray(resultado[0]) || !Array.isArray(resultado[1])) throw new Error('A API respondeu em um formato inesperado.');
        servicos = resultado[0];
        animais = resultado[1];
        if (!servicos.length || !animais.length) { mostrarVazios(); return; }
        preencherServicos();
        // Serviço escolhido na tela Serviços (agendar.html?servico=ID). ID inválido ou inexistente é ignorado.
        var servicoUrl = new URLSearchParams(window.location.search).get('servico');
        if (servicoUrl && servicos.some(function (s) { return String(s.id) === servicoUrl; })) servico.value = servicoUrl;
        preencherAnimais();
        data.min = hojeIso();
        atualizarResumo();
        mostrarSomente('formulario');
      });
    }).catch(tratarFalhaCarregamento);
  }

  function mostrarVazios() {
    mostrarSomente('estado');
    var cartoes = [];
    if (!animais.length) {
      cartoes.push(cartaoEstado('🐾', 'Nenhum animal cadastrado',
        'Para agendar um serviço, cadastre primeiro o seu pet.',
        [{ texto: 'Cadastrar animal', href: 'animais.html' }, { texto: 'Voltar ao Painel', href: 'tutor.html', secundario: true }]));
    }
    if (!servicos.length) {
      cartoes.push(cartaoEstado('🛁', 'Nenhum serviço disponível',
        'No momento não há serviços disponíveis para agendamento. Tente novamente mais tarde.',
        [{ texto: 'Tentar novamente', aoClicar: carregar, secundario: !animais.length }]));
    }
    var grade = document.createElement('div');
    grade.className = 'agendar-vazios';
    grade.append.apply(grade, cartoes);
    estado.replaceChildren(grade);
  }

  // ---------- Resumo ----------
  function atualizarResumo() {
    var s = servicoSelecionado(), a = petSelecionado();
    document.getElementById('resumo-servico').textContent = s ? s.nome : 'Não selecionado';
    document.getElementById('resumo-pet').textContent = a ? nomePet(a) : 'Não selecionado';
    document.getElementById('resumo-data').textContent = data.value && horario.value ? textoDataHora(data.value, horario.value) : 'Não selecionado';
    document.getElementById('resumo-duracao').textContent = s && s.duracao_min ? s.duracao_min + ' minutos' : '—';
    document.getElementById('resumo-preco').textContent = s && typeof s.preco === 'number' ? moeda.format(s.preco) : '—';
  }

  // ---------- Validação ----------
  function erroCampo(campo, mensagem) {
    var erro = document.getElementById('erro-' + campo.id);
    erro.textContent = mensagem || '';
    erro.hidden = !mensagem;
    campo.setAttribute('aria-invalid', mensagem ? 'true' : 'false');
    campo.closest('.campo').classList.toggle('campo--valido', !mensagem && Boolean(campo.value) && campo !== observacao);
    return !mensagem;
  }

  function mostrarErroGeral(texto) {
    erroGeral.textContent = texto || '';
    erroGeral.hidden = !texto;
  }

  function validar() {
    mostrarErroGeral('');
    var quando = dataHoraLocal(data.value, horario.value);
    var ok = [
      erroCampo(servico, servico.value ? '' : 'Selecione o serviço.'),
      erroCampo(pet, pet.value ? '' : 'Selecione o pet.'),
      erroCampo(data, !data.value ? 'Escolha a data.' : (data.value < hojeIso() ? 'A data não pode estar no passado.' : '')),
      erroCampo(horario, !horario.value ? 'Escolha o horário.' : (quando && quando <= new Date() && data.value >= hojeIso() ? 'Esse horário já passou. Escolha um horário futuro.' : '')),
      erroCampo(observacao, observacao.value.trim().length > 300 ? 'Use no máximo 300 caracteres.' : '')
    ];
    var valido = ok.every(Boolean);
    if (!valido) {
      mostrarErroGeral('Confira os campos destacados antes de confirmar.');
      var primeiro = campos.find(function (c) { return c.getAttribute('aria-invalid') === 'true'; });
      if (primeiro) primeiro.focus();
    }
    return valido;
  }

  // ---------- Envio ----------
  function marcarEnvio(ativo) {
    enviando = ativo;
    campos.forEach(function (c) { c.disabled = ativo; });
    botaoConfirmar.disabled = ativo;
    botaoConfirmar.setAttribute('aria-busy', String(ativo));
    botaoConfirmar.textContent = ativo ? 'Confirmando...' : 'Confirmar Agendamento';
  }

  function tratarErroEnvio(erro) {
    if (erro && erro.status === 401) return;
    if (erro && erro.status === 403) { window.ui.mostrarSemPermissao(main, window.auth.getUsuario()); return; }
    if (erroDeRede(erro)) { mostrarErroGeral(window.api.MSG_REDE + ' Seus dados foram mantidos; tente novamente.'); return; }
    var status = erro && erro.status, detalhe = (erro && erro.message) || '';
    if (status === 409) {
      erroCampo(horario, 'Este horário já está ocupado. Escolha outro horário.');
      mostrarErroGeral('O horário escolhido não está mais disponível.');
      horario.focus();
    } else if (status === 400 && /futur/i.test(detalhe)) {
      erroCampo(horario, 'Escolha uma data e um horário futuros.');
      mostrarErroGeral(detalhe);
      horario.focus();
    } else if (status === 400 && /servi/i.test(detalhe)) {
      erroCampo(servico, 'Este serviço não está mais disponível.');
      mostrarErroGeral(detalhe + '. Atualize a página para ver os serviços atuais.');
      servico.focus();
    } else if (status === 404) {
      erroCampo(pet, 'Este pet não foi encontrado na sua conta.');
      mostrarErroGeral('Não encontramos o pet selecionado. Atualize a página e tente novamente.');
      pet.focus();
    } else if (status === 422) {
      mostrarErroGeral('Confira os dados informados e tente novamente.');
    } else {
      mostrarErroGeral(status >= 500 ? 'O servidor não conseguiu registrar o agendamento. Tente novamente.' : (detalhe || 'Não foi possível registrar o agendamento.'));
    }
  }

  function mostrarSucesso(agendamento) {
    var s = servicoSelecionado(), a = petSelecionado();
    var partes = (agendamento && typeof agendamento.data_hora === 'string' ? agendamento.data_hora : data.value + 'T' + horario.value).split('T');
    document.getElementById('sucesso-servico').textContent = s ? s.nome : '';
    document.getElementById('sucesso-pet').textContent = a ? nomePet(a) : '';
    document.getElementById('sucesso-data').textContent = textoDataHora(partes[0], (partes[1] || '').slice(0, 5));
    var status = (agendamento && agendamento.status) || 'AGENDADO';
    var rotulos = { AGENDADO: 'Agendado', CONFIRMADO: 'Confirmado', CANCELADO: 'Cancelado', CONCLUIDO: 'Concluído' };
    document.getElementById('sucesso-status').textContent = rotulos[status] || status;
    mostrarSomente('sucesso');
    sucesso.focus();
    sucesso.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function enviar(evento) {
    evento.preventDefault();
    if (enviando || !validar()) return;
    var payload = {
      animal_id: Number(pet.value),
      servico_id: Number(servico.value),
      data_hora: data.value + 'T' + horario.value + ':00',
      observacao: observacao.value.trim() || null
    };
    marcarEnvio(true);
    window.api.apiFetch('/agendamentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(lerResposta).then(function (agendamento) {
      marcarEnvio(false);
      mostrarSucesso(agendamento);
    }).catch(function (erro) {
      marcarEnvio(false);
      tratarErroEnvio(erro);
    });
  }

  function novoAgendamento() {
    formulario.reset();
    campos.forEach(function (c) { erroCampo(c, ''); });
    mostrarErroGeral('');
    preencherAnimais();
    contador.textContent = '0/300';
    atualizarResumo();
    mostrarSomente('formulario');
    servico.focus();
  }

  // ---------- Eventos ----------
  formulario.addEventListener('submit', enviar);
  document.getElementById('agendar-outro').addEventListener('click', novoAgendamento);
  campos.forEach(function (campo) {
    campo.addEventListener(campo.tagName === 'SELECT' || campo.type === 'date' ? 'change' : 'input', function () {
      if (campo.getAttribute('aria-invalid') === 'true') erroCampo(campo, '');
      if (!campos.some(function (c) { return c.getAttribute('aria-invalid') === 'true'; })) mostrarErroGeral('');
      atualizarResumo();
    });
  });
  observacao.addEventListener('input', function () { contador.textContent = observacao.value.length + '/300'; });

  carregar();
})();
