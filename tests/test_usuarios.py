def test_cadastro_e_login(client):
    r = client.post('/cadastro', json={'nome': 'Ana', 'email': 'ana@teste.com', 'senha': '123456'})
    assert r.status_code == 201
    assert 'senha' not in r.json()
    r = client.post('/login', data={'username': 'ana@teste.com', 'password': '123456'})
    assert r.status_code == 200
    assert 'access_token' in r.json()


def test_email_duplicado(client):
    dados = {'nome': 'Ana', 'email': 'ana@teste.com', 'senha': '123456'}
    client.post('/cadastro', json=dados)
    assert client.post('/cadastro', json=dados).status_code == 409


def test_email_invalido(client):
    r = client.post('/cadastro', json={'nome': 'Ana', 'email': 'sem-arroba', 'senha': '123456'})
    assert r.status_code == 422


def test_campos_obrigatorios(client):
    assert client.post('/cadastro', json={'nome': 'Ana'}).status_code == 422


def test_login_senha_errada(client):
    client.post('/cadastro', json={'nome': 'Ana', 'email': 'ana@teste.com', 'senha': '123456'})
    r = client.post('/login', data={'username': 'ana@teste.com', 'password': 'errada'})
    assert r.status_code == 401


def test_me_sem_login(client):
    assert client.get('/me').status_code == 401


def test_atualizar_perfil(client, tutor):
    r = client.put('/me', json={'nome': 'Ana Maria', 'telefone': '34999990000'}, headers=tutor)
    assert r.status_code == 200
    assert r.json()['nome'] == 'Ana Maria'


def test_perfil_nome_curto(client, tutor):
    r = client.put('/me', json={'nome': 'A'}, headers=tutor)
    assert r.status_code == 422


def test_logout(client, tutor):
    assert client.post('/logout', headers=tutor).status_code == 200


def test_tutor_nao_acessa_admin(client, tutor):
    assert client.get('/admin/usuarios', headers=tutor).status_code == 403


def test_funcionario_nao_acessa_admin(client, funcionario):
    assert client.get('/admin/usuarios', headers=funcionario).status_code == 403


def test_admin_lista_usuarios(client, admin, tutor):
    r = client.get('/admin/usuarios', headers=admin)
    assert r.status_code == 200
    assert len(r.json()) == 2


def test_admin_desativa_usuario_e_login_e_bloqueado(client, admin):
    r = client.post('/cadastro', json={'nome': 'Caio', 'email': 'caio@teste.com', 'senha': '123456'})
    uid = r.json()['id']
    r = client.patch('/admin/usuarios/' + str(uid) + '/desativar', headers=admin)
    assert r.status_code == 200
    assert r.json()['ativo'] is False
    r = client.post('/login', data={'username': 'caio@teste.com', 'password': '123456'})
    assert r.status_code == 403


def test_admin_nao_desativa_a_si_mesmo(client, admin):
    meu_id = client.get('/me', headers=admin).json()['id']
    r = client.patch('/admin/usuarios/' + str(meu_id) + '/desativar', headers=admin)
    assert r.status_code == 400