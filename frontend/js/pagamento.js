// Pagamento SIMULADO (trabalho acadêmico). Nenhum pagamento real é feito e nada vai para a API:
// o resultado fica só no navegador (localStorage), para mostrar "Pago" / "Acertar no estabelecimento" nas telas.
// Uso: Pagamento.abrir({ ag, aoFechar(registro|null) })  -> abre a janela de pagamento do agendamento "ag".
//      Pagamento.obter(ag) / pode(ag) / chipHTML(ag) / rotulo(registro) -> para mostrar a situação do pagamento.
// Formas: cartão (débito/crédito), Pix (QR Code + copia e cola), boleto (gera um PDF) e dinheiro (acertar no estabelecimento).
// Equipe (funcionário/administrador): Pagamento.chipStaffHTML(ag) mostra "Pago", "Pagamento pendente" ou "Pagamento no estabelecimento".
//   Hoje a situação vem do navegador (localStorage). Quando a API passar a devolver  ag.pagamento = {situacao:'pago'|'no_local'|'pendente', forma:'cartao'|'pix'|'boleto'|'dinheiro'},
//   as telas da equipe já usam esse campo sozinhas (veja situacaoDe) e nada mais precisa mudar.
const Pagamento = (() => {
  const CHAVE = 'praticao_pagamentos';
  let memoria = {}; // se o navegador bloquear o armazenamento, vale só até recarregar a página
  const ler = () => { try { return JSON.parse(localStorage.getItem(CHAVE) || '{}') || {}; } catch { return memoria; } };
  const gravar = obj => { memoria = obj; try { localStorage.setItem(CHAVE, JSON.stringify(obj)); } catch { /* segue em memória */ } };
  // "ref" evita mostrar pagamento antigo se um número de agendamento for reaproveitado (banco recriado).
  const refDe = ag => `${ag.data_hora}|${ag.animal_id}|${ag.servico_id}`;
  const obter = ag => { const r = ler()[ag.id]; return r && r.ref === refDe(ag) ? r : null; };
  const ativo = ag => ag.status === 'AGENDADO' || ag.status === 'CONFIRMADO';
  const pode = ag => ativo(ag) && !obter(ag);
  const NOMES = { cartao: 'Cartão', pix: 'Pix', boleto: 'Boleto', dinheiro: 'Dinheiro' };
  const rotulo = r => !r ? 'Pagamento pendente' : r.situacao === 'no_local' ? 'Acertar no estabelecimento' : `Pago (${NOMES[r.forma]})`;
  const classe = r => !r ? 'pendente' : r.situacao === 'no_local' ? 'no-local' : 'pago';
  const chipHTML = ag => { const r = obter(ag); return `<span class="pg-chip ${classe(r)}">${r ? '' : '<span aria-hidden="true">●</span> '}${esc(rotulo(r))}</span>`; };

  // ---------- situação para a equipe (funcionário/administrador) ----------
  const situacaoDe = ag => { // prefere o que a API devolver; sem API, usa o registro do navegador
    if (ag.pagamento !== undefined) { const p = ag.pagamento; return p && p.situacao && p.situacao !== 'pendente' ? p : null; }
    return obter(ag);
  };
  const TEXTO_EQUIPE = { pendente: 'Pagamento pendente', 'no-local': 'Pagamento no estabelecimento', pago: 'Pago' };
  const textoEquipe = ag => TEXTO_EQUIPE[classe(situacaoDe(ag))];
  const chipStaffHTML = (ag, mini) => {
    if (ag.status === 'CANCELADO') return mini ? '' : '<span class="pg-chip nenhum" aria-label="Sem pagamento: agendamento cancelado">—</span>';
    const r = situacaoDe(ag), c = classe(r), forma = r && NOMES[r.forma] ? ` title="${esc(c === 'pago' ? 'Pago com ' + NOMES[r.forma] : 'Pagamento combinado em ' + NOMES[r.forma].toLowerCase())}"` : '';
    return `<span class="pg-chip ${c}${mini ? ' mini' : ''}"${forma}>${r ? '' : '<span aria-hidden="true">●</span> '}${esc(TEXTO_EQUIPE[c])}</span>`;
  };
  const detalheEquipe = ag => { // texto para a janela de detalhes
    if (ag.status === 'CANCELADO') return '—';
    const r = situacaoDe(ag), c = classe(r);
    return c === 'pago' ? `Pago (${NOMES[r.forma] || '—'})` : TEXTO_EQUIPE[c];
  };

  // ---------- utilidades ----------
  const aleatorio = semente => { // gerador simples e repetível (a mesma semente gera o mesmo desenho)
    let h = 1779033703 ^ semente.length;
    for (let i = 0; i < semente.length; i++) { h = Math.imul(h ^ semente.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    let a = h >>> 0;
    return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  };
  const crc16 = txt => { let c = 0xFFFF; for (const ch of txt) { c ^= ch.charCodeAt(0) << 8; for (let i = 0; i < 8; i++) c = (c & 0x8000) ? ((c << 1) ^ 0x1021) & 0xFFFF : (c << 1) & 0xFFFF; } return c.toString(16).toUpperCase().padStart(4, '0'); };
  const tlv = (id, v) => id + String(v.length).padStart(2, '0') + v;
  function codigoPix(ag, valor, nonce) { // formato do "Pix copia e cola", com chave FICTÍCIA (não funciona em banco nenhum)
    const corpo = tlv('00', '01') + tlv('26', tlv('00', 'br.gov.bcb.pix') + tlv('01', 'simulacao@praticao.com.br')) + tlv('52', '0000') + tlv('53', '986')
      + tlv('54', valor.toFixed(2)) + tlv('58', 'BR') + tlv('59', 'PRATICAO PET') + tlv('60', 'SAO PAULO') + tlv('62', tlv('05', `SIM${ag.id}${nonce}`.slice(0, 25))) + '6304';
    return corpo + crc16(corpo);
  }
  function svgQr(semente) { // QR Code ilustrativo (não lê em aplicativo de verdade)
    const N = 29, rnd = aleatorio(semente), m = Array.from({ length: N }, () => Array(N).fill(0));
    const reservado = (x, y) => (x < 8 && y < 8) || (x >= N - 8 && y < 8) || (x < 8 && y >= N - 8);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!reservado(x, y)) m[y][x] = rnd() < 0.5 ? 1 : 0;
    for (let i = 8; i < N - 8; i++) { m[6][i] = i % 2 ? 0 : 1; m[i][6] = i % 2 ? 0 : 1; }
    for (const [ox, oy] of [[0, 0], [N - 7, 0], [0, N - 7]]) for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) {
      const borda = x === 0 || y === 0 || x === 6 || y === 6, miolo = x >= 2 && x <= 4 && y >= 2 && y <= 4;
      m[oy + y][ox + x] = borda || miolo ? 1 : 0;
    }
    let d = '';
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (m[y][x]) d += `M${x + 4} ${y + 4}h1v1h-1z`;
    return `<svg class="pg-qr" viewBox="0 0 ${N + 8} ${N + 8}" role="img" aria-label="QR Code ilustrativo do Pix" shape-rendering="crispEdges"><rect width="${N + 8}" height="${N + 8}" fill="#fff"/><path d="${d}" fill="#111"/></svg>`;
  }
  function barrasLista(digitos) { // barras do código ilustrativo: [{x, l}] e largura total
    const rnd = aleatorio(digitos); let x = 0; const barras = [];
    for (let i = 0; i < 90; i++) { const l = 1 + Math.floor(rnd() * 3); if (i % 2 === 0) barras.push({ x, l }); x += l; }
    return { barras, largura: x };
  }
  function svgBarras(digitos) {
    const { barras, largura: x } = barrasLista(digitos); const d = barras.map(b => `M${b.x} 0h${b.l}v40h-${b.l}z`).join('');
    return `<svg class="pg-barras" viewBox="0 0 ${x} 40" preserveAspectRatio="none" role="img" aria-label="Código de barras ilustrativo" shape-rendering="crispEdges"><path d="${d}" fill="#222"/></svg>`;
  }
  function boletoDados(ag, valor) {
    const venc = new Date(); venc.setDate(venc.getDate() + 3);
    const fator = String(Math.floor((venc - new Date(1997, 9, 7)) / 864e5)).padStart(4, '0');
    const vl = String(Math.round(valor * 100)).padStart(10, '0'), id = String(ag.id).padStart(5, '0');
    const linha = `00190.00009 0${id.slice(0, 4)}.${id.slice(4)}0000 12345.678901 2 ${fator}${vl}`;
    const barras = (`0019${2}${fator}${vl}${id}`).padEnd(44, '7');
    return { venc: venc.toLocaleDateString('pt-BR'), linha, barras };
  }
  // ---------- boleto em PDF (feito no próprio navegador, sem biblioteca) ----------
  function pdfBoleto(ag, valor, b, pagador) {
    const pt = s => String(s).replace(/[\\()]/g, m => '\\' + m).replace(/[^\x20-\x7e]/g, c => { const n = c.charCodeAt(0); return '\\' + (n < 256 ? n.toString(8).padStart(3, '0') : '077'); }); // Latin-1 (acentos)
    const f = n => (Math.round(n * 100) / 100).toString();
    let c = '';
    const texto = (x, y, s, tam = 10, neg = false) => { c += `BT /${neg ? 'F2' : 'F1'} ${tam} Tf ${f(x)} ${f(y)} Td (${pt(s)}) Tj ET\n`; };
    const caixa = (x, y, w, h) => { c += `${f(x)} ${f(y)} ${f(w)} ${f(h)} re S\n`; };
    const cinza = (g) => { c += `${g} g\n`; }, preto = () => { c += '0 g\n'; };
    const L = 50, W = 495; let y = 790;
    c += '0.04 0.29 0.72 rg\n' + `${L} ${y - 4} ${W} 34 re f\n` + '1 g\n';
    texto(L + 12, y + 6, 'PratiCão Pay  |  Boleto bancário', 16, true);
    preto(); y -= 34;
    texto(L, y, 'Documento de simulação acadêmica: não é um boleto real e não pode ser pago em banco.', 9); y -= 26;
    c += '0.6 G 0.8 w\n';
    const campo = (x, topo, w, rot, val, h = 38) => { caixa(x, topo - h, w, h); cinza(0.4); texto(x + 6, topo - 12, rot, 7.5); preto(); texto(x + 6, topo - 29, val, 11, true); };
    campo(L, y, W, 'Beneficiário', 'PratiCão Pet Shop  -  CNPJ 00.000.000/0001-00 (fictício)'); y -= 38;
    campo(L, y, W / 2, 'Pagador', pagador); campo(L + W / 2, y, W / 4, 'Nº do documento', '#' + ag.id); campo(L + 3 * W / 4, y, W / 4, 'Vencimento', b.venc); y -= 38;
    campo(L, y, W / 2, 'Serviço', ag.servico_nome); campo(L + W / 2, y, W / 4, 'Pet', ag.animal_nome); campo(L + 3 * W / 4, y, W / 4, 'Valor do documento', moeda(valor)); y -= 38;
    campo(L, y, W, 'Atendimento', `${dataBR(ag)} às ${hora(ag)}`); y -= 38;
    campo(L, y, W, 'Instruções', 'Pagável em qualquer banco (simulação). Após o vencimento, procure o PratiCão.', 38); y -= 74;
    cinza(0.4); texto(L, y + 14, 'Linha digitável', 8); preto();
    texto(L, y - 4, b.linha, 14, true); y -= 34;
    const { barras, largura } = barrasLista(b.barras), esc2 = Math.min(W / largura, 2.2); // barras ilustrativas
    c += '0.1 g\n';
    for (const br of barras) c += `${f(L + br.x * esc2)} ${f(y - 52)} ${f(br.l * esc2)} 52 re f\n`;
    preto(); y -= 74;
    texto(L, y, 'Código de barras ilustrativo (simulação). Nenhum valor real é cobrado.', 8.5);
    const objs = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>',
      `<< /Length ${c.length} >>\nstream\n${c}endstream`,
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
    ];
    let pdf = '%PDF-1.4\n'; const pos = [];
    objs.forEach((o, i) => { pos.push(pdf.length); pdf += `${i + 1} 0 obj\n${o}\nendobj\n`; });
    const xref = pdf.length;
    pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + pos.map(p => String(p).padStart(10, '0') + ' 00000 n \n').join('')
      + `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    return new Uint8Array([...pdf].map(ch => ch.charCodeAt(0) & 255)); // o texto é todo ASCII (acentos viraram \ooo)
  }
  function baixarBoletoPDF(ag, valor, b, pagador) {
    const url = URL.createObjectURL(new Blob([pdfBoleto(ag, valor, b, pagador)], { type: 'application/pdf' }));
    const a = document.createElement('a'); a.href = url; a.download = `boleto-praticao-${ag.id}.pdf`; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
  const soDigitos = t => t.replace(/\D/g, '');
  const copiar = async texto => {
    try { await navigator.clipboard.writeText(texto); return true; } catch { /* tenta o jeito antigo */ }
    const t = document.createElement('textarea'); t.value = texto; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.append(t); t.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch { /* sem permissão */ } t.remove(); return ok;
  };

  // ---------- janela ----------
  let dlg, est = null;
  function montar() {
    if (dlg) return;
    dlg = document.createElement('dialog');
    dlg.id = 'dlg-pagamento';
    dlg.setAttribute('aria-labelledby', 'pg-titulo');
    dlg.innerHTML = `<div class="pg-topo">
        <button type="button" class="pg-voltar" id="pg-voltar" hidden>‹ Voltar</button>
        <h2 id="pg-titulo">Pagamento</h2>
        <button type="button" class="pg-fechar" id="pg-fechar" aria-label="Fechar">×</button>
      </div>
      <p class="pg-simulacao">Simulação acadêmica: nenhum pagamento real é feito.</p>
      <dl class="pg-resumo" id="pg-resumo"></dl>
      <div class="pg-corpo" id="pg-corpo"></div>
      <p class="pg-seguro">Ambiente seguro (simulado)</p>
      <div class="pg-aviso-sr" id="pg-aviso" role="status" aria-live="polite"></div>`;
    document.body.append(dlg);
    $('pg-fechar').addEventListener('click', () => dlg.close());
    $('pg-voltar').addEventListener('click', () => est.voltar && est.voltar());
    dlg.addEventListener('close', aoFecharJanela);
    $('pg-corpo').addEventListener('click', clique);
    $('pg-corpo').addEventListener('input', digitou);
    $('pg-corpo').addEventListener('change', digitou);
    $('pg-corpo').addEventListener('submit', e => { e.preventDefault(); if (e.target.id === 'pg-form-cartao') salvarCartao(); });
  }
  function aoFecharJanela() {
    clearInterval(est.timerPix); clearTimeout(est.timerOk);
    const { aoFechar, registro } = est; est = null;
    $('pg-corpo').innerHTML = '';
    if (aoFechar) aoFechar(registro || null);
  }
  const avisar = t => { $('pg-aviso').textContent = ''; setTimeout(() => { $('pg-aviso').textContent = t; }, 30); };
  function mostrar(titulo, html, voltar) {
    $('pg-titulo').textContent = titulo;
    $('pg-corpo').innerHTML = html;
    est.voltar = voltar || null;
    $('pg-voltar').hidden = !voltar;
    clearInterval(est.timerPix);
    const alvo = $('pg-corpo').querySelector('input:not([type=radio]),select,button:not([disabled]),input[type=radio]');
    (alvo || $('pg-titulo')).focus?.();
    $('pg-corpo').scrollTop = 0;
  }
  const erroCampo = (id, texto) => {
    const e = $('e-' + id), c = $(id);
    e.textContent = texto || ''; e.hidden = !texto;
    c.classList.toggle('invalido', !!texto); c.setAttribute('aria-invalid', texto ? 'true' : 'false');
  };
  const total = () => moeda(est.valor);

  // ---------- 1) escolha da forma ----------
  function telaEscolha() {
    const opc = [
      ['cartao', 'Cartão de crédito ou débito', 'Mastercard, Visa, Elo, Hipercard'],
      ['pix', 'Pix', 'QR Code ou copia e cola'],
      ['boleto', 'Boleto bancário', 'Gera o boleto em PDF · vence em 3 dias'],
      ['dinheiro', 'Dinheiro', 'Acertar no estabelecimento'],
    ];
    mostrar('Forma de pagamento', `<fieldset class="pg-metodos"><legend class="pg-sr">Escolha como deseja pagar</legend>
      ${opc.map(([v, t, s]) => `<label class="pg-metodo"><input type="radio" name="pg-forma" value="${v}"${est.forma === v ? ' checked' : ''}>
        <img src="img/pagamento/${v}.webp" alt="" width="40" height="40"><span><strong>${t}</strong><small>${s}</small></span></label>`).join('')}</fieldset>
      <button type="button" class="btn pg-principal" data-acao="continuar"${est.forma ? '' : ' disabled'}>Continuar</button>
      <button type="button" class="pg-link" data-acao="depois">Pagar depois</button>`);
  }

  // ---------- 2) cartão ----------
  function telaCartao(d = {}) {
    mostrar('Adicionar cartão', `<form id="pg-form-cartao" novalidate>
      <div class="pg-opcoes" role="radiogroup" aria-label="Tipo de pagamento">
        <label><input type="radio" name="pg-modo" value="Débito"${d.modo === 'Débito' ? ' checked' : ''}> Débito</label>
        <label><input type="radio" name="pg-modo" value="Crédito"${d.modo !== 'Débito' ? ' checked' : ''}> Crédito</label>
      </div>
      <div class="pg-campo"><label for="pg-num">Número do cartão</label><input id="pg-num" inputmode="numeric" autocomplete="off" placeholder="0000 0000 0000 0000" maxlength="23" value="${esc(d.num || '')}"><small class="pg-erro" id="e-pg-num" hidden></small></div>
      <div class="pg-campo"><label for="pg-tipo">Tipo de cartão</label><select id="pg-tipo">${['Mastercard', 'Visa', 'Elo', 'Hipercard'].map(b => `<option${d.tipo === b ? ' selected' : ''}>${b}</option>`).join('')}</select></div>
      <div class="pg-dupla">
        <div class="pg-campo"><label for="pg-val">Data de vencimento</label><input id="pg-val" inputmode="numeric" autocomplete="off" placeholder="MM/AA" maxlength="5" value="${esc(d.val || '')}"><small class="pg-erro" id="e-pg-val" hidden></small></div>
        <div class="pg-campo"><label for="pg-cvv">Código de segurança</label><input id="pg-cvv" inputmode="numeric" autocomplete="off" placeholder="000" maxlength="4" value="${esc(d.cvv || '')}"><small class="pg-erro" id="e-pg-cvv" hidden></small></div>
      </div>
      <div class="pg-campo"><label for="pg-end">Endereço de cobrança</label><input id="pg-end" autocomplete="off" placeholder="Rua, número e bairro" maxlength="120" value="${esc(d.end || '')}"><small class="pg-erro" id="e-pg-end" hidden></small></div>
      <p class="pg-nota">Use números fictícios. Nada é enviado nem guardado (só a bandeira e os 4 últimos dígitos, para exemplo).</p>
      <button type="submit" class="btn pg-azul">Adicionar cartão</button></form>`, telaEscolha);
  }
  function salvarCartao() {
    const num = soDigitos($('pg-num').value), val = $('pg-val').value.trim(), cvv = soDigitos($('pg-cvv').value), end = $('pg-end').value.trim();
    const m = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(val), agora = new Date();
    const vencido = m && (2000 + Number(m[2]) < agora.getFullYear() || (2000 + Number(m[2]) === agora.getFullYear() && Number(m[1]) < agora.getMonth() + 1));
    erroCampo('pg-num', num.length >= 13 && num.length <= 19 ? '' : 'Informe o número do cartão (13 a 19 dígitos).');
    erroCampo('pg-val', !m ? 'Use o formato MM/AA.' : vencido ? 'Cartão vencido.' : '');
    erroCampo('pg-cvv', cvv.length === 3 || cvv.length === 4 ? '' : 'Informe 3 ou 4 dígitos.');
    erroCampo('pg-end', end.length >= 5 ? '' : 'Informe o endereço de cobrança.');
    const ruim = ['pg-num', 'pg-val', 'pg-cvv', 'pg-end'].find(i => !$('e-' + i).hidden);
    if (ruim) { $(ruim).focus(); return avisar('Corrija os campos destacados.'); }
    const dados = { modo: document.querySelector('input[name=pg-modo]:checked').value, tipo: $('pg-tipo').value, num: $('pg-num').value, val, cvv: $('pg-cvv').value, end, final: num.slice(-4) };
    est.cartao = dados;
    mostrar('Cartão adicionado', `<div class="pg-cartao-ok"><div class="pg-cartao-visual"><span>${esc(dados.tipo)}</span><strong>•••• •••• •••• ${dados.final}</strong><small>${esc(dados.modo)} · vence ${esc(dados.val)}</small></div>
      <p class="pg-nota">Cartão adicionado (simulação). Faça o pagamento de <strong>${total()}</strong> e confirme abaixo.</p>
      <button type="button" class="btn pg-principal" data-acao="pagar-cartao">Já realizei o pagamento</button>
      <button type="button" class="pg-link" data-acao="trocar-cartao">Alterar cartão</button></div>`, () => telaCartao(est.cartao));
  }

  // ---------- 3) Pix ----------
  function telaPix(novo) {
    est.nonce = novo ? String(Date.now()).slice(-6) : (est.nonce || '000001');
    est.codigoPix = codigoPix(est.ag, est.valor, est.nonce);
    est.pixFim = Date.now() + 15 * 60000;
    mostrar('Pague com Pix', `<div class="pg-pix"><img class="pg-pix-logo" src="img/pagamento/pix.webp" alt="Pix" width="44" height="44">
      <p>Leia o QR Code pelo aplicativo do seu banco</p>${svgQr(est.codigoPix)}<small class="pg-nota">QR Code ilustrativo (simulação)</small>
      <p class="pg-peq">Para usar o "Pix Copia e Cola", copie o código e cole no app do banco para completar a transação.</p>
      <dl class="pg-linhas"><div><dt>Valor da compra:</dt><dd>${total()}</dd></div><div><dt>QR Code expira em:</dt><dd id="pg-tempo">15:00</dd></div></dl>
      <div id="pg-pix-acoes"><button type="button" class="btn pg-azul" data-acao="copiar-pix" id="pg-copiar">COPIA E COLA PIX</button>
      <button type="button" class="pg-link" data-acao="compartilhar-pix">Compartilhar</button>
      <button type="button" class="btn pg-principal" data-acao="pagar-pix">Já realizei o pagamento</button></div>
      <p class="pg-expirado" id="pg-expirado" hidden>O QR Code expirou. <button type="button" class="pg-link" data-acao="novo-pix">Gerar novo QR Code</button></p>
      <a class="pg-link" href="meus-agendamentos.html" data-acao="historico">Ir para o histórico de pagamento</a></div>`, telaEscolha);
    const tempo = () => {
      const resta = Math.max(0, Math.ceil((est.pixFim - Date.now()) / 1000)), el = $('pg-tempo');
      if (!el) return;
      el.textContent = `${String(Math.floor(resta / 60)).padStart(2, '0')}:${String(resta % 60).padStart(2, '0')}`;
      if (!resta) { clearInterval(est.timerPix); $('pg-pix-acoes').hidden = true; $('pg-expirado').hidden = false; avisar('O QR Code expirou.'); }
    };
    est.timerPix = setInterval(tempo, 1000);
  }

  // ---------- 4) boleto ----------
  function telaBoleto() {
    const b = boletoDados(est.ag, est.valor); est.boleto = b;
    const pagador = (typeof Auth !== 'undefined' && Auth._ler && Auth._ler('praticao_nome')) || 'Tutor';
    mostrar('Boleto bancário', `<div class="pg-boleto"><div class="pg-bol-topo"><strong class="pg-bol-banco">PratiCão Pay</strong><span class="pg-bol-linha">${b.linha}</span></div>
      <dl class="pg-bol-grade"><div class="larga"><dt>Beneficiário</dt><dd>PratiCão Pet Shop · CNPJ 00.000.000/0001-00 (fictício)</dd></div>
      <div><dt>Vencimento</dt><dd>${b.venc}</dd></div><div><dt>Valor do documento</dt><dd>${total()}</dd></div>
      <div class="larga"><dt>Pagador</dt><dd>${esc(pagador)}</dd></div><div><dt>Nº do documento</dt><dd>#${est.ag.id}</dd></div><div><dt>Instruções</dt><dd>Pagável em qualquer banco (simulação)</dd></div></dl>
      ${svgBarras(b.barras)}</div>
      <button type="button" class="btn pg-azul" data-acao="pdf-boleto" id="pg-pdf">Gerar boleto em PDF</button>
      <button type="button" class="btn pg-principal" data-acao="pagar-boleto">Já realizei o pagamento</button>
      <p class="pg-nota">O PDF é baixado no seu aparelho. Em um sistema real, o boleto leva até 3 dias úteis para ser compensado.</p>`, telaEscolha);
  }

  // ---------- 5) dinheiro ----------
  function telaDinheiro() {
    mostrar('Pagamento em dinheiro', `<div class="pg-dinheiro"><img src="img/pagamento/dinheiro.webp" alt="" width="64" height="64">
      <p>Você paga em dinheiro direto no PratiCão, no dia do atendimento.</p>
      <p class="pg-destaque">Acertar no estabelecimento: <strong>${total()}</strong></p>
      <div class="pg-campo"><label for="pg-troco">Precisa de troco para quanto? (opcional)</label><input id="pg-troco" inputmode="decimal" autocomplete="off" placeholder="Ex.: 100,00"><small class="pg-erro" id="e-pg-troco" hidden></small></div>
      <label class="pg-confirma"><input type="checkbox" id="pg-ciente"> <span>Estou ciente de que devo acertar <strong>${total()}</strong> em dinheiro no estabelecimento.</span></label>
      <small class="pg-erro" id="e-pg-ciente" hidden></small>
      <button type="button" class="btn pg-principal" data-acao="confirmar-dinheiro" id="pg-conf-din" disabled>Confirmar</button></div>`, telaEscolha);
  }

  // ---------- final ----------
  function concluir(forma, situacao, detalhe) {
    est.registro = { forma, situacao, detalhe, em: new Date().toISOString(), ref: refDe(est.ag) };
    const todos = ler(); todos[est.ag.id] = est.registro; gravar(todos);
    const local = situacao === 'no_local';
    mostrar(local ? 'Pagamento combinado' : 'Pagamento registrado', `<div class="pg-ok"><span class="pg-ok-ic" aria-hidden="true">✓</span>
      <h3>${local ? 'Tudo certo!' : 'Pagamento realizado!'}</h3>
      <p>${local ? `Acerte ${total()} em dinheiro no estabelecimento, no dia do atendimento.` : `${esc(detalhe)} · ${total()}`}</p>
      <p class="pg-nota">Simulação: nenhum valor foi cobrado.</p>
      <button type="button" class="btn pg-principal" data-acao="fechar">Concluir</button></div>`);
    avisar(local ? 'Pagamento em dinheiro combinado.' : 'Pagamento realizado.');
    est.timerOk = setTimeout(() => dlg.open && dlg.close(), 2600);
  }

  // ---------- eventos ----------
  function digitou(e) {
    const t = e.target;
    if (t.name === 'pg-forma') { est.forma = t.value; const b = $('pg-corpo').querySelector('[data-acao=continuar]'); if (b) b.disabled = false; }
    else if (t.id === 'pg-num') {
      const d = soDigitos(t.value).slice(0, 19); t.value = d.replace(/(.{4})/g, '$1 ').trim();
      const marca = d[0] === '4' ? 'Visa' : (d[0] === '5' || d[0] === '2') ? 'Mastercard' : '';
      if (marca) $('pg-tipo').value = marca;
    }
    else if (t.id === 'pg-val') { const d = soDigitos(t.value).slice(0, 4); t.value = d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d; }
    else if (t.id === 'pg-cvv') t.value = soDigitos(t.value).slice(0, 4);
    else if (t.id === 'pg-ciente') { $('pg-conf-din').disabled = !t.checked; if (t.checked) erroCampo('pg-ciente', ''); }
    if (t.id && t.id.startsWith('pg-') && $('e-' + t.id) && e.type === 'input') erroCampo(t.id, '');
  }
  async function clique(e) {
    const a = e.target.closest('[data-acao]'); if (!a) return;
    const acao = a.dataset.acao;
    if (acao === 'historico') { if (location.pathname.endsWith('meus-agendamentos.html')) { e.preventDefault(); dlg.close(); } return; }
    if (acao === 'continuar') { const f = est.forma; ({ cartao: telaCartao, pix: telaPix, boleto: telaBoleto, dinheiro: telaDinheiro })[f](); }
    else if (acao === 'depois') dlg.close();
    else if (acao === 'trocar-cartao') telaCartao(est.cartao);
    else if (acao === 'pagar-cartao') concluir('cartao', 'pago', `Cartão de ${est.cartao.modo.toLowerCase()} ${est.cartao.tipo} •••• ${est.cartao.final}`);
    else if (acao === 'pagar-pix') concluir('pix', 'pago', 'Pix');
    else if (acao === 'novo-pix') telaPix(true);
    else if (acao === 'pagar-boleto') concluir('boleto', 'pago', 'Boleto bancário');
    else if (acao === 'pdf-boleto') {
      const pagador = (typeof Auth !== 'undefined' && Auth._ler && Auth._ler('praticao_nome')) || 'Tutor';
      try { baixarBoletoPDF(est.ag, est.valor, est.boleto, pagador); a.textContent = 'PDF gerado ✓'; avisar('Boleto em PDF gerado. Veja o arquivo baixado.'); }
      catch { a.textContent = 'Não foi possível gerar o PDF'; avisar('Não foi possível gerar o PDF.'); }
      setTimeout(() => { if (a.isConnected) a.textContent = 'Gerar boleto em PDF'; }, 2500);
    }
    else if (acao === 'copiar-pix') {
      const ok = await copiar(est.codigoPix);
      const b = $('pg-copiar'), texto = b.textContent; b.textContent = ok ? 'Código copiado ✓' : 'Copie manualmente';
      avisar(ok ? 'Código copiado.' : 'Não foi possível copiar automaticamente.'); setTimeout(() => { if (b.isConnected) b.textContent = texto; }, 2000);
    }
    else if (acao === 'compartilhar-pix') {
      if (navigator.share) { try { await navigator.share({ title: 'Pix PratiCão (simulação)', text: est.codigoPix }); } catch { /* cancelou */ } }
      else { const ok = await copiar(est.codigoPix); avisar(ok ? 'Código copiado para compartilhar.' : 'Não foi possível compartilhar.'); }
    }
    else if (acao === 'confirmar-dinheiro') {
      if (!$('pg-ciente').checked) { erroCampo('pg-ciente', 'Marque a caixa para confirmar.'); return $('pg-ciente').focus(); }
      const bruto = $('pg-troco').value.trim().replace(/\./g, '').replace(',', '.');
      if (bruto && (!(Number(bruto) >= est.valor))) { erroCampo('pg-troco', `Informe um valor maior ou igual a ${total()}.`); return $('pg-troco').focus(); }
      concluir('dinheiro', 'no_local', bruto ? `Dinheiro, troco para ${moeda(Number(bruto))}` : 'Dinheiro');
    }
    else if (acao === 'fechar') dlg.close();
  }

  function abrir({ ag, aoFechar }) {
    montar();
    est = { ag, valor: Number(ag.servico_preco) || 0, aoFechar, forma: '', registro: null };
    $('pg-resumo').innerHTML = `<div><dt>Serviço</dt><dd>${esc(ag.servico_nome)}</dd></div><div><dt>Pet</dt><dd>${esc(ag.animal_nome)}</dd></div>
      <div><dt>Quando</dt><dd>${dataBR(ag)} às ${hora(ag)}</dd></div><div class="pg-total"><dt>Total</dt><dd>${moeda(est.valor)}</dd></div>`;
    telaEscolha();
    dlg.showModal();
  }
  return { abrir, obter, pode, chipHTML, rotulo, chipStaffHTML, detalheEquipe, situacaoDe, pdfBoleto, boletoDados };
})();
