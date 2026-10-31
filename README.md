# PratiCão

Sistema web de gestão de animais e agendamento de serviços de banho e tosa.

> Tutores cadastram seus animais e agendam serviços, enquanto funcionários e administradores gerenciam os atendimentos, os serviços oferecidos e os relatórios do sistema.

## Índice

- [Sobre o projeto](#sobre-o-projeto)
- [Equipe](#equipe)
- [Status do projeto](#status-do-projeto)
- [Tecnologias](#tecnologias)
- [Como instalar e rodar](#como-instalar-e-rodar)
- [Usuários de teste](#usuários-de-teste)
- [Endpoints da API](#endpoints-da-api)
- [Regras de negócio](#regras-de-negócio)
- [Testes automatizados](#testes-automatizados)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Arquitetura e modelagem](#arquitetura-e-modelagem)
- [Requisitos e funcionalidades](#requisitos-e-funcionalidades)
- [Critérios de aceitação principais](#critérios-de-aceitação-principais)

## Sobre o projeto

O PratiCão é uma aplicação web voltada para a rotina de pet shops e clínicas parceiras, com identidade visual em tons de azul e laranja. A aplicação é **monolítica**: um único projeto Python (FastAPI) que serve a API e também as telas (pasta `static`).

Ela atende dois perfis principais:

- **Tutor/Cliente:** cria conta, gerencia o perfil, cadastra seus animais, consulta os serviços e realiza ou cancela agendamentos com validação de horários.
- **Funcionário/Administrador:** gerencia o catálogo de serviços, controla o status dos agendamentos, consulta relatórios e administra contas de usuários.

## Equipe

Projeto desenvolvido com a metodologia ágil Scrum.

| Integrante | Papel |
|---|---|
| João Gabriel Nunes de Lara | Product Owner (PO) |
| Geovani Pacheco Osorio | UX / Design de interface |
| Lucas dos Santos Paris | Back-end e QA do back-end |
| Lucas Silveira | Front-end e QA do front-end |
| Derlan | Scrum Master (SM) |

## Status do projeto

| Parte | Situação |
|---|---|
| API (usuários, animais, serviços, agendamentos, administração e relatórios) | Concluída |
| Testes automatizados da API (60 testes) | Concluídos |
| Banco de dados PostgreSQL | Definido como banco do projeto |
| Telas do sistema (front-end) | Em desenvolvimento. A pasta `static` tem hoje uma página provisória |

## Tecnologias

- **Linguagem:** Python 3.12 ou superior
- **Framework:** FastAPI (API REST, validação com Pydantic e documentação automática)
- **Acesso ao banco:** SQLAlchemy com o driver psycopg2
- **Banco de dados:** PostgreSQL
- **Segurança:** senhas com hash (bcrypt) e autenticação por token JWT
- **Testes:** pytest
- **Controle de versão:** Git
- **Metodologia:** Scrum

## Como instalar e rodar

### 1. Pré-requisitos

- Python 3.12 ou superior
- Git
- PostgreSQL instalado (inclui o pgAdmin)

### 2. Clonar o repositório

```
git clone <url-do-repositorio>
cd praticao
```

### 3. Criar e ativar o ambiente virtual

No Windows:

```
python -m venv venv
venv\Scripts\activate
```

No Linux ou macOS:

```
python3 -m venv venv
source venv/bin/activate
```

Se o PowerShell bloquear a ativação, rode uma vez `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` e tente de novo.

### 4. Instalar as dependências

```
pip install -r requirements.txt
```

### 5. Criar o banco de dados PostgreSQL

1. Abra o **pgAdmin** e conecte no servidor com o usuário `postgres` e a senha definida na instalação.
2. Clique com o botão direito em **Databases**, escolha **Create > Database** e crie um banco chamado `praticao`.

As tabelas são criadas automaticamente quando a aplicação sobe.

### 6. Configurar a conexão

O projeto lê o endereço do banco da variável de ambiente `DATABASE_URL`. No PowerShell (vale para a janela de terminal aberta):

```
$env:DATABASE_URL = 'postgresql+psycopg2://postgres:SUA_SENHA@localhost:5432/praticao'
```

Troque `SUA_SENHA` pela senha do seu PostgreSQL. Se a senha tiver caracteres especiais (como `@`, `#` ou `/`), eles precisam ser codificados na URL (por exemplo, `@` vira `%40`).

No Linux ou macOS:

```
export DATABASE_URL='postgresql+psycopg2://postgres:SUA_SENHA@localhost:5432/praticao'
```

Importante: a variável precisa estar definida **na mesma janela de terminal** em que você rodar os próximos comandos. Sem ela, a aplicação usa um arquivo SQLite local (`praticao.db`), que serve só para testes rápidos e não é o banco do projeto.

### 7. Criar os dados iniciais

Cria o funcionário, o administrador e os serviços de exemplo. Rode uma vez:

```
python seed.py
```

### 8. Subir o servidor

```
python -m uvicorn app.main:app --reload
```

### 9. Acessar

- Telas do sistema: http://localhost:8000
- Documentação interativa (Swagger): http://localhost:8000/docs
- Documentação alternativa (ReDoc): http://localhost:8000/redoc

Para testar rotas protegidas no Swagger, clique em **Authorize** e entre com e-mail e senha.

## Usuários de teste

Disponíveis depois de rodar `python seed.py`:

| Perfil | E-mail | Senha |
|---|---|---|
| Funcionário | funcionario@praticao.com | 123456 |
| Administrador | admin@praticao.com | 123456 |

Os tutores são criados pelo cadastro do próprio sistema (`POST /cadastro`).

## Endpoints da API

Todos os endpoints abaixo, exceto os marcados como públicos, exigem login.

| Área | Método e rota | Quem acessa |
|---|---|---|
| Usuários | `POST /cadastro` | público |
| | `POST /login` | público |
| | `GET /me`, `PUT /me`, `POST /logout` | usuário logado |
| Animais | `GET /animais`, `POST /animais` | tutor |
| | `GET /animais/{id}`, `PUT /animais/{id}`, `DELETE /animais/{id}` | tutor (somente os próprios animais) |
| Serviços | `GET /servicos` | público |
| | `POST /servicos`, `PUT /servicos/{id}`, `PATCH /servicos/{id}/desativar` | funcionário ou administrador |
| Agendamentos | `POST /agendamentos`, `GET /agendamentos` | tutor (os próprios) ou funcionário (todos, com filtro `?data=AAAA-MM-DD`) |
| | `POST /agendamentos/{id}/cancelar` | tutor (dono) ou funcionário |
| | `PATCH /agendamentos/{id}/status` | funcionário ou administrador |
| Administração | `GET /admin/usuarios`, `GET /admin/usuarios/{id}` | administrador |
| | `PATCH /admin/usuarios/{id}/desativar`, `PATCH /admin/usuarios/{id}/ativar` | administrador |
| Relatórios | `GET /relatorios/agendamentos` (filtros `inicio` e `fim`) | funcionário ou administrador |

Os erros seguem o formato `{"detail": "mensagem"}`. Datas de agendamento são enviadas no formato `2026-12-10T14:00:00`, sem fuso horário.

## Regras de negócio

- O agendamento exige animal do próprio tutor, serviço ativo e data/hora futuras.
- Não são aceitos horários conflitantes: o fim de cada agendamento é calculado pela duração do serviço.
- O tutor cancela com no mínimo 2 horas de antecedência (prazo a confirmar com o PO). Cancelar libera o horário, e o agendamento cancelado continua no histórico.
- Status dos agendamentos: `AGENDADO`, `CONFIRMADO`, `CANCELADO` e `CONCLUIDO`. As mudanças permitidas são:
  - `AGENDADO` para `CONFIRMADO` ou `CANCELADO`
  - `CONFIRMADO` para `CONCLUIDO` ou `CANCELADO`
- Serviço desativado não aparece na lista e não pode ser agendado.
- Conta desativada não consegue fazer login, e seu histórico é mantido.
- Um tutor nunca acessa animais ou agendamentos de outro tutor.

## Testes automatizados

```
python -m pytest -v
```

São 60 testes cobrindo usuários, animais, serviços, agendamentos, administração e relatórios, incluindo permissões e privacidade entre tutores. Os testes usam um banco em memória e não alteram os dados reais.

## Estrutura do projeto

```
praticao/
├── app/
│   ├── main.py            # criação da aplicação e rotas
│   ├── database.py        # conexão com o banco
│   ├── models.py          # tabelas
│   ├── schemas.py         # validação dos dados
│   ├── auth.py            # senhas, token e permissões
│   └── routes/            # usuarios, animais, servicos, agendamentos, admin, relatorios
├── static/                # telas do sistema
├── tests/                 # testes automatizados
├── seed.py                # dados iniciais
├── requirements.txt
└── README.md
```

## Arquitetura e modelagem

- **Diagrama de casos de uso:** módulos de gestão de contas, gestão de animais, agendamento de serviços, serviços de banho e tosa e gestão administrativa.
- **Diagrama de classes (modelo de domínio):** referência de modelagem do grupo. A implementação atual simplifica o modelo em quatro entidades: `Usuario` (com os perfis tutor, funcionário e administrador), `Animal`, `Servico` e `Agendamento`.

## Requisitos e funcionalidades

### Requisitos funcionais

- **RF01:** cadastro de tutores
- **RF02 e RF03:** gestão de animais (cadastrar, editar, excluir e consultar)
- **RF04:** consulta de serviços, com descrição, duração e preço
- **RF05 e RF06:** solicitação e consulta de agendamentos
- **RF07 e RF08:** gestão de agendamentos e serviços por funcionários autorizados
- **RF09 a RF12:** validações, segurança por perfil e integração entre front-end, API e banco de dados

### Requisitos não funcionais

- **Usabilidade e responsividade:** interface adaptada para computador, tablet e celular
- **Segurança:** acesso restrito por perfil e senhas protegidas
- **Manutenibilidade:** código modularizado e testado

## Critérios de aceitação principais

- **Agendamentos:** o sistema impede conflitos de horário, valida os campos obrigatórios, permite cancelar dentro das regras e atualiza o status.
- **Autenticação:** valida o formato do e-mail, impede e-mail repetido e bloqueia contas desativadas.
- **Segurança de acesso:** usuários comuns não acessam funções administrativas nem dados de outros tutores.