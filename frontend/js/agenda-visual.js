// Resumo visual da Agenda do Dia: SOMENTE LEITURA.
// Lê os números dos indicadores (.ind strong) e preenche os 3 cartões inferiores. Não chama a API,
// não altera dados, eventos nem DOM fora dos cartões. Se falhar, a tela principal continua igual.
(function () {
  'use strict';
  try {
    const $ = id => document.getElementById(id);
    const DICAS = [
      ['Mantenha a vacinação do seu pet em dia!', 'É essencial para a saúde e bem-estar do seu amigo.'],
      ['Escovação regular evita nós e queda de pelos.', 'Pets de pelo longo agradecem escovar várias vezes por semana.'],
      ['Água fresca, sempre à vontade.', 'Troque a água do pote todos os dias.'],
      ['Corte de unhas na frequência certa.', 'Unhas longas machucam e atrapalham a caminhada.'],
      ['Higiene dental também é saúde.', 'Escovar os dentes ajuda a prevenir mau hálito e tártaro.'],
      ['Passeios diários gastam energia.', 'Um pet que se exercita fica mais calmo e feliz.'],
      ['Vermifugação e antipulgas em dia.', 'Siga o calendário indicado pelo veterinário.']
    ];
    const inicioAno = new Date(new Date().getFullYear(), 0, 0);
    const diaDoAno = Math.floor((new Date() - inicioAno) / 86400000);
    const dica = DICAS[diaDoAno % DICAS.length];
    if ($('av-dica-t')) { $('av-dica-t').textContent = dica[0]; $('av-dica-x').textContent = dica[1]; }

    const num = f => {
      const el = document.querySelector('.ind[data-filtro="' + f + '"] strong');
      const n = el ? parseInt(el.textContent, 10) : 0;
      return Number.isFinite(n) ? n : 0;
    };
    const hojeISO = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

    function atualizar() {
      const v = { p: num('AGENDADO'), c: num('CONFIRMADO'), k: num('CONCLUIDO'), x: num('CANCELADO') };
      const total = num('TODOS');
      $('av-pend').textContent = v.p; $('av-conf').textContent = v.c; $('av-conc').textContent = v.k; $('av-canc').textContent = v.x;
      $('av-total').textContent = total;
      const soma = v.p + v.c + v.k + v.x;
      const r = $('av-rosca');
      if (soma > 0) {
        let a = 0; const fatia = (n, cor) => { const ini = a; a += n / soma * 100; return cor + ' ' + ini + '% ' + a + '%'; };
        r.style.background = 'conic-gradient(' + [fatia(v.p, '#f28a0c'), fatia(v.c, '#0a49b8'), fatia(v.k, '#2e9e4f'), fatia(v.x, '#d93025')].join(',') + ')';
      } else r.style.background = '';
      const data = $('data'), periodo = $('info-periodo');
      const periodoVisivel = periodo && !periodo.hidden;
      $('av-titulo-hoje').textContent = periodoVisivel ? (periodo.textContent.indexOf('Agendamentos futuros') === 0 ? 'Agendamentos futuros' : 'Atendimentos do período') : (data && data.value && data.value !== hojeISO() ? 'Atendimentos da data' : 'Atendimentos de Hoje');
    }
    atualizar();
    const alvo = document.querySelector('.indicadores');
    if (alvo) new MutationObserver(atualizar).observe(alvo, { childList: true, subtree: true, characterData: true });
    const periodo = $('info-periodo');
    if (periodo) new MutationObserver(atualizar).observe(periodo, { attributes: true, attributeFilter: ['hidden'], childList: true, characterData: true, subtree: true });
    const data = $('data');
    if (data) data.addEventListener('change', atualizar);
  } catch (e) { /* o resumo é opcional: ignora qualquer falha */ }
})();
