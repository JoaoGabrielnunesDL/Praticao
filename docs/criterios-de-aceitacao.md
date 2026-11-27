# Critérios de aceitação x API

Resumo de como cada bloco dos *Critérios de aceitação do PratiCão* é atendido pela API (back-end) e onde está o teste.
Itens que são só de tela (mensagens visuais, navegação, botões) ficam no front-end e estão em [`frontend.md`](frontend.md).

| Bloco | Como a API atende | Testes (`backend/tests/`) |
|---|---|---|
| **Agendamento** | Só com animal do próprio tutor e serviço ativo; data futura sem fuso; dentro do expediente (seg–sex 8–18h, sáb 8–14h, dom 8–12h, de 30 em 30 min, terminando até o fechamento); conflito de horário pela duração do serviço (409); `GET /agendamentos/horarios` lista os horários livres; campos obrigatórios (422); erros em `{"detail": "..."}`; cada agendamento traz animal, serviço, data, horário, preço, duração e status; lista vazia devolve `[]`; tutor só vê os próprios | `test_agendamentos.py`, `test_agendamentos_campos.py`, `test_regras_complementares.py` |
| **Cancelamento** | Só `AGENDADO`/`CONFIRMADO`; tutor com 2 h de antecedência (400 depois); status vira `CANCELADO` e continua no histórico; horário é liberado (conflito só conta ativos); tutor não cancela de outro (404) | `test_agendamentos.py` |
| **Cadastro** | Campos obrigatórios e e-mail válido (422); e-mail único sem diferenciar maiúsculas (409); senha com hash bcrypt; nome sem espaços nas pontas; limites de tamanho (telefone 20, e-mail 150, senha 72 bytes); dados consultáveis em `GET /me` | `test_usuarios.py`, `test_regras_complementares.py` |
| **Login** | `POST /login` com e-mail e senha; 401 para credenciais erradas com mensagem; 403 para conta desativada; `POST /logout` invalida o token; o token leva o perfil (tutor, funcionário ou administrador) que decide o que cada um acessa; recuperar e redefinir senha | `test_usuarios.py`, `test_recuperar_senha.py`, `test_regras_complementares.py` |
| **Cadastro de animais** | CRUD só do dono; obrigatórios (nome e espécie) e mensagens de erro (422); outro tutor recebe 404; nomes repetidos são permitidos; animal com agendamentos não é excluído | `test_animais.py`, `test_regras_complementares.py` |
| **Consulta de serviços** | `GET /servicos` público com nome, descrição, preço e duração; só ativos entram em novos agendamentos; lista vazia devolve `[]` | `test_servicos.py`, `test_servicos_todos.py` |
| **Gerenciamento de serviços** | Só o administrador cria, edita, ativa, desativa e exclui; obrigatórios (422); nome único (409); desativado não é agendável; exclusão bloqueada se houver agendamentos (409) | `test_servicos.py`, `test_servicos_gerenciar.py`, `test_servicos_excluir.py` |
| **Gerenciamento de agendamentos** | Funcionário vê todos, filtra por data ou período (máx. 12 meses), muda o status só nas transições permitidas (400 nas demais) e o cliente vê o novo status; tutor não muda status (403) | `test_agendamentos.py` |
| **Gerenciamento de usuários** | Administrador lista (com busca, filtros e paginação), consulta, vê detalhes, desativa/ativa, exclui, **cadastra funcionário** (`POST /admin/usuarios`) e **define o perfil** (`PATCH /admin/usuarios/{id}/perfil`); desativado não loga e o histórico fica; ninguém desativa, exclui ou muda o próprio perfil | `test_admin_usuarios.py`, `test_regras_complementares.py` |
| **Relatórios** | `GET /relatorios/agendamentos` (total, por status, por serviço), `/itens` paginado e `/exportar` em CSV, com filtro de período, status e serviço; mensagem quando não há dados; só funcionário/administrador | `test_relatorios_filtros.py`, `test_relatorios_itens.py`, `test_agendamentos.py` |
| **Segurança e permissões** | Perfis checados em cada rota (401 sem login, 403 sem permissão, 404 para dado de outro tutor); senhas só com hash; token de recuperação não vale como login; logout encerra a sessão | todos os arquivos de teste |

## Papéis do time x API

- **Back-end e QA do back-end:** API com CRUD de tutores, animais, serviços e agendamentos, tratamento de erros e testes (pasta `backend/`).
- **Front-end e QA do front-end:** telas que consomem a API (pasta `frontend/`, endereço da API em `frontend/js/config.js`).
- **PO / Scrum / UX:** regras de negócio confirmadas pelo PO estão em `backend/README.md` (seção "Regras de negócio").

## Regras confirmadas e pontos de atenção

- Antecedência mínima de cancelamento: **2 horas, confirmada com o PO** (constante `ANTECEDENCIA_CANCELAMENTO_HORAS` em `app/routes/agendamentos.py`).
- Expediente de atendimento (`app/regras.py`, espelha `frontend/js/config.js`; se mudar um, mude o outro).
