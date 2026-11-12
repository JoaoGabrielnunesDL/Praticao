// Tela "Serviços": lista os serviços reais de GET /servicos e leva o serviço escolhido ao Novo Agendamento.
(function () {
  var estado = document.getElementById('servicos-estado');
  var lista = document.getElementById('servicos-lista');
  var contagem = document.getElementById('servicos-contagem');
  var aviso = document.getElementById('servicos-aviso');
  var moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  // Somente visual: foto e ícone escolhidos pelo nome do serviço (os dados vêm da API).
  var ICONES = {
    banho: '<path d="M3 12h18l-1.5 7h-15L3 12Z"/><path d="M6 12V7a2 2 0 0 1 4 0v1m8 4V6a2 2 0 0 1 4 0v2M7 22v-3m10 3v-3"/>',
    tosa: '<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><path d="m8 8 13 12M8 16 21 4M10 10l6 6"/>',
    hidratacao: '<path d="M12 3s-7 8-7 13a7 7 0 0 0 14 0c0-5-7-13-7-13Z"/><path d="M9 16c.4 1.5 1.4 2.5 3 2.8"/>',
    unhas: '<circle cx="6" cy="7" r="2"/><circle cx="11" cy="4.5" r="2"/><circle cx="16" cy="5.5" r="2"/><circle cx="19" cy="10" r="2"/><path d="M5 15c0-2.5 2-4.5 4.5-4.5S14 12 14 15c0 2.4-2 4.5-4.5 4.5S5 17.4 5 15Zm9.5 1c0-1.8 1.4-3.2 3.2-3.2s3.2 1.4 3.2 3.2-1.4 3.2-3.2 3.2"/>',
    padrao: '<ellipse cx="5.5" cy="10" rx="2" ry="2.6"/><ellipse cx="9.5" cy="5.6" rx="2" ry="2.6"/><ellipse cx="14.5" cy="5.6" rx="2" ry="2.6"/><ellipse cx="18.5" cy="10" rx="2" ry="2.6"/><path d="M12 11.5c-3.2 0-6 3.4-6 6.1 0 2 1.7 3 3.4 2.6 1-.3 1.7-.6 2.6-.6s1.6.3 2.6.6c1.7.4 3.4-.6 3.4-2.6 0-2.7-2.8-6.1-6-6.1Z"/>'
  };

  function tipoVisual(nome) {
    var n = (nome || '').toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (n.indexOf('banho') >= 0) return 'banho';
    if (n.indexOf('tosa') >= 0) return 'tosa';
    if (n.indexOf('hidrat') >= 0) return 'hidratacao';
    if (n.indexOf('unha') >= 0) return 'unhas';
    return 'padrao';
  }

  function criar(tag, classe, texto) {
    var el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texto !== undefined) el.textContent = texto;
    return el;
  }

  function cartaoServico(servico) {
    var tipo = tipoVisual(servico.nome);
    var cartao = criar('article', 'servico-opcao');

    var midia = criar('div', 'servico-opcao__midia servico-opcao__midia--' + tipo);
    midia.setAttribute('aria-hidden', 'true');
    var badge = criar('span', 'servico-opcao__badge');
    badge.innerHTML = '<svg viewBox="0 0 24 24">' + ICONES[tipo] + '</svg>';
    midia.appendChild(badge);
    if (servico.duracao_min) midia.appendChild(criar('span', 'servico-opcao__duracao', '◷ ' + servico.duracao_min + ' min'));

    var corpo = criar('div', 'servico-opcao__corpo');
    var titulo = criar('h3', 'servico-opcao__nome', servico.nome);
    titulo.id = 'servico-' + servico.id;
    corpo.append(titulo, criar('p', 'servico-opcao__descricao', servico.descricao || ''));

    var rodape = criar('div', 'servico-opcao__rodape');
    var preco = criar('p', 'servico-opcao__preco');
    preco.append(criar('span', '', 'Valor'), criar('strong', '', typeof servico.preco === 'number' ? moeda.format(servico.preco) : '—'));
    var escolher = criar('a', 'btn btn--laranja servico-opcao__botao');
    escolher.href = 'agendar.html?servico=' + encodeURIComponent(servico.id);
    escolher.setAttribute('aria-describedby', titulo.id);
    var seta = criar('span', '', '→');
    seta.setAttribute('aria-hidden', 'true');
    escolher.append('Escolher serviço ', seta);
    rodape.append(preco, escolher);

    cartao.append(midia, corpo, rodape);
    return cartao;
  }

  function cartaoEstado(icone, titulo, mensagem, acao) {
    var cartao = criar('section', 'servicos-vazio');
    cartao.setAttribute('role', 'status');
    var simbolo = criar('span', 'servicos-vazio__icone', icone);
    simbolo.setAttribute('aria-hidden', 'true');
    cartao.append(simbolo, criar('h3', '', titulo), criar('p', '', mensagem));
    if (acao) {
      var botao = criar('button', 'btn btn--laranja servicos-botao', acao.texto);
      botao.type = 'button';
      botao.addEventListener('click', acao.aoClicar);
      cartao.appendChild(botao);
    }
    return cartao;
  }

  function mostrarEstado(conteudo) {
    lista.hidden = true;
    lista.replaceChildren();
    estado.replaceChildren(conteudo);
  }

  function carregar() {
    contagem.textContent = 'Carregando...';
    lista.hidden = true;
    window.ui.mostrarCarregando(estado, 'Carregando serviços...');
    window.api.apiFetch('/servicos').then(function (resposta) {
      return window.api.lerJsonSeguro(resposta).then(function (corpo) {
        if (!resposta.ok) { var erro = new Error(window.api.mensagemDeErro(corpo)); erro.status = resposta.status; throw erro; }
        if (!Array.isArray(corpo)) throw new Error('A API respondeu em um formato inesperado.');
        return corpo;
      });
    }).then(function (servicos) {
      if (!servicos.length) {
        contagem.textContent = 'Nenhum serviço disponível no momento.';
        mostrarEstado(cartaoEstado('🛁', 'Nenhum serviço disponível', 'No momento não há serviços disponíveis para agendamento. Tente novamente mais tarde.', { texto: 'Tentar novamente', aoClicar: carregar }));
        return;
      }
      contagem.textContent = servicos.length === 1 ? '1 serviço disponível' : servicos.length + ' serviços disponíveis';
      estado.replaceChildren();
      lista.replaceChildren.apply(lista, servicos.map(cartaoServico));
      lista.hidden = false;
    }).catch(function (erro) {
      contagem.textContent = 'Não foi possível carregar os serviços.';
      if (erro instanceof TypeError || (erro && erro.message === 'Failed to fetch')) {
        lista.hidden = true;
        window.ui.mostrarErroConexao(estado, carregar);
        return;
      }
      mostrarEstado(cartaoEstado('⚠', 'Não foi possível carregar os serviços', (erro && erro.message) || 'Tente novamente em instantes.', { texto: 'Tentar novamente', aoClicar: carregar }));
    });
  }

  // Funcionário e administrador não agendam: avisa em vez de abrir uma tela sem permissão.
  lista.addEventListener('click', function (evento) {
    var link = evento.target.closest('.servico-opcao__botao');
    if (!link) return;
    var usuario = window.auth.getUsuario();
    if (window.auth.getToken() && usuario && usuario.perfil !== 'tutor') {
      evento.preventDefault();
      aviso.textContent = 'Agendamentos são feitos pelo tutor.';
      aviso.hidden = false;
    }
  });

  carregar();
})();
