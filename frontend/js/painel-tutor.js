// Painel do tutor. Usa a API real (cada chamada já devolve só os dados do tutor logado):
//   GET /animais        -> animais do tutor
//   GET /agendamentos   -> agendamentos do tutor, ordenados por data
// O "próximo agendamento" é o primeiro futuro com status AGENDADO (Pendente) ou CONFIRMADO.
// Quando o funcionário confirma ou cancela na agenda, o painel mostra a mudança ao ser aberto ou recarregado.
let animais = [];
let proximos = []; // agendamentos futuros, pendentes ou confirmados

const futuro = ag => new Date(ag.data_hora) >= new Date();

function renderAnimais() {
  const n = animais.length;
  const btn = $('btn-animais');
  if (n === 0) {
    $('qtd-animais').textContent = '0 animais';
    $('txt-animais').textContent = 'Você ainda não cadastrou nenhum animal.';
    btn.textContent = 'Cadastrar animal →';
    btn.href = 'meus-animais.html?novo=1';
  } else {
    $('qtd-animais').textContent = n === 1 ? '1 animal' : n + ' animais';
    $('txt-animais').textContent = n === 1 ? 'cadastrado' : 'cadastrados';
    btn.textContent = 'Ver meus animais →';
    btn.href = 'meus-animais.html';
  }
}

function renderProximo() {
  const ag = proximos[0];
  const caixa = $('proximo');
  if (!ag) {
    caixa.innerHTML = `<p class="vazio-txt">${animais.length ? 'Você ainda não possui agendamentos.' : 'Cadastre seu pet e agende o primeiro atendimento.'}</p>
      <button type="button" class="btn btn-laranja" data-acao="agendar">📅 Agendar serviço</button>`;
    return;
  }
  const st = STATUS[ag.status];
  caixa.innerHTML = `<dl class="pn-prox">
      <dt>Animal</dt><dd>${esc(ag.animal_nome)}</dd>
      <dt>Serviço</dt><dd>${esc(ag.servico_nome)}</dd>
      <dt>Data</dt><dd>${dataBR(ag)} às ${hora(ag)}</dd>
      <dt>Status</dt><dd><span class="status ${st.classe}">${st.texto}</span></dd>
    </dl>
    <a class="btn btn-azul" href="meus-agendamentos.html">Meus agendamentos →</a>`;
}

// Um só caminho para "Novo agendamento" e "Agendar serviço": o animal é obrigatório.
function iniciarAgendamento() {
  if (animais.length === 0) {
    mostrarMensagem('erro', 'Cadastre pelo menos um animal para poder agendar.');
    setTimeout(() => { location.href = 'meus-animais.html?novo=1'; }, 1500);
    return;
  }
  location.href = 'agendamento.html';
}

function abrirLembretes() {
  $('lem-lista').innerHTML = proximos.length
    ? proximos.map(ag => `<div class="lem"><span><strong>${esc(ag.servico_nome)}</strong> · ${esc(ag.animal_nome)}<small>${dataBR(ag)} às ${hora(ag)}</small></span><span class="status ${STATUS[ag.status].classe}">${STATUS[ag.status].texto}</span></div>`).join('')
    : '<p class="sub">Você não tem lembretes no momento.</p>';
  $('dlg-lembretes').showModal();
}

async function carregar() {
  $('erro-painel').hidden = true;
  $('painel').hidden = false;
  try {
    const [a, ags] = await Promise.all([api('/animais'), api('/agendamentos')]);
    animais = a;
    proximos = ags.filter(x => (x.status === 'AGENDADO' || x.status === 'CONFIRMADO') && futuro(x));
    renderAnimais();
    renderProximo();
  } catch (x) {
    if (x.status === 401) return tratarErro(x);
    $('painel').hidden = true;
    $('erro-texto').textContent = x.message;
    $('erro-painel').hidden = false;
  }
}

function iniciar() {
  $('saudacao').textContent = 'Olá, ' + (Auth.primeiroNome() || 'tutor') + '!';
  $('tentar').addEventListener('click', carregar);
  $('lem-fechar').addEventListener('click', () => $('dlg-lembretes').close());
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-acao]');
    if (!b) return;
    if (b.dataset.acao === 'agendar') iniciarAgendamento();
    if (b.dataset.acao === 'lembretes') abrirLembretes();
  });
  carregar();
}

if (Auth.exigirPerfil(['tutor'])) iniciar();
