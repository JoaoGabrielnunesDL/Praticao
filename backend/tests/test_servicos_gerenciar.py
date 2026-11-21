# Regras novas da tela "Gerenciar serviços" (versão 1.9): nome único e descrição opcional.

def corpo(nome='Tosa', **extra):
    dados = {'nome': nome, 'descricao': 'Tosa completa', 'preco': 70, 'duracao_min': 90}
    dados.update(extra)
    return dados


# ---- nome duplicado ----

def test_nome_duplicado_no_cadastro_da_409(client, admin, servico):
    r = client.post('/servicos', json=corpo('Banho'), headers=admin)
    assert r.status_code == 409
    assert r.json() == {'detail': 'Já existe um serviço com este nome'}


def test_nome_duplicado_ignora_maiusculas_e_espacos(client, admin, servico):
    r = client.post('/servicos', json=corpo('  BANHO  '), headers=admin)
    assert r.status_code == 409
    assert len(client.get('/servicos').json()) == 1


def test_nome_igual_a_servico_inativo_tambem_e_duplicado(client, admin, servico):
    client.patch('/servicos/' + str(servico['id']) + '/desativar', headers=admin)
    r = client.post('/servicos', json=corpo('Banho'), headers=admin)
    assert r.status_code == 409


def test_editar_para_nome_de_outro_servico_da_409(client, admin, servico):
    tosa = client.post('/servicos', json=corpo('Tosa'), headers=admin).json()
    r = client.put('/servicos/' + str(tosa['id']), json=corpo('Banho'), headers=admin)
    assert r.status_code == 409
    assert client.get('/servicos?todos=true', headers=admin).json()[1]['nome'] == 'Tosa'


def test_editar_mantendo_o_proprio_nome_funciona(client, admin, servico):
    r = client.put('/servicos/' + str(servico['id']),
                   json=corpo('Banho', preco=65), headers=admin)
    assert r.status_code == 200
    assert r.json()['preco'] == 65


# ---- descrição opcional e espaços ----

def test_cadastro_sem_descricao(client, admin):
    dados = corpo()
    del dados['descricao']
    r = client.post('/servicos', json=dados, headers=admin)
    assert r.status_code == 201
    assert r.json()['descricao'] == ''


def test_descricao_vazia_e_aceita(client, admin):
    r = client.post('/servicos', json=corpo(descricao=''), headers=admin)
    assert r.status_code == 201


def test_nome_so_com_espacos_e_recusado(client, admin):
    r = client.post('/servicos', json=corpo('     '), headers=admin)
    assert r.status_code == 422


def test_nome_e_salvo_sem_espacos_nas_pontas(client, admin):
    r = client.post('/servicos', json=corpo('  Hidratação  '), headers=admin)
    assert r.status_code == 201
    assert r.json()['nome'] == 'Hidratação'


def test_preco_negativo_e_recusado(client, admin):
    r = client.post('/servicos', json=corpo(preco=-5), headers=admin)
    assert r.status_code == 422


# ---- serviço inativo e agenda ----

def test_servico_inativo_nao_pode_ser_agendado(client, admin, servico, tutor, animal):
    from datetime import datetime, timedelta
    client.patch('/servicos/' + str(servico['id']) + '/desativar', headers=admin)
    futuro = (datetime.now() + timedelta(days=3)).replace(hour=10, minute=0, second=0, microsecond=0)
    r = client.post('/agendamentos', json={'animal_id': animal['id'], 'servico_id': servico['id'],
                                           'data_hora': futuro.isoformat()}, headers=tutor)
    assert r.status_code == 400
    assert r.json() == {'detail': 'Serviço indisponível'}


def test_desativar_servico_inexistente_da_404(client, admin):
    r = client.patch('/servicos/9999/desativar', headers=admin)
    assert r.status_code == 404
