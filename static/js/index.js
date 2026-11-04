// index.js — serviços, formulário de agendamento e avisos da página inicial.
(function () {
  var CHAVE_RASCUNHO = 'agendamentoRascunho';
  var form = document.getElementById('form-agendamento');
  var servicoSelect = document.getElementById('ag-servico');
  var petSelect = document.getElementById('ag-pet');
  var telefone = document.getElementById('ag-telefone');
  var aviso = document.getElementById('mensagem-agendamento');

  function numeros(valor) { return valor.replace(/\D/g, ''); }

  function dataLocalIso(data) {
    return data.getFullYear() + '-' + String(data.getMonth() + 1).padStart(2, '0') + '-' + String(data.getDate()).padStart(2, '0');
  }

  function formatarTelefone(valor) {
    var n = numeros(valor).slice(0, 11);
    if (n.length < 3) return n ? '(' + n : '';
    if (n.length < 7) return '(' + n.slice(0, 2) + ') ' + n.slice(2);
    if (n.length < 11) return '(' + n.slice(0, 2) + ') ' + n.slice(2, 6) + '-' + n.slice(6);
    return '(' + n.slice(0, 2) + ') ' + n.slice(2, 7) + '-' + n.slice(7);
  }

  function erroCampo(id, texto) {
    var campo = document.getElementById(id);
    var erro = document.getElementById('erro-' + id);
    if (erro) { erro.textContent = texto || ''; erro.hidden = !texto; }
    if (campo) campo.setAttribute('aria-invalid', texto ? 'true' : 'false');
    return !texto;
  }

  function mensagem(texto) {
    aviso.textContent = texto || '';
    aviso.hidden = !texto;
  }

  function carregarServicos() {
    window.api.apiFetch('/servicos').then(function (resposta) {
      if (!resposta.ok) return;
      return resposta.json().then(function (servicos) {
        if (!Array.isArray(servicos) || !servicos.length) return;
        // Guarda as opções estáticas que ainda não foram cadastradas na API.
        var opcoesLocais = Array.from(servicoSelect.options).slice(1).map(function (opcao) {
          return { valor: opcao.value, nome: opcao.dataset.nome || opcao.textContent };
        }).filter(function (servico) {
          var nome = servico.nome.trim().toLocaleLowerCase('pt-BR');
          return nome !== 'banho e tosa';
        });
        servicoSelect.replaceChildren(new Option('Escolha um serviço', ''));
        var nomesApi = new Set();
        servicos.forEach(function (servico) {
          var nomeNormalizado = servico.nome.trim().toLocaleLowerCase('pt-BR');
          if (nomeNormalizado === 'banho e tosa') return;
          var opcao = new Option(servico.nome, String(servico.id));
          opcao.dataset.nome = servico.nome;
          servicoSelect.appendChild(opcao);
          nomesApi.add(nomeNormalizado);
        });
        opcoesLocais.forEach(function (servico) {
          if (!nomesApi.has(servico.nome.trim().toLocaleLowerCase('pt-BR'))) {
            var opcao = new Option(servico.nome, servico.valor);
            opcao.dataset.nome = servico.nome;
            servicoSelect.appendChild(opcao);
          }
        });

        var cartoes = document.getElementById('cartoes-servicos');
        servicos.forEach(function (servico) {
          // Atualiza cartões já existentes pelo nome e preserva os serviços
          // estáticos que ainda não foram cadastrados na API.
          var cartao = Array.from(cartoes.querySelectorAll('.servico-card')).find(function (item) {
            var titulo = item.querySelector('h3');
            return titulo && titulo.textContent.trim().toLocaleLowerCase('pt-BR') === servico.nome.trim().toLocaleLowerCase('pt-BR');
          });
          if (!cartao) {
            cartao = document.createElement('article');
            cartao.className = 'servico-card';
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

  function carregarDadosDaSessao() {
    var usuario = window.api.obterUsuario();
    if (usuario && usuario.nome) document.getElementById('ag-nome').value = usuario.nome;
    if (!window.api.obterToken() || !usuario || usuario.perfil !== 'tutor') {
      petSelect.disabled = true;
      petSelect.replaceChildren(new Option('Entre para escolher seu pet', ''));
      return;
    }
    window.api.apiFetch('/animais').then(function (resposta) {
      if (!resposta.ok) return;
      return resposta.json().then(function (animais) {
        petSelect.replaceChildren(new Option(animais.length ? 'Selecione seu pet' : 'Cadastre seu pet na área do tutor', ''));
        animais.forEach(function (animal) {
          var nome = animal.nome + (animal.especie ? ' (' + animal.especie + ')' : '');
          petSelect.appendChild(new Option(nome, String(animal.id)));
        });
        petSelect.disabled = animais.length === 0;
        if (animais.length) petSelect.required = true;
      });
    }).catch(function () {
      petSelect.disabled = true;
      petSelect.replaceChildren(new Option('Não foi possível carregar seus pets', ''));
    });
  }

  telefone.addEventListener('input', function () { telefone.value = formatarTelefone(telefone.value); });
  document.getElementById('ag-data').min = dataLocalIso(new Date());

  form.addEventListener('submit', function (evento) {
    evento.preventDefault();
    mensagem('');
    var data = document.getElementById('ag-data').value;
    var nome = document.getElementById('ag-nome').value.trim();
    var telefoneLimpo = numeros(telefone.value);
    var valido = true;
    if (!servicoSelect.value) valido = erroCampo('ag-servico', 'Escolha um serviço.') && valido;
    else erroCampo('ag-servico', '');
    if (!data) valido = erroCampo('ag-data', 'Escolha uma data.') && valido;
    else if (data < dataLocalIso(new Date())) valido = erroCampo('ag-data', 'A data não pode estar no passado.') && valido;
    else erroCampo('ag-data', '');
    if (!document.getElementById('ag-horario').value) valido = erroCampo('ag-horario', 'Escolha um horário.') && valido;
    else erroCampo('ag-horario', '');
    if (nome.length < 2) valido = erroCampo('ag-nome', 'Informe seu nome.') && valido;
    else erroCampo('ag-nome', '');
    if (telefoneLimpo.length < 10) valido = erroCampo('ag-telefone', 'Informe um telefone com DDD.') && valido;
    else erroCampo('ag-telefone', '');
    if (!petSelect.disabled && !petSelect.value) valido = erroCampo('ag-pet', 'Selecione seu pet.') && valido;
    else erroCampo('ag-pet', '');
    if (!valido) {
      var primeiroErro = form.querySelector('[aria-invalid="true"]');
      if (primeiroErro) primeiroErro.focus();
      return;
    }

    var opcaoServico = servicoSelect.options[servicoSelect.selectedIndex];
    var rascunho = {
      servico: opcaoServico.dataset.nome || opcaoServico.textContent,
      servico_id: /^\d+$/.test(servicoSelect.value) ? Number(servicoSelect.value) : null,
      data: data,
      horario: document.getElementById('ag-horario').value,
      nome: nome,
      telefone: telefone.value.trim(),
      animal_id: petSelect.value ? Number(petSelect.value) : null
    };
    try { sessionStorage.setItem(CHAVE_RASCUNHO, JSON.stringify(rascunho)); }
    catch (erro) { mensagem('Não foi possível guardar o pedido neste navegador. Tente novamente.'); return; }

    var usuario = window.api.obterUsuario();
    if (!window.api.obterToken() || !usuario) {
      window.location.href = 'login.html?msg=agendar';
    } else if (usuario.perfil === 'tutor') {
      window.location.href = 'tutor.html';
    } else {
      mensagem('Agendamentos são feitos pelo tutor.');
      document.getElementById('agendamento').scrollIntoView({ behavior: 'smooth', block: 'start' });
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
  carregarDadosDaSessao();
})();
