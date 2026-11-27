// Funções compartilhadas pelas telas internas (agenda, painel do admin, usuários, serviços, relatórios, perfil).
const $ = id => document.getElementById(id);
const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hora = ag => ag.data_hora.slice(11, 16);
const dataBR = ag => ag.data_hora.slice(0, 10).split('-').reverse().join('/');
const moeda = v => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// No banco o status inicial se chama AGENDADO; na tela mostramos "Pendente".
// As cores são as mesmas em todo o sistema (agenda, painel e relatórios).
const STATUS = {
  AGENDADO: { texto: 'Pendente', plural: 'Pendentes', classe: 'pendente', cor: '#f28a0c' },
  CONFIRMADO: { texto: 'Confirmado', plural: 'Confirmados', classe: 'confirmado', cor: '#0a49b8' },
  CONCLUIDO: { texto: 'Concluído', plural: 'Concluídos', classe: 'concluido', cor: '#2e9e4f' },
  CANCELADO: { texto: 'Cancelado', plural: 'Cancelados', classe: 'cancelado', cor: '#d93025' },
};
const PERFIL_TEXTO = { tutor: 'Tutor', funcionario: 'Funcionário', administrador: 'Administrador' };

function hojeISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

// ---------- mensagens (caixa com id="mensagem" na página) ----------
let timerMensagem;
function mostrarMensagem(tipo, texto) {
  clearTimeout(timerMensagem);
  const caixa = $('mensagem');
  const span = document.createElement('span');
  span.textContent = texto;
  const fechar = document.createElement('button');
  fechar.type = 'button';
  fechar.setAttribute('aria-label', 'Fechar mensagem');
  fechar.textContent = '×';
  fechar.addEventListener('click', () => { caixa.hidden = true; });
  caixa.className = 'mensagem ' + tipo;
  caixa.replaceChildren(span, fechar);
  caixa.hidden = false;
  if (tipo === 'sucesso') timerMensagem = setTimeout(() => { caixa.hidden = true; }, 4000); // erro fica até fechar
}

// 401 = sessão expirada: vai para o estado "Sua sessão expirou", guardando a tela atual para voltar depois do login.
// Os demais erros (400, 403, 404, 409, rede, servidor...) aparecem como mensagem na própria tela.
function tratarErro(x, sufixo = '') {
  if (x.status === 401) {
    location.href = 'sessao-expirada.html?destino=' + encodeURIComponent(location.pathname.split('/').pop());
    return;
  }
  mostrarMensagem('erro', x.message + sufixo);
}

// ---------- janela de confirmação genérica ----------
// Uso: if (await perguntar({ titulo: '...', texto: '...', rotulo: 'Desativar' })) { ... }
function perguntar({ titulo, texto = '', rotulo = 'Confirmar' }) {
  let dlg = $('dlg-perguntar');
  if (!dlg) {
    dlg = document.createElement('dialog');
    dlg.id = 'dlg-perguntar';
    dlg.className = 'dlg-pergunta';
    dlg.innerHTML = `<form method="dialog"><button class="fechar-x" value="voltar" aria-label="Fechar">×</button><h2></h2><p class="sub"></p>
      <div class="rodape-dlg centro"><button class="btn btn-contorno" value="voltar">Cancelar</button><button class="btn btn-laranja" value="ok"></button></div></form>`;
    document.body.append(dlg);
  }
  dlg.querySelector('h2').textContent = titulo;
  dlg.querySelector('.sub').textContent = texto;
  dlg.querySelector('[value=ok]').textContent = '✓ ' + rotulo;
  dlg.returnValue = '';
  dlg.showModal();
  return new Promise(resolver => dlg.addEventListener('close', () => resolver(dlg.returnValue === 'ok'), { once: true }));
}
