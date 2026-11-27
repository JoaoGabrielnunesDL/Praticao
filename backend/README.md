# PratiCão (back-end) – versão final

API de gestão de animais e agendamento de serviços de banho e tosa. Tutores cadastram seus animais e agendam serviços; funcionários acompanham atendimentos e relatórios; administradores também gerenciam serviços e usuários.

**Esta pasta (`backend/`) é só o back-end do monolito PratiCão; o front-end fica em `../frontend`.** Ela roda **somente no Docker**, com PostgreSQL dentro do Docker. Não existe SQLite nem outro banco, e fora do Docker a API se recusa a iniciar.

## Tecnologias

| Tecnologia | Para que serve no projeto |
|---|---|
| Python 3.14 | linguagem da API (imagem `python:3.14-slim`) |
| FastAPI + Uvicorn | API REST e documentação interativa (Swagger em `/docs`) |
| Pydantic (e-mail-validator) | validação dos dados enviados (campos obrigatórios, e-mail, tamanhos) |
| SQLAlchemy + psycopg2 | acesso ao banco (ORM) |
| PostgreSQL 16 | banco de dados (container `praticao-db`) |
| JWT (python-jose) + bcrypt | login com token e senhas guardadas com hash |
| pytest + httpx | testes automatizados da API |
| Docker + Docker Compose | sobe banco e API com um comando; **é a única forma de rodar a API** |

Front-end (pasta `../frontend`): HTML, CSS e JavaScript puro, servido na porta 5500 (Live Server ou `python -m http.server`).

## Requisitos

Só o **Docker Desktop** (Windows/Mac) ou Docker Engine + Compose (Linux). Não precisa instalar Python nem PostgreSQL. Confira:

```
docker --version
docker compose version
```

## Como rodar (passo a passo)

1. Abra o **Docker Desktop** e espere ficar "running".
2. Dentro da pasta `backend/`, o arquivo `.env` já vem pronto para desenvolvimento. Se ele não existir: `copy .env.example .env` (Windows) ou `cp .env.example .env`, e preencha `SECRET_KEY` (gere com `python -c "import secrets; print(secrets.token_urlsafe(48))"`).
3. Suba tudo (banco + API). Na primeira vez as tabelas e os dados iniciais (usuários de teste e serviços) são criados sozinhos:

```
docker compose up -d --build
```

4. Acompanhe: `docker compose logs -f api` (deve mostrar `Dados iniciais criados` e `Application startup complete`).
5. Abra http://localhost:8000/docs (Swagger). A raiz `http://localhost:8000` redireciona para lá.
6. Para parar: `docker compose down` (os dados continuam salvos). Para subir de novo: `docker compose up -d`.

Sempre que alterar o código: `docker compose up -d --build`.

## Criar o banco do zero

Apaga **todos os dados** e recria o banco limpo:

```
docker compose down -v
docker compose up -d --build
```

O `-v` remove o volume `praticao_dados`, onde o PostgreSQL guarda os dados. Ao subir de novo, o banco é criado vazio, a API cria as tabelas e o `seed.py` insere os usuários e serviços iniciais.

Importante: o PostgreSQL só lê `POSTGRES_USER`, `POSTGRES_PASSWORD` e `POSTGRES_DB` **na primeira criação do volume**. Se mudar essas variáveis no `.env`, rode o `down -v` antes.

Para zerar também as imagens: `docker compose down -v --rmi local`.

## Comandos úteis

| O que fazer | Comando |
|---|---|
| Ver os containers | `docker compose ps` |
| Logs da API | `docker compose logs -f api` |
| Parar sem apagar dados | `docker compose down` |
| Listar as tabelas | `docker compose exec db psql -U postgres -d praticao -c "\dt"` |
| Ver os usuários | `docker compose exec db psql -U postgres -d praticao -c "select id, email, perfil, ativo from usuarios;"` |
| Rodar o seed de novo | `docker compose exec api python seed.py` |
| Backup | `docker compose exec -T db pg_dump -U postgres praticao > backup.sql` |
| Testes | `docker compose run --rm api python -m pytest -q` |

Para olhar o banco com pgAdmin ou DBeaver: host `localhost`, porta `5433`, usuário e senha do `.env`, banco `praticao`.

## Usuários de teste

Criados pelo `seed.py` (desenvolvimento; troque as senhas em qualquer uso real):

| Perfil | E-mail | Senha |
|---|---|---|
| Funcionário | funcionario@praticao.com | 123456 |
| Administrador | admin@praticao.com | 123456 |
| Tutor | tutor@teste.com | 123456 |

No Swagger, clique em **Authorize** e entre com e-mail (campo `username`) e senha.

## Endpoints

Exigem login (token Bearer), exceto os marcados como públicos.

| Área | Método e rota | Quem acessa |
|---|---|---|
| Usuários | `POST /cadastro`, `POST /login` | público |
| | `POST /recuperar-senha` (corpo `{email}`), `POST /redefinir-senha` (corpo `{token, nova_senha}`) | público |
| | `GET /me`, `PUT /me`, `POST /me/alterar-senha` | usuário logado |
| | `POST /logout` (encerra a sessão: o token deixa de valer) | usuário logado |
| Animais | `GET /animais`, `POST /animais` | tutor |
| | `GET /animais/{id}`, `PUT /animais/{id}`, `DELETE /animais/{id}` | tutor (somente os próprios) |
| Serviços | `GET /servicos` (só os ativos) | público |
| | `GET /servicos?todos=true` (ativos e inativos) | funcionário ou administrador (para os demais o parâmetro é ignorado) |
| | `POST /servicos`, `PUT /servicos/{id}`, `PATCH /servicos/{id}/desativar`, `PATCH /servicos/{id}/ativar` | **administrador** |
| | `DELETE /servicos/{id}` (exclusão permanente; 409 se o serviço tiver agendamentos) | **administrador** |
| Agendamentos | `POST /agendamentos`, `GET /agendamentos` (filtro `?data=AAAA-MM-DD` ou período `?inicio=AAAA-MM-DD&fim=AAAA-MM-DD`, máx. 12 meses) | tutor (os próprios) ou funcionário (todos) |
| | `GET /agendamentos/horarios?data=AAAA-MM-DD&servico_id=N` (horários livres do dia para o serviço: dentro do expediente, sem passado e sem conflito) | usuário logado |
| | `POST /agendamentos/{id}/cancelar` | tutor (dono) ou funcionário |
| | `PATCH /agendamentos/{id}/status` | funcionário ou administrador |
| Administração | `GET /admin/usuarios`, `GET /admin/usuarios/{id}` | administrador |
| | `POST /admin/usuarios` (cadastra funcionário, padrão, ou outro administrador/tutor; corpo `{nome, email, senha, telefone, perfil}`) | administrador |
| | `PATCH /admin/usuarios/{id}/perfil` (define as permissões: `tutor`, `funcionario` ou `administrador`; 400 na própria conta) | administrador |
| | `GET /admin/usuarios/busca` (tela Gerenciar usuários: filtros `busca`, `perfil` e `situacao` = `ativas`/`inativas`, funcionando juntos; paginação `pagina`, padrão 1, e `tamanho`, padrão 5, máximo 50) | administrador |
| | `DELETE /admin/usuarios/{id}` (exclusão permanente; 400 na própria conta, 409 se o usuário tiver animais; serve também para excluir o administrador antigo numa troca de gerente: como ninguém se exclui, sempre sobra um administrador) | administrador |
| | `GET /admin/usuarios/{id}/detalhes` (dados + data de cadastro + últimos 5 agendamentos + quantidade de agendamentos futuros) | administrador |
| | `PATCH /admin/usuarios/{id}/desativar`, `PATCH /admin/usuarios/{id}/ativar` | administrador |
| Relatórios | `GET /relatorios/agendamentos` (filtros `inicio` e `fim`; devolve `total`, `por_status` e `por_servico`) | funcionário ou administrador |
| | `GET /relatorios/agendamentos/itens` (filtros `inicio`, `fim`, `status` e `servico_id`; paginação `pagina`, padrão 1, e `tamanho`, padrão 10, máximo 100) | funcionário ou administrador |
| | `GET /relatorios/agendamentos/exportar` (mesmos filtros; devolve um arquivo CSV) | funcionário ou administrador |
| Geral | `GET /ola` | público |

A resposta de agendamento traz também `animal_nome`, `tutor_id`, `tutor_nome`, `servico_nome`, `servico_preco` e `servico_duracao_min`. O campo `observacao` aceita até 300 caracteres.

Erros seguem o formato `{"detail": "mensagem"}`. O login é `POST /login` com formulário (`username` = e-mail, `password`) e devolve `access_token`, enviado em `Authorization: Bearer <token>`. Datas de agendamento no formato `2026-12-10T14:00:00`, sem fuso.

## Regras de negócio

- O agendamento exige animal do próprio tutor, serviço ativo e data/hora futuras, sem fuso (`2026-12-10T14:00:00`).
- Expediente (os mesmos horários do site, definidos em `app/regras.py`): segunda a sexta 8h às 18h, sábado 8h às 14h, domingo 8h às 12h. Os horários são de 30 em 30 minutos e o serviço precisa terminar até o fechamento; fora disso a API devolve 400 com a mensagem do motivo.
- Não há horários conflitantes: o fim de cada agendamento é a duração do serviço somada ao início.
- O tutor cancela com no mínimo 2 horas de antecedência (regra confirmada com o PO); o cancelado continua no histórico.
- Status: `AGENDADO`→`CONFIRMADO` ou `CANCELADO`; `CONFIRMADO`→`CONCLUIDO` ou `CANCELADO`.
- Serviço: o nome é único (sem diferenciar maiúsculas de minúsculas e ignorando espaços nas pontas); repetir devolve 409 `Já existe um serviço com este nome`, no cadastro e na edição. A descrição é opcional.
- Só o administrador cria, edita, ativa, desativa e exclui serviços (funcionário recebe 403). Funcionário e administrador veem os inativos com `?todos=true`.
- Serviço desativado não aparece na lista pública e não pode ser agendado; o administrador pode reativá-lo.
- Exclusão permanente (`DELETE /servicos/{id}`): só se o serviço não tiver nenhum agendamento (inclusive cancelado); senão 409 `Este serviço possui agendamentos e não pode ser excluído. Desative-o em vez de excluir.`
- Relatório: a data considerada é a do atendimento (`data_hora`). `status` aceita AGENDADO, CONFIRMADO, CONCLUIDO ou CANCELADO (outro valor dá 400). Os itens trazem também espécie/raça do pet, telefone do tutor, valor, duração e observação.
- Conta desativada não faz login, e o histórico é mantido. O administrador não desativa a própria conta.
- Cadastro público (`/cadastro`) cria só tutores. Funcionários e administradores são cadastrados pelo administrador (`POST /admin/usuarios`) ou têm o perfil alterado por ele (`PATCH /admin/usuarios/{id}/perfil`); o administrador não altera o próprio perfil, então sempre sobra um administrador.
- E-mail único sem diferenciar maiúsculas de minúsculas (`Ana@x.com` = `ana@x.com`). Senhas guardadas com hash bcrypt (máx. 72 bytes). Nome com espaços nas pontas é cortado; telefone até 20 caracteres, raça até 80, e-mail até 150.
- Logout: o token usado é registrado como encerrado (tabela `tokens_revogados`) e passa a dar 401, mesmo antes de expirar (8 horas).
- Nomes de animais podem se repetir (um tutor pode ter vários pets com o mesmo nome).
- Um tutor nunca acessa animais ou agendamentos de outro tutor. Animal com agendamentos não pode ser excluído.

## Recuperação de senha

1. `POST /recuperar-senha` com o e-mail. A resposta é sempre a mesma, exista a conta ou não.
2. `POST /redefinir-senha` com o `token` e a `nova_senha` (mínimo 6 caracteres, diferente da atual). O token vale 30 minutos, só funciona uma vez e não serve como login.

**Modo demonstração (`RECUPERACAO_DEMO=1`, padrão do docker compose):** como o projeto não envia e-mail, a API devolve o `token` na própria resposta do passo 1 e o front segue direto para a tela de nova senha. Isso só serve para a apresentação: quem sabe o e-mail de alguém consegue trocar a senha dessa pessoa. Em uso real, ponha `RECUPERACAO_DEMO=0` e envie o link por e-mail.

## Testes

```
docker compose run --rm api python -m pytest -q
```

Os testes usam o PostgreSQL do Docker, mas em um banco separado (`praticao_test`), criado automaticamente. O banco real (`praticao`) nunca é tocado.

## Estrutura

```
backend/
├── app/
│   ├── main.py        # aplicação e rotas
│   ├── database.py    # conexão (somente PostgreSQL, somente Docker)
│   ├── models.py      # tabelas (usuarios, animais, servicos, agendamentos, tokens_revogados)
│   ├── regras.py      # expediente e validação de horário
│   ├── schemas.py     # validação
│   ├── auth.py        # senhas, token e permissões
│   └── routes/        # usuarios, animais, servicos, agendamentos, admin, relatorios
├── tests/
├── seed.py            # dados iniciais
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── .env.example
└── README.md
```

## Problemas comuns

| Problema | Causa provável | Solução |
|---|---|---|
| `defina SECRET_KEY no arquivo .env` | `.env` ausente ou `SECRET_KEY` vazia | criar o `.env` a partir do `.env.example` e preencher |
| `Esta API só roda dentro do Docker` | tentou rodar com `python`/`uvicorn` fora do Docker | usar `docker compose up -d --build` |
| `port is already allocated` (8000 ou 5433) | outro programa usa a porta | fechar o programa ou trocar a porta no `docker-compose.yml` |
| `password authentication failed` | senha do `.env` mudou depois da criação do volume | `docker compose down -v` e subir de novo (apaga os dados) |
| API reiniciando em loop | banco ainda iniciando ou erro de configuração | `docker compose logs api` |
| `docker compose` pede `SECRET_KEY` | `.env` sem a chave | preencher `SECRET_KEY` (veja "Como rodar") |
| `Cannot connect to the Docker daemon` | Docker Desktop fechado | abrir o Docker Desktop e esperar ficar "running" |
