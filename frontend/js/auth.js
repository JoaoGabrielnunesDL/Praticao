// Controle de login. "Lembrar meu acesso" guarda no localStorage (continua após fechar o navegador);
// sem ele, guarda no sessionStorage (some ao fechar a aba).
const CHAVES = ['praticao_token', 'praticao_nome', 'praticao_perfil'];
const ROTA_POR_PERFIL = { tutor: 'painel.html', funcionario: 'painel-funcionario.html', administrador: 'painel-admin.html' };

const TODOS = ['tutor', 'funcionario', 'administrador'];
const PAGINAS_RESTRITAS = {
  'painel.html': ['tutor'], 'meus-animais.html': ['tutor'], 'agendamento.html': ['tutor'],
  'meus-agendamentos.html': ['tutor'], 'servicos.html': ['tutor'],
  'painel-funcionario.html': ['funcionario', 'administrador'], 'relatorios.html': ['funcionario', 'administrador'],
  'painel-admin.html': ['administrador'], 'admin-usuarios.html': ['administrador'], 'gerenciar-servicos.html': ['administrador'],
  'perfil.html': TODOS,
};

const Auth = {
  _ler: k => localStorage.getItem(k) || sessionStorage.getItem(k),
  token: () => Auth._ler('praticao_token'),
  logado: () => !!Auth._ler('praticao_token'),
  perfil: () => Auth._ler('praticao_perfil'),
  primeiroNome: () => (Auth._ler('praticao_nome') || '').split(' ')[0],

  salvar({ token, nome, perfil }, lembrar) {
    Auth.limpar();
    const armazem = lembrar ? localStorage : sessionStorage;
    armazem.setItem('praticao_token', token);
    armazem.setItem('praticao_nome', nome);
    armazem.setItem('praticao_perfil', perfil);
  },
  // Atualiza o nome guardado (usado depois de editar o perfil).
  atualizarNome(nome) {
    const armazem = localStorage.getItem('praticao_token') ? localStorage : sessionStorage;
    armazem.setItem('praticao_nome', nome);
  },
  limpar() { CHAVES.forEach(k => { localStorage.removeItem(k); sessionStorage.removeItem(k); }); },
  sair() { Auth.limpar(); location.href = 'index.html'; },

  // Logado: vai direto. Deslogado: vai ao login guardando o destino na URL.
  irPara(destino) {
    location.href = Auth.logado() ? destino : 'login.html?destino=' + encodeURIComponent(destino);
  },
  // Só aceita nomes simples como "agendamento.html" (evita redirecionar para outro site).
  destinoDaUrl() {
    const d = new URLSearchParams(location.search).get('destino');
    return d && /^[a-z0-9-]+\.html$/.test(d) ? d : null;
  },
  // Protege uma tela: quem não pode vê-la é mandado para outro lugar.
  // (É só para a navegação; quem realmente protege os dados é a API.)
  exigirPerfil(perfis) {
    if (!Auth.logado()) { location.replace('login.html?destino=' + encodeURIComponent(location.pathname.split('/').pop())); return false; }
    // Logado, mas sem permissão para esta tela: mostra o estado "Acesso negado".
    if (!perfis.includes(Auth.perfil())) { location.replace('acesso-negado.html'); return false; }
    return true;
  },
  // Quem pode abrir cada tela restrita (as telas públicas não aparecem aqui).
  podeAcessar(perfil, pagina) {
    const quem = PAGINAS_RESTRITAS[pagina];
    return !quem || quem.includes(perfil);
  },
  // Para onde ir depois do login: volta à tela que a pessoa queria, se o perfil dela puder abri-la.
  rotaInicial(perfil, destino) {
    if (destino && Auth.podeAcessar(perfil, destino)) return destino;
    return ROTA_POR_PERFIL[perfil] || 'index.html';
  },
};
