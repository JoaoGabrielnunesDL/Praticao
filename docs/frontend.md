# PratiCão – Front-end (telas e comportamento)

> Documento de referência das telas. Para subir o projeto, veja o [README principal](../README.md).

Telas em HTML, CSS e JavaScript puro (pasta `frontend/`), que conversam com a API do back-end (FastAPI, pasta `backend/`).

## Como rodar

1. Suba o back-end (`docker compose up -d --build` dentro de `backend/`). A API fica em http://localhost:8000.
2. Sirva a pasta `frontend/` na porta 5500: no VS Code, clique com o direito em `frontend/index.html` > **Open with Live Server**. Sem o VS Code: `python -m http.server 5500` dentro de `frontend/` e acesse http://localhost:5500.
   A porta **5500** é a única liberada no CORS do back-end.
3. O endereço da API e o telefone/e-mail do rodapé ficam em `js/config.js`.

## Contas de teste (criadas pelo seed do back-end, senha 123456)

| Perfil | E-mail | Entra em |
|---|---|---|
| Administrador | admin@praticao.com | painel-admin.html |
| Funcionário | funcionario@praticao.com | painel-funcionario.html |
| Tutor | tutor@teste.com | painel.html |

## Telas do administrador

- `painel-admin.html` – Visão geral: indicadores de usuários e de agendamentos de hoje, gráfico de status, prévia da agenda e acesso rápido. Os números levam às telas já filtradas.
- `admin-usuarios.html` – Gerenciar usuários: lista paginada (5 por página), busca por nome ou e-mail, filtros de perfil e situação, painel lateral “Ver detalhes” (com últimos agendamentos) desativar/reativar com confirmação e excluir permanentemente (a API recusa se o usuário tiver animais). Usa `GET /admin/usuarios/busca` e `GET /admin/usuarios/{id}/detalhes`.
- `painel-funcionario.html` – Agenda (a mesma do funcionário; aceita `?data=` e `?status=`). Botões Hoje, Últimos 7 dias e Último mês (mês anterior inteiro) usam `GET /agendamentos?inicio=&fim=`.
- `gerenciar-servicos.html` (ver seção abaixo) – **só o administrador** acessa; o funcionário não tem mais esse menu.
- `404.html`, `acesso-negado.html` e `sessao-expirada.html` – páginas de estado: página não encontrada, sem permissão para a tela (`Auth.exigirPerfil` envia para ela) e sessão expirada (qualquer 401 da API envia para ela; depois do login volta à tela anterior, se o perfil puder abri-la). O botão principal leva ao painel do perfil.
- `js/estados.js` + `css/estados.css` – componentes reutilizáveis: `Estados.vazio()` (lista vazia / pesquisa sem resultado com "Limpar filtros") e `Estados.erro()` (erro ao carregar com "Tentar novamente"; a mensagem muda se for sem conexão, demora ou erro do servidor). `api.js` marca cada erro com `tipo` (`rede`, `timeout`, `servidor`, `requisicao`) e tem limite de 15 s. A janela de confirmação é `perguntar()` (comum.js), com X, Cancelar e Confirmar.
- `relatorios.html` e `perfil.html` – compartilhadas com o funcionário (perfil também com o tutor).

## Telas do funcionário

Menu: **Agenda**, **Relatórios** e **Perfil**. Gerenciar serviços passou para o administrador na versão 2.0.

## Recuperar senha

`redefinir-senha.html` (link "Esqueci minha senha?" do login) tem 3 passos na mesma tela: e-mail → nova senha → concluído → "Ir para o login". Funciona com `POST /recuperar-senha` e `POST /redefinir-senha` do back-end (modo demonstração: o token vem na resposta, sem e-mail).

## Em todas as telas

Faixa azul com telefone e e-mail no topo, cabeçalho fixo e rodapé (montados por `js/header.js`).

## Tela Serviços (tutor)

`servicos.html` + `css/catalogo-servicos.css` + `js/servicos.js`. Catálogo com menu lateral de categorias, busca por nome, filtro superior (sincronizado com o menu), cartões clicáveis, janela de detalhes e banner de agendamento. Usa `GET /servicos` (só serviços ativos).

- Categorias: a API ainda não tem esse campo, então `js/servicos.js` deduz pelo nome (lista `CATEGORIAS`). Categoria sem serviços não aparece.
- Estados tratados: carregando, erro com "Tentar novamente", sem serviços, busca sem resultado e categoria vazia.
- "Agendar este serviço" abre `agendamento.html?servico=ID`; "Fazer Agendamento" abre `agendamento.html` (a tela de agendamento ainda é "em breve").
- Para ver Consulta Veterinária e Vacinação, rode o seed atualizado (`docker compose exec api python seed.py`) ou cadastre em Gerenciar serviços.

## Painel do Tutor

`painel.html` + `css/painel-tutor.css` + `js/painel-tutor.js`. Usa `GET /animais` e `GET /agendamentos` (a API já devolve só os dados do tutor logado), sem alterar o back-end.

- Cartão **Meus animais**: contador; sem animais, o botão vira "Cadastrar animal".
- Cartão **Próximo agendamento**: primeiro agendamento futuro Pendente ou Confirmado; sem nenhum, mostra o estado vazio. Quando o funcionário confirma ou cancela na agenda, o painel reflete ao ser aberto ou recarregado.
- **Ações rápidas**: Novo agendamento (exige ao menos um animal), Cadastrar animal (`meus-animais.html?novo=1`), Histórico de serviços (`meus-agendamentos.html?status=CONCLUIDO`) e Lembretes (janela com os próximos agendamentos; não há tabela de lembretes).
- Estados: carregando, erro com "Tentar novamente" e sessão expirada. O banner inferior é só informativo.

## Meus Animais (tutor)

`meus-animais.html` + `css/meus-animais.css` + `js/meus-animais.js`. Usa `GET/POST /animais`, `PUT/DELETE /animais/{id}` e `GET /agendamentos` (sem alterar o back-end).

- Indicadores calculados na hora: animais, espécies diferentes, agendamentos ativos (Pendente + Confirmado) e serviços concluídos.
- **Cadastrar** (dois botões) e **Editar** usam o mesmo formulário (nome e espécie obrigatórios, raça opcional). `?novo=1` já abre o cadastro (usado pelo painel).
- **Excluir** pede confirmação. Animal com agendamentos não pode ser excluído (regra da API, erro 409; a tela avisa antes).
- "Agendar serviço" abre `agendamento.html?animal=ID`; os botões de agendar sem nenhum animal levam ao cadastro.
- A API não tem foto, vacinas nem histórico de saúde; por isso há um ícone por espécie e o 4º indicador é "Serviços concluídos".

### Meus Animais: indicadores interativos
Clicar em **Animais cadastrados** abre uma janelinha sobre a tela com a foto (ícone) e o nome de cada animal. Clicar em **Espécies diferentes** abre outra, agrupada por espécie, com nome, espécie e raça. Fecham com ×, Esc ou clicando fora.

## Novo Agendamento (tutor)

`agendamento.html` + `css/novo-agendamento.css` + `js/agendamento.js`. Usa `GET /servicos`, `GET /animais`, `GET /agendamentos` e `POST /agendamentos` (sem alterar o back-end).

- Formulário único: serviço, pet, data, horário e observações (até 300 caracteres, com contador). O resumo (serviço, pet, data e horário, duração e valor) atualiza sozinho e o botão Confirmar só habilita com os obrigatórios preenchidos.
- Chega preenchido quando vem de outra tela: `?servico=ID` e `?animal=ID`. Com um só animal, ele já vem escolhido. Sem animais, a tela leva ao cadastro.
- Horários: gerados pelo expediente em `js/config.js` (`EXPEDIENTE` e `PASSO_MIN`), só se o serviço couber antes do fechamento, sem horários passados e sem sobrepor agendamentos do próprio tutor. Como a API não tem rota de disponibilidade, a validação final é do `POST`: se devolver 409, o horário é marcado como indisponível e a tela pede outra escolha.
- Duplo clique não duplica o envio. Erros da API mantêm os dados preenchidos. Cancelar com dados preenchidos pede confirmação.
- Sucesso: janela com número, pet, serviço, data, horário, valor e status Pendente (AGENDADO na API), com atalho para Meus Agendamentos. O funcionário vê o mesmo registro na agenda.

## Meus Agendamentos (tutor)

`meus-agendamentos.html` + `css/meus-agendamentos.css` + `js/meus-agendamentos.js`. Usa `GET /agendamentos`, `GET /animais` e `POST /agendamentos/{id}/cancelar` (sem alterar o back-end).

- Indicadores (Agendamentos, Pendente, Confirmado, Concluído, Cancelado) calculados na hora. Funcionam como filtro rápido e ficam sincronizados com o filtro de status. Aceita `?status=CONCLUIDO` (usado pelo painel e por Meus Animais).
- Pesquisa por animal, serviço, data (`14/11/2026`), número ou situação, sem diferenciar acentos, combinada com o filtro. Botão × para limpar.
- Cada cartão: animal e espécie, serviço, dia da semana (calculado da data), horário, duração e status.
- **Ver detalhes** (janela): código, animal, serviço, data, horário, duração, valor, status e observações. Pendente ou Confirmado: botão **Cancelar agendamento** (com confirmação; a regra das 2 horas é validada pela API). Concluído ou Cancelado: só consulta e **Agendar novamente** (abre `agendamento.html` já preenchido).
- Estados: carregando (esqueletos), sem agendamentos, nenhum resultado do filtro, erro com "Tentar novamente" e sessão expirada. Botão Atualizar recarrega mantendo pesquisa e filtro.

## Meu Perfil

`perfil.html` + `css/perfil.css` + `js/perfil.js` (compartilhada por tutor, funcionário e administrador). Usa `GET /me`, `PUT /me` e `POST /logout`, que já existiam no back-end.

- **Dados pessoais**: um cartão grande que ocupa a largura da tela, com um painel de boas-vindas (inicial do nome) e os campos em caixas: nome, e-mail, telefone (ou "Não informado"), tipo de conta e status. Tipo de conta e status não são editáveis.
- **Editar dados**: janela com nome e telefone (e-mail só leitura). Valida nome (mínimo 2 letras) e telefone (com DDD, opcional); em caso de erro a janela continua aberta. Ao salvar, atualiza a tela e o nome do cabeçalho.
- **Voltar ao painel**: vai para o painel do perfil logado.
- **Sem bloco de alterar senha**: a troca de senha é feita pelo "Esqueci minha senha" do login (`redefinir-senha.html`). Um aviso na tela explica isso. A rota `POST /me/alterar-senha` continua existindo no back-end, só não é usada pelo front.
- **Sair da conta**: pede confirmação, chama `POST /logout`, limpa a sessão e vai para o login.
- **Acessibilidade (A A A)**: o tamanho de letra escolhido é guardado e mantido nas outras telas (`js/header.js`).

## Dicas e Curiosidades (público)

Três telas, abertas a qualquer visitante (não exigem login). O menu "Curiosidades" aparece para visitante e tutor.

| Tela | Arquivos | O que faz |
|---|---|---|
| `curiosidades.html` | `js/curiosidades.js` | Banner, busca e as categorias **Alimentação** e **Passeios** com 3 destaques cada. "Leia mais" abre o artigo; "Ver mais dicas de ..." abre a listagem da categoria. |
| `dicas.html` | `js/dicas.js` | Listagem com abas (Todas, Alimentação, Passeios), busca e contagem. `?categoria=alimentacao` ou `passeios`; categoria que não existe volta para "Todas". |
| `artigo.html` | `js/artigo.js` | Uma única tela para todos os artigos (`?id=`): imagem, data, introdução, tópicos, aviso "Importante" e "Leia também" (mesma categoria). |

- O botão **Voltar** respeita a origem: vindo da listagem (`&de=dicas&cat=...`) volta à lista da mesma categoria; vindo da página principal volta a ela.
- **Conteúdo**: a API ainda não tem artigos, então os 12 textos ficam em `js/artigos-dados.js`, no formato que uma API devolveria. Para publicar uma dica, acrescente um item em `ARTIGOS` (`publicado: false` esconde o artigo). Só artigos publicados aparecem.
- **Busca**: por título, resumo ou qualquer texto do artigo, sem diferenciar acentos (compara o começo das palavras: "raç" acha "ração", mas não "duração").
- **Estados**: categoria sem dicas, busca sem resultado, artigo inexistente ("Conteúdo não encontrado") e foto que não carrega (troca por um ícone). Como os dados são locais, não há carregamento nem erro de rede.
- As fotos dos cartões estão em `img/dicas/` (recortadas do protótipo). Todo artigo tem o aviso de que as dicas não substituem o veterinário.
- Os cartões da página inicial (seção "Curiosidades e Novidades") agora abrem artigos reais, sem pedir login.

## Gerenciar Serviços (somente administrador) – mudou na 2.0

`gerenciar-servicos.html` + `css/gerenciar-servicos.css` + `js/servicos-admin.js`. Usa `GET /servicos?todos=true`, `POST /servicos`, `PUT /servicos/{id}`, `PATCH /servicos/{id}/desativar` e `/ativar` e, novo, `DELETE /servicos/{id}`.

- **Quem acessa**: só o administrador. Se um funcionário abrir o endereço, volta para a Agenda. A API também recusa (403) criar, editar, ativar, desativar e excluir serviço para quem não é administrador.
- **Tabela** com nome, descrição, preço, duração, status (✓ Ativo / ○ Inativo, nunca só por cor) e ações **Editar**, **Desativar/Reativar** e **Excluir**. Contador de registros.
- **Busca por nome** (sem diferenciar acentos) e **filtro de status** (todos, ativos, inativos), com "Limpar filtros".
- **Novo serviço** e **Editar** usam o mesmo painel lateral (no celular vira uma tela própria, com "← Voltar"). Valida nome (mínimo 2 letras), preço (aceita `60`, `60,5`, `1.200,50`; maior que zero) e duração (inteiro maior que zero). Nome repetido é recusado pela API (409).
- **Desativar** (janela de confirmação): o serviço some do catálogo do tutor, mas nada é apagado e os agendamentos continuam. **Reativar** é direto.
- **Excluir** (novo): janela de confirmação avisando que não dá para desfazer. Exclui de vez do banco. Se o serviço já tem agendamentos (mesmo cancelados), a API devolve 409 e a tela mostra a mensagem sugerindo **Desativar**, para não quebrar o histórico e os relatórios.
- **Estados**: carregando (esqueleto), lista vazia, busca sem resultado, erro de conexão (com "Tentar novamente"), mensagens de sucesso e de erro. Duplo clique não duplica o envio.

## Relatórios do Sistema (funcionário e administrador) – refeita na 2.0

`relatorios.html` + `css/relatorios.css` + `js/relatorios.js`. Usa `GET /relatorios/agendamentos` (cartões e gráficos), `GET /relatorios/agendamentos/itens` (tabela, com os filtros `status` e `servico_id`) e `GET /relatorios/agendamentos/exportar` (CSV). Atalhos Hoje, Últimos 7 dias, Este mês e Último mês já geram o relatório; as datas são validadas na hora (limite de 12 meses); há aviso de período sem dados e botão Imprimir / PDF.

- **Período**: início e fim obrigatórios (o fim não pode ser anterior ao início; nada é enviado à API se estiver errado). Atalhos **Hoje**, **Últimos 7 dias** e **Este mês** só preenchem as datas; o relatório é gerado em **Gerar relatório**. A tela abre com o mês atual.
- **Cartões** (Total, Pendentes, Confirmados, Concluídos, Cancelados), **gráfico de barras** (serviços mais solicitados, até 6) e **gráfico de rosca** com a porcentagem de cada status.
- **Filtros interativos**: clicar em um cartão ou na legenda filtra a tabela por status; clicar em uma barra filtra por serviço. Os dois se combinam; clicar de novo remove. Aparecem etiquetas com os filtros ativos e "Limpar filtros". O filtro é feito pela API (a tabela é paginada no servidor).
- **Tabela** (data, horário, serviço, pet, tutor, status) com paginação numerada (10 por página) e "Mostrando X a Y de N registros". No celular vira lista de cartões.
- **Detalhes**: clicar (ou Enter) em uma linha abre uma janela com código, pet (espécie e raça), tutor e telefone, valor, duração, status e observações.
- **Exportar CSV**: baixa os agendamentos do período respeitando os filtros (abre no Excel).
- Mostra o período aplicado e a hora da última atualização. Estados: carregando, erro com "Tentar novamente", sem agendamentos no período e sem resultado para os filtros.
