# PratiCão 🐾

Sistema de gestão de animais e agendamento de serviços de banho e tosa (monolito, versão final da API).
Tutores cadastram animais e agendam serviços; funcionários acompanham a agenda e os relatórios; administradores também gerenciam serviços e usuários.

## Tecnologias

| Camada | Tecnologias |
|---|---|
| Front-end | HTML, CSS e JavaScript puro (sem framework), fonte Figtree |
| API (back-end) | Python 3.14, FastAPI, Uvicorn, Pydantic, SQLAlchemy, psycopg2 |
| Banco de dados | PostgreSQL 16 |
| Segurança | login com JWT (python-jose), senhas com hash bcrypt, perfis tutor / funcionário / administrador |
| Testes | pytest + httpx (rodam dentro do Docker, em banco separado) |
| Infraestrutura | Docker e Docker Compose (banco + API), Live Server ou `python -m http.server` para o front |

## Estrutura do repositório

```
praticao/
├── backend/                  # API + banco (roda SOMENTE no Docker)
│   ├── app/                  #   código da API (main, models, schemas, auth, routes/)
│   ├── tests/                #   testes pytest
│   ├── seed.py               #   dados iniciais (usuários e serviços)
│   ├── Dockerfile
│   ├── docker-compose.yml    #   PostgreSQL + API  ← é aqui que se roda o docker
│   ├── requirements.txt
│   ├── .env / .env.example   #   variáveis (SECRET_KEY, banco)
│   └── README.md             #   endpoints, regras de negócio, problemas comuns
├── frontend/                 # Telas estáticas  ← é aqui que está o index.html
│   ├── index.html            #   página inicial (+ demais .html na mesma pasta)
│   ├── css/  js/  img/
│   └── js/config.js          #   endereço da API, contatos e expediente
├── docs/
│   └── frontend.md           # documentação detalhada de cada tela
├── .vscode/settings.json     # Live Server já apontando para frontend/ (porta 5500)
├── .editorconfig
├── .gitignore
└── README.md
```

Os arquivos dentro de `backend/` e `frontend/` são exatamente os mesmos das versões separadas: nenhuma rota da API, nenhum link entre telas e nenhum comando de execução mudou. Só a pasta onde cada comando é executado.

## Rodar do zero (primeira vez, em qualquer PC)

**Pré-requisitos:** Git, Docker Desktop (aberto, status "running") e VS Code com a extensão Live Server. Não precisa instalar Python nem PostgreSQL.

```powershell
# 1. Baixar o projeto
git clone https://github.com/JoaoGabrielnunesDL/Praticao.git
cd Praticao\backend

# 2. Criar o .env (ele não vai para o Git; cada pessoa cria o seu)
copy .env.example .env        # Linux/Mac: cp .env.example .env

# 3. Gerar a SECRET_KEY e colar no .env, na linha SECRET_KEY=
python -c "import secrets; print(secrets.token_urlsafe(48))"

# 4. Subir banco + API
docker compose up -d --build
```

Confira com `docker compose logs -f api` (deve mostrar `Application startup complete`) e abra http://localhost:8000/docs.
Depois, no VS Code, abra a pasta `Praticao` (a raiz) e clique em **Go Live**: o site abre em http://localhost:5500.

> Se aparecer `container name "/praticao-db" is already in use`, há um container de uma versão antiga: `docker rm -f praticao-db praticao-api` e suba de novo.

## Como rodar (detalhado)

Você precisa só do **Docker Desktop** (ou Docker Engine + Compose). Não precisa instalar Python nem PostgreSQL.

### 1. Back-end (banco + API) — pasta `backend/`

```bash
cd backend
docker compose up -d --build
```

- API: http://localhost:8000 (a raiz redireciona para o Swagger em http://localhost:8000/docs)
- Logs: `docker compose logs -f api`
- Se o `.env` não existir: `cp .env.example .env` e preencha `SECRET_KEY` (veja o comentário dentro do arquivo).

### 2. Front-end — pasta `frontend/`

O front precisa ser servido na **porta 5500** (é a única origem liberada no CORS da API).

**Opção A – VS Code (Live Server):** abra a pasta raiz `praticao/` no VS Code e clique em **Go Live**. O `.vscode/settings.json` já serve `frontend/` em http://localhost:5500. (Ou clique com o direito em `frontend/index.html` › *Open with Live Server*.)

**Opção B – sem VS Code:**

```bash
cd frontend
python -m http.server 5500
```

Acesse **http://localhost:5500** (abre o `index.html`).

## Resumo: onde está cada coisa

| O que | Onde | Comando / endereço |
|---|---|---|
| Docker (banco + API) | `backend/docker-compose.yml` | `cd backend && docker compose up -d --build` |
| `index.html` (início do site) | `frontend/index.html` | http://localhost:5500 |
| Swagger da API | — | http://localhost:8000/docs |
| Testes | `backend/` | `docker compose run --rm api python -m pytest -q` |
| Banco do zero (apaga dados) | `backend/` | `docker compose down -v && docker compose up -d --build` |
| Endereço da API usado pelo front | `frontend/js/config.js` | `API_URL = 'http://localhost:8000'` |

## Como iniciar a API (resumo)

```powershell
cd backend
copy .env.example .env        # só se o .env não existir; depois preencha SECRET_KEY
docker compose up -d --build  # sobe PostgreSQL + API (cria tabelas e dados iniciais sozinho)
```

Pronto: Swagger em http://localhost:8000/docs. Para abrir o site: Live Server na raiz (Go Live) ou `cd frontend && python -m http.server 5500`, e acesse http://localhost:5500.
Para parar: `docker compose down` (mantém os dados) · para zerar o banco: `docker compose down -v`.

## Contas de teste (criadas pelo `seed.py`, senha `123456`)

| Perfil | E-mail | Entra em |
|---|---|---|
| Administrador | admin@praticao.com | `painel-admin.html` |
| Funcionário | funcionario@praticao.com | `painel-funcionario.html` |
| Tutor | tutor@teste.com | `painel.html` |

## Documentação

- API, regras de negócio e problemas comuns: [`backend/README.md`](backend/README.md)
- Telas do front-end: [`docs/frontend.md`](docs/frontend.md)
- Critérios de aceitação x o que a API faz (e qual teste cobre): [`docs/criterios-de-aceitacao.md`](docs/criterios-de-aceitacao.md)
- Convenções do back-end: [`backend/CLAUDE.md`](backend/CLAUDE.md)

> O `.env` incluído é só de desenvolvimento. Em uso real, troque senhas e `SECRET_KEY`, defina `RECUPERACAO_DEMO=0` e **não** versione o `.env`.
