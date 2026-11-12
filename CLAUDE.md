# PratiCão

Monólito FastAPI + PostgreSQL: API REST e telas estáticas (`static/`) no mesmo app. Pet shop: tutores, animais, serviços, agendamentos. Código, comentários e UI em português.

## Comandos

- Testes: `python -m pytest -q` (SQLite em memória, não toca o Postgres)
- Docker (banco + API): `docker compose up -d --build` → http://localhost:8000, Swagger em `/docs`
- Local: `python -m uvicorn app.main:app --reload` (lê `DATABASE_URL` do `.env`; banco do compose fica em `localhost:5433`; sem variável cai em SQLite `praticao.db`)
- Dados iniciais: `python seed.py`

## Estrutura

- `app/main.py` registra routers; `StaticFiles` montado em `/` **por último** (rotas novas antes dele)
- `app/routes/` usuarios, animais, servicos, agendamentos, admin, relatorios
- `app/models.py` 4 tabelas: usuarios (perfis tutor/funcionario/admin), animais, servicos, agendamentos
- `app/schemas.py` Pydantic · `app/auth.py` bcrypt + JWT + dependências de permissão
- `static/*.html` + `static/js/<pagina>.js` + `static/css/<pagina>.css`; compartilhados: `js/api.js` (fetch + token), `js/ui.js`, `js/validacao.js`, `css/base.css`, `css/ui.css`, `css/componentes.css`
- `tests/conftest.py` fixtures `client`, `tutor`, helper `fazer_login`

## Regras que o código deve manter

- Erros no formato `{"detail": "..."}`; login via form `username`/`password` → `access_token` Bearer
- Tutor só acessa os próprios animais/agendamentos
- Agendamento: animal do tutor, serviço ativo, data futura, sem conflito (fim = início + duração do serviço); datas sem fuso (`2026-12-10T14:00:00`)
- Cancelamento pelo tutor com ≥ 2h de antecedência; cancelado fica no histórico
- Status: AGENDADO→CONFIRMADO|CANCELADO; CONFIRMADO→CONCLUIDO|CANCELADO
- Animal com agendamentos não pode ser excluído; admin não desativa a si mesmo; conta desativada não loga

## Convenções

- Toda mudança de API vem com teste em `tests/test_<area>.py`; rode o pytest antes de concluir
- Front-end em JS puro, sem build/framework; prefira `api.js` para chamadas autenticadas à API
- Nunca commitar `.env` nem senhas reais
- Detalhes (endpoints, setup, troubleshooting): `README.md` — leia só a seção necessária
