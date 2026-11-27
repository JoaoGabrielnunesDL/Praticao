// Monta o cabeçalho e o rodapé de TODAS as telas, conforme a pessoa: visitante, tutor, funcionário ou administrador.
// Fase 2 do Design System: mesma lógica de antes (menus por perfil, item ativo, Sair com confirmação para a equipe,
// tamanho da letra guardado); muda só a apresentação:
// - todas as telas (visitante, tutor, funcionário e administrador): faixa de contato com o "A A A" no topo + barra branca do menu, e rodapé completo;
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


// Ícones redondos das redes sociais (rodapé completo). Os links ficam em CONTATO.redes (js/config.js).
const ICONES_REDES = [
  ['facebook', 'Facebook', '#1f4fb4', '<path fill="#fff" transform="translate(6.7 6.1) scale(1.1)" d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21z"/>'],
  ['whatsapp', 'WhatsApp', '#25b936', '<path fill="#fff" transform="translate(8 8) scale(.667)" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>'],
  ['instagram', 'Instagram', 'url(#rede-insta)', '<g fill="none" stroke="#fff" stroke-width="2.2"><rect x="10.5" y="10.5" width="19" height="19" rx="5.5"/><circle cx="20" cy="20" r="4.6"/></g><circle cx="25.9" cy="14.1" r="1.3" fill="#fff"/>'],
  ['twitter', 'Twitter', '#3fc3ee', '<path fill="#fff" transform="translate(9 9) scale(.917)" d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>'],
];
function redesSociaisHTML() {
  const redes = (typeof CONTATO !== 'undefined' && CONTATO.redes) || {};
  const defs = `<svg width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute"><defs><linearGradient id="rede-insta" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#fdc830"/><stop offset=".45" stop-color="#e1306c"/><stop offset="1" stop-color="#7b3fe4"/></linearGradient></defs></svg>`;
  const itens = ICONES_REDES.map(([id, nome, cor, desenho]) =>
    `<li><a class="rede rede-${id}" href="${escHeader(redes[id] || '#')}" target="_blank" rel="noopener noreferrer" aria-label="${nome} do PratiCão">${id === 'whatsapp'
      ? '<img src="img/redes/whatsapp.png" alt="" width="44" height="44" decoding="async">'
      : `<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><circle cx="20" cy="20" r="20" fill="${cor}"/>${desenho}</svg>`}</a></li>`).join('');
  return `${defs}<ul class="rodape-redes" aria-label="Redes sociais">${itens}</ul>`;
}

// Formas de pagamento mostradas no rodapé (imagens em img/pagamento/). Ordem: duas em cima, duas embaixo.
const PAGAMENTOS = [['Pix', 'pix'], ['Cartão', 'cartao'], ['Boleto', 'boleto'], ['Dinheiro', 'dinheiro']];

function montarRodape({ logado, linksHTML }) {
  const rodape = document.createElement('footer');
  rodape.className = 'rodape rodape--completo';
  rodape.id = 'contato'; // destino do botão "Contato"
  const marca = `<p class="rodape-marca"><img src="img/logo-praticao.webp" alt="PratiCão" width="88" height="88"></p>`;
  const contatoCurto = `<ul class="rodape-contato"><li>${escHeader(CONTATO.telefone)}</li><li>${escHeader(CONTATO.email)}</li></ul>`;
  const copy = `<p class="copy">© 2026 PratiCão. Todos os direitos reservados.</p>`;
  {
    rodape.innerHTML = `${ONDA_RODAPE}<div class="container rodape-in">
      <div class="rodape-col rodape-sobre">${marca}<p class="rodape-frase">Cuidamos do seu pet com carinho e profissionalismo.</p>${contatoCurto}${redesSociaisHTML()}</div>
      <nav class="rodape-col" aria-label="Links rápidos"><h2 class="rodape-titulo">Links rápidos</h2><ul class="rodape-links">${linksHTML}</ul></nav>
      <div class="rodape-col rodape-seguranca"><h2 class="rodape-titulo">Segurança e Conformidade</h2>
        <p class="rodape-texto rodape-seguro"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill-rule="evenodd" d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm0 2.2A2.8 2.8 0 0 1 14.8 7v3H9.2V7A2.8 2.8 0 0 1 12 4.2z"/></svg>Ambiente seguro. Seus dados protegidos.</p>
        <p class="rodape-texto">Atendimento com carinho, profissionais capacitados e produtos de qualidade para o seu pet.</p>
        <h3 class="rodape-subtitulo">Formas de pagamento</h3>
        <ul class="rodape-pagamentos">${PAGAMENTOS.map(([nome, img]) => `<li><img src="img/pagamento/${img}.webp" alt="" width="32" height="32" loading="lazy"><span>${nome}</span></li>`).join('')}</ul></div>
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

  // Todas as telas: faixa de contato + letra (A A A) no topo.
  const faixa = `
    <div class="topbar"><div class="container">
      <div class="contatos"><span>${escHeader(CONTATO.telefone)}</span><span>${escHeader(CONTATO.email)}</span></div>
      ${CONTROLES_FONTE}
    </div></div>`;

  const cab = document.getElementById('cabecalho');
  cab.classList.add(logado ? 'cab--logado' : 'cab--visitante');
  cab.innerHTML = `${faixa}
    <nav class="navbar" aria-label="Principal"><div class="container">
      <a class="logo" href="${equipe ? inicioDaEquipe : 'index.html'}" aria-label="PratiCão – página inicial"><img src="img/logo-praticao.webp" alt="PratiCão" width="58" height="58"></a>
      <button type="button" class="menu-botao" aria-expanded="false" aria-controls="menu-principal">
        <span class="menu-botao-ic" aria-hidden="true"><i></i><i></i><i></i></span><span class="menu-botao-txt">Menu</span>
      </button>
      <div class="menu-painel" id="menu-principal">
        <div class="menu">${itens.map(link).join('')}</div>
        <div class="utilidades"><div class="conta" id="conta"></div></div>
      </div>
    </div></nav>`;

  // Rodapé completo em todas as telas: "Links rápidos" acompanha o menu da pessoa, sem o Perfil.
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
