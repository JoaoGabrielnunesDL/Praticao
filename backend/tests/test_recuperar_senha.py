from datetime import datetime, timedelta, timezone
from jose import jwt
from app import auth


def _cadastrar(client, email='ana@teste.com', senha='123456'):
    client.post('/cadastro', json={'nome': 'Ana', 'email': email, 'senha': senha})


def _token(client, email='ana@teste.com'):
    return client.post('/recuperar-senha', json={'email': email}).json()['token']


def test_fluxo_completo_e_nova_senha_funciona(client, monkeypatch):
    monkeypatch.setenv('RECUPERACAO_DEMO', '1')
    _cadastrar(client)
    token = _token(client)
    r = client.post('/redefinir-senha', json={'token': token, 'nova_senha': 'novasenha'})
    assert r.status_code == 200
    assert client.post('/login', data={'username': 'ana@teste.com', 'password': 'novasenha'}).status_code == 200
    assert client.post('/login', data={'username': 'ana@teste.com', 'password': '123456'}).status_code == 401


def test_token_so_vale_uma_vez(client, monkeypatch):
    monkeypatch.setenv('RECUPERACAO_DEMO', '1')
    _cadastrar(client)
    token = _token(client)
    assert client.post('/redefinir-senha', json={'token': token, 'nova_senha': 'novasenha'}).status_code == 200
    assert client.post('/redefinir-senha', json={'token': token, 'nova_senha': 'outrasenha'}).status_code == 400


def test_email_inexistente_nao_revela_e_nao_funciona(client, monkeypatch):
    monkeypatch.setenv('RECUPERACAO_DEMO', '1')
    r = client.post('/recuperar-senha', json={'email': 'ninguem@teste.com'})
    assert r.status_code == 200
    assert r.json()['token']
    r = client.post('/redefinir-senha', json={'token': r.json()['token'], 'nova_senha': 'novasenha'})
    assert r.status_code == 400


def test_sem_modo_demo_nao_devolve_token(client, monkeypatch):
    monkeypatch.setenv('RECUPERACAO_DEMO', '0')
    _cadastrar(client)
    r = client.post('/recuperar-senha', json={'email': 'ana@teste.com'})
    assert r.status_code == 200
    assert r.json().get('token') is None


def test_token_de_recuperacao_nao_serve_como_login(client, monkeypatch):
    monkeypatch.setenv('RECUPERACAO_DEMO', '1')
    _cadastrar(client)
    token = _token(client)
    assert client.get('/me', headers={'Authorization': 'Bearer ' + token}).status_code == 401


def test_token_de_login_nao_serve_para_redefinir(client):
    _cadastrar(client)
    r = client.post('/login', data={'username': 'ana@teste.com', 'password': '123456'})
    r = client.post('/redefinir-senha', json={'token': r.json()['access_token'], 'nova_senha': 'novasenha'})
    assert r.status_code == 400


def test_token_expirado(client, db_session):
    _cadastrar(client)
    from app import models
    usuario = db_session.query(models.Usuario).filter_by(email='ana@teste.com').first()
    expirado = jwt.encode(
        {'sub': str(usuario.id), 'tipo': 'recuperacao', 'marca': auth._marca_senha(usuario.senha_hash),
         'exp': datetime.now(timezone.utc) - timedelta(minutes=1)},
        auth.SECRET_KEY, algorithm=auth.ALGORITHM)
    assert client.post('/redefinir-senha', json={'token': expirado, 'nova_senha': 'novasenha'}).status_code == 400


def test_nova_senha_curta_ou_igual_a_atual(client, monkeypatch):
    monkeypatch.setenv('RECUPERACAO_DEMO', '1')
    _cadastrar(client)
    token = _token(client)
    assert client.post('/redefinir-senha', json={'token': token, 'nova_senha': '123'}).status_code == 422
    r = client.post('/redefinir-senha', json={'token': token, 'nova_senha': '123456'})
    assert r.status_code == 400
    assert 'diferente' in r.json()['detail']


def test_conta_desativada_nao_recupera(client, admin, monkeypatch):
    monkeypatch.setenv('RECUPERACAO_DEMO', '1')
    _cadastrar(client)
    usuarios = client.get('/admin/usuarios', headers=admin).json()
    ana = next(u for u in usuarios if u['email'] == 'ana@teste.com')
    client.patch(f"/admin/usuarios/{ana['id']}/desativar", headers=admin)
    token = _token(client)
    assert client.post('/redefinir-senha', json={'token': token, 'nova_senha': 'novasenha'}).status_code == 400


def test_email_invalido_na_recuperacao(client):
    assert client.post('/recuperar-senha', json={'email': 'sem-arroba'}).status_code == 422
