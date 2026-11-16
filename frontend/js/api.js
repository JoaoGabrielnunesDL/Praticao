// Função única para falar com a API (usa o token automaticamente).
// Todo erro lançado traz: message (texto para a pessoa), status (400, 401, 403...) e tipo:
//   'rede' (API fora do ar / sem internet), 'timeout' (demorou demais), 'servidor' (erro 5xx) ou 'requisicao' (4xx).
const TEMPO_LIMITE_MS = 15000;

function mensagemErro(dados) {
  const detalhe = dados && dados.detail;
  if (typeof detalhe === 'string') return detalhe;
  if (Array.isArray(detalhe)) return 'Confira os dados informados.';
  return 'Algo deu errado. Tente novamente.';
}

function erroApi(mensagem, tipo, status) {
  const erro = new Error(mensagem);
  erro.tipo = tipo;
  erro.status = status;
  return erro;
}

async function api(caminho, { token, headers = {}, ...opcoes } = {}) {
  const t = token || Auth.token();
  if (t) headers.Authorization = 'Bearer ' + t;
  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);
  let resposta;
  try {
    resposta = await fetch(API_URL + caminho, { ...opcoes, headers, signal: controle.signal });
  } catch (x) {
    if (x.name === 'AbortError') throw erroApi('O servidor demorou para responder. Tente novamente.', 'timeout');
    throw erroApi('Não foi possível conectar ao servidor. Confira sua conexão e se a API está rodando.', 'rede');
  } finally {
    clearTimeout(timer);
  }
  const dados = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    if (resposta.status >= 500) throw erroApi('Erro interno do servidor. Tente novamente em instantes.', 'servidor', resposta.status);
    throw erroApi(mensagemErro(dados), 'requisicao', resposta.status); // 400, 401, 403, 404, 409...
  }
  return dados;
}
