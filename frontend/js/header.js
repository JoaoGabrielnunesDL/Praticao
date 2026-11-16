// Monta o cabeçalho, a faixa azul de contato e o rodapé de TODAS as telas,
// conforme a pessoa: visitante, tutor, funcionário ou administrador.
const MENU_DESLOGADO = [['Início', '#inicio'], ['Serviços', '#servicos'], ['Agendamento', '#agendamento'], ['Curiosidades', 'curiosidades.html'], ['Sobre Nós', '#sobre'], ['Contato', '#contato']];
const MENU_LOGADO = [['Início', 'index.html'], ['Painel', 'painel.html'], ['Meus Animais', 'meus-animais.html'], ['Agendamento', 'agendamento.html'], ['Meus Agendamentos', 'meus-agendamentos.html'], ['Serviços', 'servicos.html'], ['Curiosidades', 'curiosidades.html'], ['Meu Perfil', 'perfil.html']];
const MENU_FUNCIONARIO = [['Agenda', 'painel-funcionario.html'], ['Relatórios', 'relatorios.html'], ['Perfil', 'perfil.html']];
const MENU_ADMIN = [['Visão geral', 'painel-admin.html'], ['Usuários', 'admin-usuarios.html'], ['Agenda', 'painel-funcionario.html'], ['Serviços', 'gerenciar-servicos.html'], ['Relatórios', 'relatorios.html'], ['Perfil', 'perfil.html']];

function escHeader(t) { return String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

function montarRodape(linksHTML) {
  const rodape = document.createElement('footer');
  rodape.className = 'rodape';
  rodape.id = 'contato'; // destino do botão "Contato"
  const linhas = [...CONTATO.endereco, CONTATO.telefone, CONTATO.email, ...CONTATO.horarios];
  rodape.innerHTML = `<div class="container">
    <div class="colunas">
      <div><h4>Prati<span>Cão</span></h4><p>Cuidamos do seu pet com carinho e profissionalismo.</p></div>
      <div><h4>Links Rápidos</h4><ul>${linksHTML}</ul></div>
      <div><h4>Fale Conosco</h4><ul>${linhas.map(l => `<li>${escHeader(l)}</li>`).join('')}</ul></div>
      <div><h4>Segurança e Confiabilidade</h4><p>Ambiente seguro, pets protegidos.</p></div>
    </div>
    <p class="copy">© 2026 PratiCão. Todos os direitos reservados.</p>
  </div>`;
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

  // Faixa azul (contato e acessibilidade): aparece para todos os perfis.
  const faixa = `
    <div class="topbar"><div class="container">
      <div class="contatos"><span>${escHeader(CONTATO.telefone)}</span><span>${escHeader(CONTATO.email)}</span></div>
      <div class="acess"><span>Acessibilidade:</span>
        <button data-fonte="14" aria-label="Diminuir letra">A</button>
        <button data-fonte="16" aria-label="Letra normal">A</button>
        <button data-fonte="19" aria-label="Aumentar letra">A</button>
      </div>
    </div></div>`;

  document.getElementById('cabecalho').innerHTML = `${faixa}
    <nav class="navbar"><div class="container">
      <a class="logo" href="${equipe ? inicioDaEquipe : 'index.html'}">Prati<span>Cão</span></a>
      <div class="menu">${itens.map(link).join('')}</div>
      <div class="conta" id="conta"></div>
    </div></nav>`;

  // Rodapé: "Links Rápidos" acompanha o menu da pessoa (sem o Perfil).
  montarRodape(itens.filter(([t]) => !/perfil/i.test(t)).map(i => `<li>${link(i)}</li>`).join(''));

  const conta = document.getElementById('conta');
  if (logado) {
    const nome = document.createElement('a');
    nome.className = 'btn btn-laranja';
    nome.href = 'perfil.html';
    nome.textContent = Auth.primeiroNome() || 'Minha conta'; // textContent evita injetar HTML
    const sair = document.createElement('button');
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
    conta.innerHTML = '<a class="btn btn-laranja" href="login.html">Entrar / Cadastrar</a>';
  }

  // O tamanho da letra escolhido (A A A) é guardado e mantido nas outras telas.
  try { const salvo = localStorage.getItem('praticao_fonte'); if (salvo) document.documentElement.style.fontSize = salvo + 'px'; } catch { /* sem armazenamento: usa o padrão */ }
  document.querySelectorAll('[data-fonte]').forEach(b => b.addEventListener('click', () => {
    document.documentElement.style.fontSize = b.dataset.fonte + 'px';
    try { localStorage.setItem('praticao_fonte', b.dataset.fonte); } catch { /* ignora */ }
  }));
}
montarHeader();
