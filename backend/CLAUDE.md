# PratiCão (back-end)

API FastAPI + PostgreSQL, (pasta `backend/` do monolito; o front-end estático fica em `../frontend`), que roda **apenas em Docker**. Pet shop: tutores, animais, serviços, agendamentos. Código, comentários e mensagens em português.

## Comandos

- Subir banco + API (dentro de `backend/`): `docker compose up -d --build` → http://localhost:8000/docs
- Banco do zero: `docker compose down -v` e subir de novo (apaga os dados)
- Testes: `docker compose run --rm api python -m pytest -q` (usa o banco `praticao_test` no PostgreSQL do Docker)
- Seed manual: `docker compose exec api python seed.py`
- Não há execução fora do Docker: `app/database.py` exige `PRATICAO_EM_DOCKER=1` (definida no Dockerfile) e `DATABASE_URL` PostgreSQL. Não reintroduzir SQLite.

## Estrutura

- `app/main.py` registra routers e a rota `/` (redireciona para `/docs`); a API não serve o front-end (ele roda à parte, em `../frontend`, na porta 5500)
- `app/routes/` usuarios, animais, servicos, agendamentos, admin, relatorios
- `app/models.py` 5 tabelas: usuarios (perfis tutor/funcionario/administrador), animais, servicos, agendamentos, tokens_revogados (logout)
- `app/regras.py` expediente (espelha `EXPEDIENTE` de `frontend/js/config.js`) e `validar_horario`
- `app/schemas.py` Pydantic · `app/auth.py` bcrypt + JWT + dependências de permissão
- `tests/conftest.py` cria/usa o banco `<banco>_test` e recria as tabelas a cada teste; fixtures `client`, `tutor`, helper `fazer_login`

## Regras que o código deve manter

- Erros no formato `{"detail": "..."}`; login via form `username`/`password` → `access_token` Bearer
- Tutor só acessa os próprios animais/agendamentos
- Agendamento: animal do tutor, serviço ativo, data futura, sem conflito (fim = início + duração do serviço); datas sem fuso (`2026-12-10T14:00:00`)
- Agendamento também respeita o expediente (seg–sex 8–18h, sáb 8–14h, dom 8–12h), de 30 em 30 min, terminando até o fechamento; `GET /agendamentos/horarios` lista os horários livres
- Logout revoga o token (jti em `tokens_revogados`); e-mail é único sem diferenciar maiúsculas; `POST /admin/usuarios` e `PATCH /admin/usuarios/{id}/perfil` (admin não altera o próprio perfil)
- Cancelamento pelo tutor com ≥ 2h de antecedência (confirmado com o PO); cancelado fica no histórico
- Status: AGENDADO→CONFIRMADO|CANCELADO; CONFIRMADO→CONCLUIDO|CANCELADO
- Animal com agendamentos não pode ser excluído; admin não desativa a si mesmo; conta desativada não loga
- Recuperação de senha: `/recuperar-senha` e `/redefinir-senha`; token JWT com `tipo=recuperacao`, 30 min, uso único (marca do hash da senha); nunca aceito como login; `RECUPERACAO_DEMO=1` devolve o token na resposta (sem e-mail)
- Serviços: só o administrador cria, edita, ativa, desativa e exclui (funcionário = 403); nome único (409 se repetir), descrição opcional; `GET /servicos?todos=true` só vale para funcionário/administrador; `PATCH /servicos/{id}/ativar` reativa; `DELETE /servicos/{id}` apaga de vez, mas 409 se houver agendamentos
- Gerenciar usuários (só administrador): `/admin/usuarios/busca` é paginada (5 por página) e combina busca, perfil e situação; precisa ficar ANTES de `/admin/usuarios/{id}` no `admin.py`; `DELETE /admin/usuarios/{id}` apaga de vez (400 na própria conta, 409 se tiver animais); desativar não apaga nada (animais e agendamentos ficam, agendamentos futuros não são cancelados)
- Agenda e relatórios aceitam período de no máximo 12 meses (400 acima disso); `GET /agendamentos` aceita `data` ou `inicio`/`fim`
- Relatórios: `/relatorios/agendamentos` (com `por_servico`), `/relatorios/agendamentos/itens` (paginado; filtros `status` e `servico_id`) e `/relatorios/agendamentos/exportar` (CSV)

## Convenções

- Toda mudança de API vem com teste em `tests/test_<area>.py`; rode o pytest (no Docker) antes de concluir
- Nunca commitar `.env` nem senhas reais
- Detalhes (endpoints, setup, problemas comuns): `README.md`
