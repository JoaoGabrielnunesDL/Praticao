def test_listar_servicos_sem_login(client, servico):
    r = client.get('/servicos')
    assert r.status_code == 200
    assert len(r.json()) == 1
    assert r.json()[0]['preco'] == 50
    assert r.json()[0]['duracao_min'] == 60


def test_lista_vazia_quando_nao_ha_servicos(client):
    r = client.get('/servicos')
    assert r.status_code == 200
    assert r.json() == []


def test_tutor_nao_cria_servico(client, tutor):
    r = client.post('/servicos', json={'nome': 'Tosa', 'descricao': 'Tosa completa',
                                       'preco': 70, 'duracao_min': 90}, headers=tutor)
    assert r.status_code == 403


def test_sem_login_nao_cria_servico(client):
    r = client.post('/servicos', json={'nome': 'Tosa', 'descricao': 'Tosa completa',
                                       'preco': 70, 'duracao_min': 90})
    assert r.status_code == 401


def test_funcionario_cria_servico(client, funcionario):
    r = client.post('/servicos', json={'nome': 'Tosa', 'descricao': 'Tosa completa',
                                       'preco': 70, 'duracao_min': 90}, headers=funcionario)
    assert r.status_code == 201
    assert r.json()['ativo'] is True


def test_servico_com_campos_vazios(client, funcionario):
    r = client.post('/servicos', json={'nome': '', 'descricao': '',
                                       'preco': 70, 'duracao_min': 90}, headers=funcionario)
    assert r.status_code == 422


def test_preco_invalido(client, funcionario):
    r = client.post('/servicos', json={'nome': 'Tosa', 'descricao': 'Tosa completa',
                                       'preco': 0, 'duracao_min': 90}, headers=funcionario)
    assert r.status_code == 422


def test_duracao_invalida(client, funcionario):
    r = client.post('/servicos', json={'nome': 'Tosa', 'descricao': 'Tosa completa',
                                       'preco': 70, 'duracao_min': 0}, headers=funcionario)
    assert r.status_code == 422


def test_funcionario_edita_servico(client, funcionario, servico):
    r = client.put('/servicos/' + str(servico['id']), json={'nome': 'Banho Premium', 'descricao': 'Banho completo',
                                                           'preco': 80, 'duracao_min': 60}, headers=funcionario)
    assert r.status_code == 200
    assert r.json()['nome'] == 'Banho Premium'
    assert client.get('/servicos').json()[0]['preco'] == 80


def test_editar_servico_inexistente(client, funcionario):
    r = client.put('/servicos/999', json={'nome': 'Tosa', 'descricao': 'Tosa completa',
                                          'preco': 10, 'duracao_min': 10}, headers=funcionario)
    assert r.status_code == 404


def test_tutor_nao_edita_servico(client, tutor, servico):
    r = client.put('/servicos/' + str(servico['id']), json={'nome': 'Tosa', 'descricao': 'Tosa completa',
                                                           'preco': 10, 'duracao_min': 10}, headers=tutor)
    assert r.status_code == 403


def test_desativar_servico_some_da_lista(client, funcionario, servico):
    r = client.patch('/servicos/' + str(servico['id']) + '/desativar', headers=funcionario)
    assert r.status_code == 200
    assert r.json()['ativo'] is False
    assert client.get('/servicos').json() == []


def test_tutor_nao_desativa_servico(client, tutor, servico):
    r = client.patch('/servicos/' + str(servico['id']) + '/desativar', headers=tutor)
    assert r.status_code == 403