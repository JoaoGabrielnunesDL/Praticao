// index.js — serviços, botão de agendamento e avisos da página inicial.
(function () {
  var botaoAgendar = document.getElementById('botao-agendar');
  var aviso = document.getElementById('mensagem-agendamento');

  function mensagem(texto) {
    aviso.textContent = texto || '';
    aviso.hidden = !texto;
  }

  function carregarServicos() {
    window.api.apiFetch('/servicos').then(function (resposta) {
      if (!resposta.ok) return;
      return resposta.json().then(function (servicos) {
        if (!Array.isArray(servicos) || !servicos.length) return;

        var cartoes = document.getElementById('cartoes-servicos');
        servicos.forEach(function (servico) {
          // Atualiza cartões já existentes pelo nome e preserva os serviços
          // estáticos que ainda não foram cadastrados na API.
          var cartao = Array.from(cartoes.querySelectorAll('.servico-card')).find(function (item) {
            var titulo = item.querySelector('h3');
            return titulo && titulo.textContent.trim().toLocaleLowerCase('pt-BR') === servico.nome.trim().toLocaleLowerCase('pt-BR');
          });
          if (!cartao) {
            cartao = document.createElement('a');
            cartao.className = 'servico-card';
            cartao.href = 'servicos.html';
            var icone = document.createElement('span');
            icone.className = 'servico-card__icone';
            icone.setAttribute('aria-hidden', 'true');
            icone.textContent = '🐾';
            var texto = document.createElement('div');
            var titulo = document.createElement('h3');
            var preco = document.createElement('p');
            preco.className = 'servico-card__preco';
            var detalhe = document.createElement('p');
            detalhe.className = 'servico-card__detalhe';
            detalhe.textContent = 'Consulte os detalhes';
            texto.appendChild(titulo);
            texto.appendChild(preco);
            texto.appendChild(detalhe);
            cartao.appendChild(icone);
            cartao.appendChild(texto);
            cartoes.appendChild(cartao);
          }
          cartao.querySelector('h3').textContent = servico.nome;
          cartao.querySelector('.servico-card__preco').textContent = 'a partir de ' + Number(servico.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        });
      });
    }).catch(function () { /* Mantém os serviços estáticos em caso de falha. */ });
  }

  // Único ponto de ação da seção: segue o fluxo de agendamento já existente.
  botaoAgendar.addEventListener('click', function () {
    mensagem('');
    var usuario = window.api.obterUsuario();
    if (!window.api.obterToken() || !usuario) {
      window.location.href = 'login.html?msg=agendar&next=' + encodeURIComponent('/agendar.html');
    } else if (usuario.perfil === 'tutor') {
      window.location.href = 'agendar.html';
    } else {
      mensagem('Agendamentos são feitos pelo tutor.');
    }
  });

  document.querySelectorAll('[data-em-breve]').forEach(function (link) {
    link.addEventListener('click', function (evento) {
      evento.preventDefault();
      var topo = document.getElementById('aviso-cabecalho');
      topo.textContent = 'Em breve! Estamos preparando essa novidade.';
      topo.hidden = false;
      window.setTimeout(function () { topo.hidden = true; }, 3500);
    });
  });

  document.getElementById('ano-atual').textContent = String(new Date().getFullYear());
  carregarServicos();
})();
