from datetime import datetime, timedelta


def criar_servico(client, funcionario, nome):
    r = client.post('/servicos', json={'nome': nome, 'descricao': 'Descrição do serviço',
                                       'preco': 30, 'duracao_min': 30}, headers=funcionario)
    return r.json()


def nomes(resposta):
    return [s['nome'] for s in resposta.json()]


def desativar(client, funcionario, servico):
    r = client.patch('/servicos/' + str(servico['id']) + '/desativar', headers=funcionario)
    assert r.status_code == 200


# ---- GET /servicos?todos=true ----

def test_publico_ve_so_ativos(client, funcionario, servico):
    tosa = criar_servico(client, funcionario, 'Tosa')
    desativar(client, funcionario, tosa)
    assert nomes(client.get('/servicos')) == ['Banho']


def test_publico_com_todos_true_continua_vendo_so_ativos(client, funcionario, servico):
    tosa = criar_servico(client, funcionario, 'Tosa')
    desativar(client, funcionario, tosa)
    r = client.get('/servicos?todos=true')
    assert r.status_code == 200
    assert nomes(r) == ['Banho']


def test_tutor_com_todos_true_continua_vendo_so_ativos(client, funcionario, servico, tutor):
    tosa = criar_servico(client, funcionario, 'Tosa')
    desativar(client, funcionario, tosa)
    r = client.get('/servicos?todos=true', headers=tutor)
    assert r.status_code == 200
    assert nomes(r) == ['Banho']


def test_token_invalido_em_rota_publica_nao_derruba_a_lista(client, funcionario, servico):
    tosa = criar_servico(client, funcionario, 'Tosa')
    desativar(client, funcionario, tosa)
    r = client.get('/servicos?todos=true', headers={'Authorization': 'Bearer token-invalido'})
    assert r.status_code == 200
    assert nomes(r) == ['Banho']


def test_funcionario_com_todos_true_ve_ativos_e_inativos(client, funcionario, servico):
    tosa = criar_servico(client, funcionario, 'Tosa')
    desativar(client, funcionario, tosa)
    r = client.get('/servicos?todos=true', headers=funcionario)
    assert r.status_code == 200
    assert nomes(r) == ['Banho', 'Tosa']
    assert [s['ativo'] for s in r.json()] == [True, False]


def test_administrador_com_todos_true_ve_ativos_e_inativos(client, funcionario, servico, admin):
    tosa = criar_servico(client, funcionario, 'Tosa')
    desativar(client, funcionario, tosa)
    assert nomes(client.get('/servicos?todos=true', headers=admin)) == ['Banho', 'Tosa']


def test_funcionario_sem_todos_ve_so_ativos(client, funcionario, servico):
    tosa = criar_servico(client, funcionario, 'Tosa')
    desativar(client, funcionario, tosa)
    assert nomes(client.get('/servicos', headers=funcionario)) == ['Banho']


# ---- PATCH /servicos/{id}/ativar ----

def test_funcionario_reativa_servico(client, funcionario, servico):
    desativar(client, funcionario, servico)
    assert client.get('/servicos').json() == []
    r = client.patch('/servicos/' + str(servico['id']) + '/ativar', headers=funcionario)
    assert r.status_code == 200
    assert r.json()['ativo'] is True
    assert nomes(client.get('/servicos')) == ['Banho']


def test_administrador_reativa_servico(client, funcionario, servico, admin):
    desativar(client, funcionario, servico)
    r = client.patch('/servicos/' + str(servico['id']) + '/ativar', headers=admin)
    assert r.status_code == 200
    assert r.json()['ativo'] is True


def test_ativar_servico_ja_ativo_e_inofensivo(client, funcionario, servico):
    r = client.patch('/servicos/' + str(servico['id']) + '/ativar', headers=funcionario)
    assert r.status_code == 200
    assert r.json()['ativo'] is True


def test_ativar_servico_inexistente_da_404(client, funcionario):
    r = client.patch('/servicos/9999/ativar', headers=funcionario)
    assert r.status_code == 404
    assert r.json() == {'detail': 'Serviço não encontrado'}


def test_tutor_nao_ativa_servico(client, funcionario, servico, tutor):
    desativar(client, funcionario, servico)
    r = client.patch('/servicos/' + str(servico['id']) + '/ativar', headers=tutor)
    assert r.status_code == 403
    assert client.get('/servicos').json() == []


def test_ativar_sem_login_da_401(client, funcionario, servico):
    r = client.patch('/servicos/' + str(servico['id']) + '/ativar')
    assert r.status_code == 401


def test_servico_reativado_pode_ser_agendado(client, funcionario, servico, tutor, animal):
    desativar(client, funcionario, servico)
    client.patch('/servicos/' + str(servico['id']) + '/ativar', headers=funcionario)
    futuro = (datetime.now() + timedelta(days=3)).replace(hour=10, minute=0, second=0, microsecond=0)
    r = client.post('/agendamentos', json={'animal_id': animal['id'], 'servico_id': servico['id'],
                                           'data_hora': futuro.isoformat()}, headers=tutor)
    assert r.status_code == 201
