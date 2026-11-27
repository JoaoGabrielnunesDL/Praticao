# Design System PratiCão — Fase 1 (fundação)

**Direção:** "clínica pet de bairro, cuidada" — **calor + precisão**.
Premium aqui vem de tipografia, hierarquia, espaçamento, cor e consistência — **não de mais decoração**.

Onde está: tokens e componentes em `css/base.css` (seção "DESIGN SYSTEM PRATICÃO"). O kit decorativo pet (formas SVG, pets integrados, onda) continua em `css/praticao-ui.css`.

> **Estado desta fase:** só fundação. Os tokens existem, os componentes `.ds-*` existem, mas **nenhuma tela usa ainda** — o visual atual não muda. Cada tela adota o sistema quando for redesenhada.

---

## 1. Princípios

1. **Uma ação principal por tela.** Ela é a única coisa laranja que se clica.
2. **Borda + superfície + espaço** agrupam. Sombra só no que realmente flutua.
3. **Hierarquia por tipografia e espaço**, não por caixas e cores.
4. **Emoji não é ícone de interface.**
5. **Decoração é subordinada à composição**: pets e patinhas reforçam a marca em pontos escolhidos, nunca preenchem vazio aleatoriamente.
6. **Acessível por padrão**: todas as cores de texto e controle abaixo foram conferidas (WCAG 2.1 AA).

---

## 2. Inventário do sistema anterior (por que precisava de fundação)

| Item | Antes | Agora (tokens) |
|---|---|---|
| Cores hex distintas no CSS | 112 | 5 de marca + 7 neutros + 5 estados (+ fundos) |
| Tamanhos de fonte distintos | 50 | 8 (12–44px) |
| Pesos | 400, 500, 600, 700, 800, 900 | 400, 600, 700 |
| Raios | 16 valores (6px a 28px, 50%, 999px) | 8, 12, 16, 24 (+ pill só para chips/badges) |
| Sombras distintas | 35 | 3 níveis (nenhuma, sutil, elevada) |
| Variáveis CSS | 8 em `base.css` + 4 no kit | sistema completo (abaixo) |
| Foco | contorno laranja (~2,4:1 no fundo azul-claro) e vários campos com `outline:none` | anel azul duplo (≥4,7:1) |
| Fonte | `'Segoe UI', Arial` (fonte do sistema operacional) | mesma nesta fase; recomendação na seção 5 |
| Breakpoints | 26 combinações diferentes | 5 faixas de referência (seção 10) |

As 8 variáveis antigas (`--azul`, `--azul-esc`, `--laranja`, `--laranja-esc`, `--fundo`, `--texto`, `--cinza`, `--borda`) **continuam existindo** (são usadas 300+ vezes pelas telas atuais). A migração para os tokens novos acontece tela a tela.

---

## 3. Paleta (com contraste conferido)

### Marca
| Token | Cor | Uso | Contraste |
|---|---|---|---|
| `--cor-azul-profundo` | `#0a2a6b` | marca, títulos, rodapé | branco sobre ele 13,49:1 |
| `--cor-azul` | `#1b63e6` | **azul padrão**: interação, links, foco, botão secundário | 5,28:1 no branco · 4,79:1 em `#eef4ff` |
| `--cor-azul-forte` | `#0a49b8` | **azul padrão escuro**: hover, texto informativo, títulos | 7,90:1 no branco |
| `--cor-azul-vivo` | `#2a7af5` | **azul padrão claro**: só degradês e ilustração, nunca texto | — |
| `--cor-azul-claro` | `#eef4ff` | fundo de página, superfícies suaves | — |
| `--cor-azul-superficie` | `#dbe8fb` | superfície destacada, linha selecionada | — |
| `--cor-laranja` | `#f28a0c` | **laranja padrão** (botão Fazer Agendamento): **só** CTA principal e acentos de marca | texto azul-profundo sobre ele 5,41:1 |
| `--cor-laranja-claro` | `#ffb23a` | **laranja padrão claro**: topo do degradê do botão, destaques sobre azul-escuro | texto azul-profundo 7,51:1 |
| `--cor-laranja-hover` | `#ff9a2a` | hover do CTA | texto azul-profundo 6,37:1 |
| `--cor-laranja-texto` | `#9c4f00` | raro: texto de marca laranja em fundo claro | 5,31:1 em `#eaf3ff` |

### Degradês padrão
| Token | Composição | Uso |
|---|---|---|
| `--grad-laranja` | `--cor-laranja-claro` → `--cor-laranja` (180°) | botão "Fazer Agendamento", setas dos cartões, selos |
| `--grad-azul` | `--cor-azul-forte` → `--cor-azul` → `--cor-azul-vivo` (100°) | banners e blocos de destaque azuis |

> **Paleta padronizada (v1.2):** o site usa só estes 3 azuis (`#0a49b8`, `#1b63e6`, `#2a7af5`), 2 laranjas (`#f28a0c`, `#ffb23a`), o azul-profundo `#0a2a6b` (títulos) e o laranja de texto `#9c4f00`. Não crie tons novos: use os tokens.

### Neutros
| Token | Cor | Contraste |
|---|---|---|
| `--cor-texto` | `#1c2b4a` | 14,06:1 branco · 11,35:1 em `#dbe8fb` |
| `--cor-texto-2` | `#51607a` | 6,36:1 branco · 5,13:1 em `#dbe8fb` |
| `--cor-borda` | `#e3ebf7` | divisórias/superfícies (decorativo) |
| `--cor-borda-controle` | `#7c8cab` | **contorno de campos**: 3,39:1 (WCAG 1.4.11 exige 3:1; a borda clara dá só 1,20:1) |

### Estados (texto sobre o próprio fundo)
| Estado | Texto / fundo | Contraste |
|---|---|---|
| Sucesso | `#17652a` / `#e3f6e5` | 6,34:1 |
| Erro | `#b3261e` / `#fdecea` | 5,72:1 |
| Alerta | `#8a4600` / `#fff1de` | 6,39:1 |
| Pendente | `#9a5300` / `#ffe2b8` | 4,66:1 |
| Informação | `#174bb0` / `#e4eeff` | 6,73:1 |
| Perigo (botão) | branco / `#c62828` | 5,62:1 |

### Regra do laranja
- **Sim:** fundo do CTA principal (1 por tela), pequenos acentos de marca (logo "Cão", onda do rodapé, ilustração).
- **Não:** texto sobre branco (2,50:1 — reprova), preço, link comum, título, rótulo genérico, item ativo do menu, todos os botões da tela.
- **Texto do CTA laranja é azul-profundo** (5,41:1). Branco sobre laranja reprova (2,50:1).
  Alternativa avaliada e documentada: laranja escuro `#b35400` com texto branco (5,02:1) — passa, mas o laranja fica "marrom" e perde o calor da marca. **Recomendação: azul-profundo sobre o laranja da marca.**

---

## 4. Tokens (referência rápida)

```
Cor        --cor-*  (marca, neutros, estados, semânticas: --cor-fundo-pagina, --cor-superficie, --cor-titulo,
                     --cor-link, --cor-foco, --cor-cta, --cor-cta-texto)
Tipografia --fonte-ui, --fonte-titulo, --texto-12 … --texto-44, --peso-normal|medio|forte,
           --altura-linha-titulo|texto|leitura, --espaco-letra-rotulo
Espaço     --esp-1 (4) --esp-2 (8) --esp-3 (12) --esp-4 (16) --esp-6 (24) --esp-8 (32) --esp-12 (48) --esp-16 (64)
           --esp-titulo-conteudo (24) --esp-secao (48) --esp-componente (20)
Raio       --raio-p (8) --raio-m (12) --raio-g (16) --raio-xg (24) --raio-pill (só chips/badges)
Sombra     --sombra-nenhuma --sombra-sutil --sombra-elevada
Controles  --altura-controle (44) --altura-botao (40) --altura-botao-g (48) --anel-foco
Movimento  --transicao (150ms)
```

Nas telas, prefira os **semânticos** (`--cor-titulo`, `--cor-link`, `--cor-cta`) aos primitivos.

---

## 5. Tipografia

### Escala
| Token | px | Uso |
|---|---|---|
| `--texto-12` | 12 | **só** metadados (data, contagem, legenda) |
| `--texto-14` | 14 | rótulos de campo, tabela densa, badges maiores |
| `--texto-16` | 16 | corpo |
| `--texto-18` | 18 | subtítulo, corpo de destaque |
| `--texto-22` | 22 | título de seção / cartão |
| `--texto-28` | 28 | título de página no celular |
| `--texto-36` | 36 | título de página |
| `--texto-44` | 44 | hero (Home, Login) |

Pesos: **400** (texto), **600** (rótulos, botões), **700** (títulos). 800/900 deixam de ser padrão.
Entrelinha: títulos 1,15 · interface 1,5 · leitura (dicas/artigo) 1,65 com medida de ~65–75 caracteres.
Mínimo: 12px (hoje há textos de 11,2px no Painel Admin, 11,5px em Meus Animais e 11,8px em Relatórios).

### Fonte — avaliação e recomendação (NÃO aplicada nesta fase)
- **Hoje:** `'Segoe UI', Arial`. É a fonte do sistema operacional: no Windows parece "app do Windows"; no Mac/Android/Linux cai para Arial/Helvetica. É uma das principais causas da aparência genérica.
- **Fontes já disponíveis no projeto:** nenhuma (não há `@font-face` nem pasta de fontes).
- **Recomendação:** uma única família de marca, **hospedada no próprio projeto** (sem CDN externo), por exemplo **Figtree** (licença OFL): humanista-geométrica, calorosa sem ser infantil, muito legível em tamanhos de interface, com pesos 400–700 numa fonte variável.
  - Por quê uma só família: premium vem de controle de escala e peso, não de combinar fontes.
  - Alternativa equivalente: **Nunito Sans** (mais arredondada, mais "pet").
- **Impacto de adicionar (para decidir depois):**
  - 1–2 arquivos `.woff2` (~30–70 KB, só caracteres latinos) em `frontend/fonts/` + um `@font-face` com `font-display:swap` em `base.css`.
  - Muda a largura dos textos: é preciso retestar tabelas compactas (Agenda, Usuários, Serviços) e botões em 1280–1440px.
  - Basta trocar `--fonte-ui`/`--fonte-titulo`; as telas que já usam os tokens herdam.

---

## 6. Espaçamento e raios

- Escala de 4px: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64. Fora disso, só com justificativa.
- Título da página → conteúdo: **24**. Entre seções: **48**. Dentro de cartões/superfícies: **20–24**.
- Raios: **8** controles pequenos · **12** botões, campos, componentes · **16** cartões/superfícies · **24** hero e blocos grandes.
  Pill (`--raio-pill`) **só** para chips, filtros e badges — não para botões.

## 7. Sombras e superfícies

| Nível | Token | Quando |
|---|---|---|
| Nenhuma | `--sombra-nenhuma` | padrão de cartões e superfícies: use **borda + superfície + espaço** (`.ds-superficie`) |
| Sutil | `--sombra-sutil` | itens clicáveis que precisam se destacar levemente do fundo |
| Elevada | `--sombra-elevada` | só o que flutua: diálogos, menus, painel lateral (`.ds-superficie--elevada`) |

---

## 8. Componentes (classes `.ds-*`, de adesão explícita)

### Título de página — `.ds-titulo-pagina`
`.ds-rotulo` (opcional) + `h1` (36px/700, azul-profundo) + `.ds-subtitulo` (18px, texto-2, ~62 caracteres), 24px até o conteúdo.

**Rótulo acima do título — decisão pendente (não aplicada):**
- **A. Manter como padrão de produto:** pequeno, cinza-azulado (`--cor-texto-2`, 5,76:1 no fundo claro), nunca laranja. Útil como "onde estou" (Área do tutor, Operação). Risco: o detector de design marca esse recurso como assinatura de template (6 ocorrências hoje).
- **B. Remover:** hierarquia só com título + subtítulo; a localização fica no menu (item ativo). Mais limpo e menos "template".
- O componente suporta as duas (o `.ds-rotulo` é opcional). Recomendação técnica: **B nas telas operacionais**, **A apenas onde o contexto não é óbvio** — decisão sua.

### Botões — `.ds-btn` + variante
| Variante | Classe | Visual | Contraste |
|---|---|---|---|
| Primário (CTA, 1 por tela) | `.ds-btn--primario` | laranja da marca, texto azul-profundo | 5,41:1 (hover 6,37:1) |
| Secundário | `.ds-btn--secundario` | branco, borda e texto azul | 5,82:1 |
| Terciário / texto | `.ds-btn--texto` | só texto azul sublinhado | 5,82:1 |
| Destrutivo | `.ds-btn--destrutivo` | contorno vermelho (não domina a tabela) | 5,62:1 |
| Destrutivo cheio | `.ds-btn--destrutivo-cheio` | vermelho sólido — **só no botão final da confirmação** | 5,62:1 |
Alturas: 40px (`.ds-btn`) e 48px (`.ds-btn--g`). Raio 12. Desabilitado: fundo `#f1f5fb`, texto `#8a96ab`.

### Campos — `.ds-campo`
44px, raio 12, borda `--cor-borda-controle` (3,39:1), hover escurece a borda, **foco com anel duplo** (branco + azul, visível em qualquer fundo), erro (`[aria-invalid=true]` ou `.invalido`) com borda vermelha + `.ds-erro`, ajuda em `.ds-ajuda`, desabilitado acinzentado.

### Superfície — `.ds-superficie`
Substitui o "cartão para tudo": fundo branco, borda 1px, raio 16, padding 20. Sem sombra. `.ds-superficie--elevada` só para o que flutua.

### Tabela — `.ds-tabela`
Cabeçalho discreto (14px/600, texto-2, sem fundo colorido), linhas limpas com divisória de 1px, hover azul-claro. Ações secundárias como `.ds-btn--texto`/`.ds-btn--secundario`; **Excluir como `.ds-btn--destrutivo` (contorno)** — nunca o elemento mais forte da linha.

### Badges de status — `.ds-badge` + variante
Mantém a ideia aprovada (ícone + texto), com forma de **etiqueta (raio 8)** em vez de pill: `--sucesso`, `--pendente`, `--erro`, `--info`, `--neutro`. Mapeamento do domínio: Concluído → sucesso · Pendente → pendente · Cancelado → erro · Confirmado → info.

### Foco
Todo `.ds-*` interativo usa `--anel-foco` (anel branco de 3px + azul de 2px). O foco global antigo (contorno laranja em `base.css`) continua valendo para as telas atuais até serem migradas.

---

## 9. Ícones

**Regra: emoji não é ícone de interface.** Ícones são SVG (o kit em `praticao-ui.css` já tem pata, osso, coração, brilho, casinha, pote, bolinha, gato, calendário, histórico, sino, alerta).

Inventário atual (nada foi trocado nesta fase):

| Onde | Emojis | Tipo | Destino |
|---|---|---|---|
| `index.html` | 🐶🐱🐕🐈🛁✂️🧴🐾🏪🥣… (10 linhas) | "fotos" e ícones de serviço | fotos reais dos pets + SVG |
| `login.html`, `redefinir-senha.html` | 🐕 🐶🐱 👤 🔒 🔑 ✅ | ilustração e avatar | foto dos pets + SVG |
| `perfil.html` | ⚠️ 🪪 👤 ✉️ 📱 🎓 🛡️ 🔒 ✏️ ↩ ↪ (12 linhas) | rótulos e botões — **lidos pelo leitor de tela** | SVG `aria-hidden` |
| `meus-animais.html` | ⚠️ 🐾 🧬 📅 ✅ ❤️ ✂️ (8) | indicadores e atalhos | SVG |
| `meus-agendamentos.html` | ⚠️ 📅 ⏳ 👍 ✅ ❌ (7) | indicadores | SVG |
| `agendamento.html` | ⚠️ 🐾 📅 📋 ✅ (6) | títulos de seção e botão | SVG |
| `relatorios.html` | ⬇ 🖨 | botões Exportar/Imprimir | SVG |
| `404.html`, `acesso-negado.html` | 🏠 | botão | SVG casinha |
| `curiosidades.html`, `dicas.html`, `servicos.html` | 🩺 📅 | nota / banner | SVG |
| **JS** `servicos.js` (10 linhas), `meus-agendamentos.js` (7), `meus-animais.js` (6), `admin-usuarios.js` (4), `estados.js`, `agenda.js`, `admin.js`, `agendamento.js`, `painel-tutor.js`, `relatorios.js`, `servicos-admin.js`, `curiosidades.js`, `dicas.js`, `dicas-comum.js`, `artigo.js`, `artigos-dados.js`, `perfil.js` | ícones de serviço, espécie, ações (👁 🗑 ✏️), estados (📋 ⚠️ 🔎) | **gerados pelo JavaScript** | exigem alterar JS (autorização) |

Observação: `©` em `header.js` aparece em buscas de emoji mas é tipografia, não ícone — fica.
Pode continuar como decoração (não-interface): nenhum emoji; decoração usa as formas SVG do kit.

---

## 10. Pets, decoração, onda e rodapé

**Pets** (foto direto sobre o fundo, sem círculo, escudo, selo ou caixa atrás):
- **Grandes:** Home, Login/Redefinir senha, painéis (Tutor, Admin, Agenda), estados (404, vazio, erro quando fizer sentido).
- **Menores ou ausentes:** telas operacionais — tabelas, formulários, CRUD.

**Patinhas:** nunca espalhadas pela tela em %. Só como **marca d'água** de hero, detalhe do rodapé ou ícone.

**Onda:** deixa de ser uma mancha laranja repetida no canto de cada página. Passa a ser a **borda superior do rodapé** (transição orgânica conteúdo → rodapé), igual em todo o produto.

**Rodapé (próxima fase; `header.js` gera a estrutura e NÃO foi alterado):**
- Telas logadas: **compacto** — logo, contato curto, copyright; onda como borda superior; meta ≤ ~15% da altura da página no celular (hoje chega a 44%).
- Telas públicas: completo, mesma linguagem e mesma onda.
- Tokens já preparados: `--cor-azul-profundo` (fundo, 13,49:1 com branco), texto secundário claro `#c9dafc` (9,58:1), `--cor-laranja` só na onda/logo.

**Breakpoints de referência** (CSS não aceita variáveis em `@media`; use estes valores):
celular ≤599 · tablet 600–899 · notebook 900–1279 · desktop ≥1280 · largo ≥1600.

---

## 11. O que é global x o que é específico de cada tela

**Global (deve vir do sistema):** cores, tipografia, espaçamento, raios, sombras, botões, campos, foco, tabela, badges, título de página, cabeçalho, rodapé, estados (vazio/erro/sucesso/confirmação), regra de ícones.

**Específico por tela (não deve ser igual em todas):** composição do topo, presença e tamanho dos pets, qual é a ação principal, grids (tabela x cartões x formulário), densidade (operacional x conteúdo), decoração pontual.

---

## 12. Como migrar uma tela (fases seguintes)

1. Trocar cores/tamanhos fixos do CSS da tela pelos tokens.
2. Usar os componentes `.ds-*` **somando** classes no HTML (nunca removendo IDs, `data-*` ou classes que o JS usa).
3. Uma única ação primária laranja; o resto secundário/texto.
4. Retestar a tela (funcional + 360/768/1024/1280/1366/1600/1920 + zoom 200%) e comparar com a linha de base.

---

## Ícones decorativos da home (3.34)

A home (`index.html` + `css/home.css`) usa poucos ícones decorativos (patinhas de tamanhos variados, alguns ossinhos, corações, um peixe e uma carinha de gato), no mesmo ritmo do painel do administrador: nas bordas e no meio dos cabeçalhos, com bastante espaço livre. Regras: ficam sempre atrás do conteúdo (`.hm-deco`, `aria-hidden`), nunca usam "risquinhos" e somem ou diminuem em telas estreitas (`.g` laterais, `.h` faixas, `.w` só em telas largas, `.mo` só no celular). Para mexer em um ícone, ajuste a classe dele no fim de `home.css` (largura `--w`, rotação `--r`, posição `left`/`top`).
