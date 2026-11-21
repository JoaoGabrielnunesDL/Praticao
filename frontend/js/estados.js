// Componentes reutilizáveis de estado (lista vazia e erro ao carregar). Precisa de comum.js (função esc).
// Eles só devolvem o HTML; cada tela escolhe quando mostrar, conforme a resposta REAL da API.
const Estados = {
  // Consulta válida, mas sem registros. "botao" é opcional: { texto, attr } (attr = atributo que a tela escuta, ex.: 'data-limpar').
  vazio({ icone = '📋', titulo, texto = '', botao = null }) {
    return `<div class="vazio"><span>${icone}</span><strong class="titulo-estado">${esc(titulo)}</strong>`
      + (texto ? `<span class="texto-estado">${esc(texto)}</span>` : '')
      + (botao ? `<button type="button" class="btn btn-contorno btn-pequeno" ${botao.attr}>${esc(botao.texto)}</button>` : '')
      + '</div>';
  },

  // Falha ao carregar: a mensagem muda conforme o tipo do erro (sem internet, demora, servidor...).
  erro(x, attr = 'data-tentar') {
    const textos = {
      rede: ['Erro ao carregar os dados.', 'Verifique sua conexão com a internet e tente novamente.'],
      timeout: ['O servidor demorou para responder.', 'Tente novamente em instantes.'],
      servidor: ['Erro no servidor.', 'Tente novamente em instantes.'],
    };
    const [titulo, texto] = textos[x && x.tipo] || ['Não foi possível carregar os dados.', (x && x.message) || ''];
    return `<div class="vazio"><span>⚠️</span><strong class="titulo-estado">${esc(titulo)}</strong>`
      + `<span class="texto-estado">${esc(texto)}</span>`
      + `<button type="button" class="btn btn-laranja btn-pequeno" ${attr}>↻ Tentar novamente</button></div>`;
  },
};
