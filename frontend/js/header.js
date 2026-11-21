// Monta o cabeçalho e o rodapé de TODAS as telas, conforme a pessoa: visitante, tutor, funcionário ou administrador.
// Fase 2 do Design System: mesma lógica de antes (menus por perfil, item ativo, Sair com confirmação para a equipe,
// tamanho da letra guardado); muda só a apresentação:
// - visitante: faixa de contato no topo + rodapé completo;
// - logado: sem faixa institucional (o "A A A" vai para a barra), rodapé compacto;
// - telas estreitas: menu recolhido num botão "Menu" (aria-expanded/aria-controls), sem links quebrando em várias linhas;
// - o rodapé começa com uma onda (transição orgânica entre o conteúdo e o rodapé).
const MENU_DESLOGADO = [['Início', '#inicio'], ['Serviços', '#servicos'], ['Agendamento', '#agendamento'], ['Curiosidades', 'curiosidades.html'], ['Sobre Nós', '#sobre'], ['Contato', '#contato']];
const MENU_LOGADO = [['Início', 'index.html'], ['Painel', 'painel.html'], ['Meus Animais', 'meus-animais.html'], ['Agendamento', 'agendamento.html'], ['Meus Agendamentos', 'meus-agendamentos.html'], ['Serviços', 'servicos.html'], ['Curiosidades', 'curiosidades.html'], ['Meu Perfil', 'perfil.html']];
const MENU_FUNCIONARIO = [['Agenda', 'painel-funcionario.html'], ['Relatórios', 'relatorios.html'], ['Perfil', 'perfil.html']];
const MENU_ADMIN = [['Visão geral', 'painel-admin.html'], ['Usuários', 'admin-usuarios.html'], ['Agenda', 'painel-funcionario.html'], ['Serviços', 'gerenciar-servicos.html'], ['Relatórios', 'relatorios.html'], ['Perfil', 'perfil.html']];

function escHeader(t) { return String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

// Controles de tamanho da letra (mesmos data-fonte e rótulos de antes; cada "A" mostra o tamanho que aplica).
const CONTROLES_FONTE = `<div class="acess" role="group" aria-label="Tamanho da letra">
    <span class="acess-rotulo" aria-hidden="true">Letra</span>
    <button type="button" data-fonte="14" aria-label="Diminuir letra"><span class="a-p">A</span></button>
    <button type="button" data-fonte="16" aria-label="Letra normal"><span class="a-m">A</span></button>
    <button type="button" data-fonte="19" aria-label="Aumentar letra"><span class="a-g">A</span></button>
  </div>`;

// Onda que inicia o rodapé (decorativa: some para leitores de tela).
const ONDA_RODAPE = `<svg class="rodape-onda" viewBox="0 0 1440 56" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <path d="M0 56V30C180 8 420 0 720 18s560 34 720 6V56Z"/></svg>`;

function montarRodape({ logado, linksHTML }) {
  const rodape = document.createElement('footer');
  rodape.className = 'rodape ' + (logado ? 'rodape--compacto' : 'rodape--completo');
  rodape.id = 'contato'; // destino do botão "Contato"
  const marca = `<p class="rodape-marca">Prati<span>Cão</span></p>`;
  const contatoCurto = `<ul class="rodape-contato"><li>${escHeader(CONTATO.telefone)}</li><li>${escHeader(CONTATO.email)}</li></ul>`;
  const copy = `<p class="copy">© 2026 PratiCão. Todos os direitos reservados.</p>`;
  if (logado) {
    // Área logada: só o essencial (marca, contato, copyright). A navegação já está no cabeçalho.
    rodape.innerHTML = `${ONDA_RODAPE}<div class="container rodape-in">
      <div class="rodape-col">${marca}<p class="rodape-frase">Cuidamos do seu pet com carinho e profissionalismo.</p></div>
      ${contatoCurto}
      ${copy}
    </div>`;
  } else {
    rodape.innerHTML = `${ONDA_RODAPE}<div class="container rodape-in">
      <div class="rodape-col rodape-sobre">${marca}<p class="rodape-frase">Cuidamos do seu pet com carinho e profissionalismo.</p>${contatoCurto}</div>
      <nav class="rodape-col" aria-label="Links rápidos"><h2 class="rodape-titulo">Links rápidos</h2><ul class="rodape-links">${linksHTML}</ul></nav>
      <div class="rodape-col"><h2 class="rodape-titulo">Onde estamos</h2>
        <address class="rodape-endereco">${CONTATO.endereco.map(escHeader).join('<br>')}</address>
        <ul class="rodape-horarios">${CONTATO.horarios.map(h => `<li>${escHeader(h)}</li>`).join('')}</ul></div>
    </div>
    <div class="container rodape-base">${copy}</div>`;
  }
  document.body.append(rodape);
}

function montarHeader() {
  const naHome = !!document.getElementById('inicio');
  const logado = Auth.logado();
  const perfil = Auth.perfil();
  const admin = logado && perfil === 'administrador';
  const equipe = logado && (admin || perfil === 'funcionario');
  const itens = admin ? MENU_ADMIN : equipe ? MENU_FUNCIONARIO : logado ? MENU_LOGADO : MENU_DESLOGADO;
  // A listagem e o artigo de dicas também destacam "Curiosidades" no menu.
  const paginaAtual = { 'dicas.html': 'curiosidades.html', 'artigo.html': 'curiosidades.html' }[location.pathname.split('/').pop()] || location.pathname.split('/').pop();
  const inicioDaEquipe = admin ? 'painel-admin.html' : 'painel-funcionario.html';

  const link = ([texto, destino]) => {
    // O rodapé existe em todas as telas, então "Contato" nunca precisa voltar à home.
    const href = destino.startsWith('#') && !naHome && destino !== '#contato' ? 'index.html' + destino : destino;
    const atual = destino === paginaAtual ? ' aria-current="page"' : '';
    return `<a href="${href}"${atual}>${texto}</a>`;
  };

  // Visitante: faixa de contato + letra no topo. Logado: sem faixa institucional (letra vai para a barra).
  const faixa = logado ? '' : `
    <div class="topbar"><div class="container">
      <div class="contatos"><span>${escHeader(CONTATO.telefone)}</span><span>${escHeader(CONTATO.email)}</span></div>
      ${CONTROLES_FONTE}
    </div></div>`;

  const cab = document.getElementById('cabecalho');
  cab.classList.add(logado ? 'cab--logado' : 'cab--visitante');
  cab.innerHTML = `${faixa}
    <nav class="navbar" aria-label="Principal"><div class="container">
      <a class="logo" href="${equipe ? inicioDaEquipe : 'index.html'}">Prati<span>Cão</span></a>
      <button type="button" class="menu-botao" aria-expanded="false" aria-controls="menu-principal">
        <span class="menu-botao-ic" aria-hidden="true"><i></i><i></i><i></i></span><span class="menu-botao-txt">Menu</span>
      </button>
      <div class="menu-painel" id="menu-principal">
        <div class="menu">${itens.map(link).join('')}</div>
        <div class="utilidades">${logado ? CONTROLES_FONTE : ''}<div class="conta" id="conta"></div></div>
      </div>
    </div></nav>`;

  // Rodapé: "Links rápidos" (só no rodapé completo, do visitante) acompanha o menu, sem o Perfil.
  montarRodape({ logado, linksHTML: itens.filter(([t]) => !/perfil/i.test(t)).map(i => `<li>${link(i)}</li>`).join('') });

  const conta = document.getElementById('conta');
  if (logado) {
    const nome = document.createElement('a');
    nome.className = 'btn conta-perfil'; // "#conta .btn" é atualizado pelo perfil.js quando o nome muda: manter só texto aqui
    nome.href = 'perfil.html';
    nome.textContent = Auth.primeiroNome() || 'Minha conta'; // textContent evita injetar HTML
    if (paginaAtual === 'perfil.html') nome.setAttribute('aria-current', 'page');
    const sair = document.createElement('button');
    sair.type = 'button';
    sair.className = 'sair';
    sair.textContent = 'Sair';
    sair.addEventListener('click', async () => {
      if (!equipe) return Auth.sair();
      // Janela de confirmação padrão (comum.js); se a tela não a carregou, usa a do navegador.
      const ok = typeof perguntar === 'function'
        ? await perguntar({ titulo: 'Sair do sistema?', texto: 'Você precisará entrar novamente para continuar.', rotulo: 'Sair' })
        : confirm('Deseja realmente sair do sistema?');
      if (ok) Auth.sair();
    });
    conta.append(nome, sair);
  } else {
    conta.innerHTML = '<a class="btn btn-laranja conta-entrar" href="login.html">Entrar / Cadastrar</a>';
  }

  // Menu recolhível (telas estreitas): abre/fecha pelo botão, fecha com Esc, ao escolher um link ou ao voltar para tela larga.
  const navbar = cab.querySelector('.navbar');
  const botao = cab.querySelector('.menu-botao');
  const longo = itens.length > 6; // menu do tutor (8 itens): recolhe até 1279px; os demais, até 1099px
  if (longo) navbar.classList.add('navbar--longo');
  const abrir = aberto => {
    navbar.classList.toggle('aberto', aberto);
    botao.setAttribute('aria-expanded', String(aberto));
    botao.querySelector('.menu-botao-txt').textContent = aberto ? 'Fechar' : 'Menu';
  };
  botao.addEventListener('click', () => abrir(botao.getAttribute('aria-expanded') !== 'true'));
  cab.addEventListener('keydown', e => { if (e.key === 'Escape' && navbar.classList.contains('aberto')) { abrir(false); botao.focus(); } });
  cab.querySelectorAll('.menu a').forEach(a => a.addEventListener('click', () => abrir(false)));
  const largo = window.matchMedia(longo ? '(min-width: 1280px)' : '(min-width: 1100px)');
  const aoMudar = () => { if (largo.matches) abrir(false); };
  if (largo.addEventListener) largo.addEventListener('change', aoMudar); else largo.addListener(aoMudar);

  // O tamanho da letra escolhido (A A A) é guardado e mantido nas outras telas.
  try { const salvo = localStorage.getItem('praticao_fonte'); if (salvo) document.documentElement.style.fontSize = salvo + 'px'; } catch { /* sem armazenamento: usa o padrão */ }
  const marcarFonte = () => { const atual = document.documentElement.style.fontSize.replace('px', '') || '16'; document.querySelectorAll('[data-fonte]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.fonte === atual))); };
  document.querySelectorAll('[data-fonte]').forEach(b => b.addEventListener('click', () => {
    document.documentElement.style.fontSize = b.dataset.fonte + 'px';
    try { localStorage.setItem('praticao_fonte', b.dataset.fonte); } catch { /* ignora */ }
    marcarFonte();
  }));
  marcarFonte();
}
montarHeader();
