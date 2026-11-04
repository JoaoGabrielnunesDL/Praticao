// validacao.js — máscaras, validações e recursos dos campos.
(function () {
  function porId(id) { return document.getElementById(id); }

  function somenteNumeros(valor) { return valor.replace(/\D/g, ''); }

  function mascaraCpf(valor) {
    return somenteNumeros(valor).slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  function mascaraTelefone(valor) {
    var numeros = somenteNumeros(valor).slice(0, 11);
    if (numeros.length <= 2) return numeros ? '(' + numeros : '';
    if (numeros.length <= 6) return '(' + numeros.slice(0, 2) + ') ' + numeros.slice(2);
    if (numeros.length <= 10) return '(' + numeros.slice(0, 2) + ') ' + numeros.slice(2, 6) + '-' + numeros.slice(6);
    return '(' + numeros.slice(0, 2) + ') ' + numeros.slice(2, 7) + '-' + numeros.slice(7);
  }

  function mascaraCep(valor) {
    var numeros = somenteNumeros(valor).slice(0, 8);
    return numeros.length > 5 ? numeros.slice(0, 5) + '-' + numeros.slice(5) : numeros;
  }

  function cpfValido(valor) {
    var cpf = somenteNumeros(valor);
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    var soma = 0;
    for (var i = 0; i < 9; i++) soma += Number(cpf[i]) * (10 - i);
    var digito = (soma * 10) % 11;
    if (digito === 10) digito = 0;
    if (digito !== Number(cpf[9])) return false;
    soma = 0;
    for (var j = 0; j < 10; j++) soma += Number(cpf[j]) * (11 - j);
    digito = (soma * 10) % 11;
    if (digito === 10) digito = 0;
    return digito === Number(cpf[10]);
  }

  function emailValido(valor) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim());
  }

  function mostrarErro(campo, texto) {
    var erro = porId('erro-' + campo.id.replace('cad-', 'cad-').replace('login-', 'login-'));
    if (!erro) erro = porId('erro-' + campo.id);
    if (erro) {
      erro.textContent = texto || '';
      erro.hidden = !texto;
    }
    campo.setAttribute('aria-invalid', texto ? 'true' : 'false');
    return !texto;
  }

  // Apaga o erro assim que a pessoa começa a corrigir o campo.
  document.querySelectorAll('.campo__entrada, #cad-aceite').forEach(function (campo) {
    campo.addEventListener('input', function () {
      var erro = porId('erro-' + campo.id.replace('cad-', 'cad-').replace('login-', 'login-'));
      if (!erro) erro = porId('erro-' + campo.id);
      if (erro && !erro.hidden) mostrarErro(campo, '');
    });
  });

  var cpf = porId('cad-cpf');
  var telefone = porId('cad-telefone');
  var cep = porId('cad-cep');
  if (cpf) cpf.addEventListener('input', function () { cpf.value = mascaraCpf(cpf.value); });
  if (telefone) telefone.addEventListener('input', function () { telefone.value = mascaraTelefone(telefone.value); });
  if (cep) cep.addEventListener('input', function () { cep.value = mascaraCep(cep.value); });

  // Consulta o endereço quando o CEP tiver oito números.
  if (cep) cep.addEventListener('blur', function () {
    var numeros = somenteNumeros(cep.value);
    if (numeros.length !== 8) return;
    fetch('https://viacep.com.br/ws/' + numeros + '/json/')
      .then(function (resposta) { if (!resposta.ok) throw new Error('Falha na consulta'); return resposta.json(); })
      .then(function (dados) {
        if (dados.erro) return;
        porId('cad-rua').value = dados.logradouro || '';
        porId('cad-bairro').value = dados.bairro || '';
        porId('cad-cidade').value = dados.localidade || '';
        porId('cad-uf').value = dados.uf || '';
      })
      .catch(function () { /* O endereço pode ser preenchido manualmente. */ });
  });

  // Mostra ou esconde as senhas.
  document.querySelectorAll('[data-olho]').forEach(function (botao) {
    botao.addEventListener('click', function () {
      var campo = porId(botao.getAttribute('data-olho'));
      if (!campo) return;
      var mostrar = campo.type === 'password';
      campo.type = mostrar ? 'text' : 'password';
      botao.setAttribute('aria-pressed', String(mostrar));
      botao.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha');
    });
  });

  // Atualiza a indicação visual da força da senha.
  var senha = porId('cad-senha');
  if (senha) senha.addEventListener('input', function () {
    var valor = senha.value;
    var nivel = 0;
    if (valor.length >= 6) nivel = 1;
    if (valor.length >= 8 && /[A-Za-z]/.test(valor) && /\d/.test(valor)) nivel = 2;
    if (valor.length >= 10 && /[A-Z]/.test(valor) && /[a-z]/.test(valor) && /\d/.test(valor) && /[^A-Za-z0-9]/.test(valor)) nivel = 3;
    porId('forca-barra').setAttribute('data-nivel', String(nivel));
    porId('forca-texto').textContent = 'Força da senha: ' + (nivel === 0 ? 'digite ao menos 6 caracteres' : nivel === 1 ? 'fraca' : nivel === 2 ? 'média' : 'forte');
  });

  window.validacao = {
    emailValido: emailValido,
    cpfValido: cpfValido,
    somenteNumeros: somenteNumeros,
    mostrarErro: mostrarErro
  };
})();
