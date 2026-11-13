from datetime import datetime, timedelta


def agendar(client, tutor, animal, servico, dias, hora=10):
    d = (datetime.now() + timedelta(days=dias)).replace(hour=hora, minute=0, second=0, microsecond=0)
    r = client.post('/agendamentos', json={'animal_id': animal['id'], 'servico_id': servico['id'],
                                           'data_hora': d.isoformat()}, headers=tutor)
    assert r.status_code == 201
    return r.json()


def dia(dias):
    return (datetime.now() + timedelta(days=dias)).date().isoformat()


def criar_servico(client, funcionario, nome):
    return client.post('/servicos', json={'nome': nome, 'descricao': 'Descrição do serviço',
                                          'preco': 30, 'duracao_min': 30}, headers=funcionario).json()


# ---- por_servico em GET /relatorios/agendamentos ----

def test_por_servico_vazio_quando_nao_ha_agendamentos(client, funcionario):
    r = client.get('/relatorios/agendamentos', headers=funcionario)
    assert r.status_code == 200
    assert r.json()['por_servico'] == []
    assert r.json()['total'] == 0


def test_por_servico_conta_por_servico(client, funcionario, tutor, animal, servico):
    tosa = criar_servico(client, funcionario, 'Tosa')
    agendar(client, tutor, animal, servico, 1)
    agendar(client, tutor, animal, servico, 2)
    agendar(client, tutor, animal, tosa, 3)
    corpo = client.get('/relatorios/agendamentos', headers=funcionario).json()
    assert corpo['total'] == 3
    assert corpo['por_servico'] == [
        {'servico_id': servico['id'], 'nome': 'Banho', 'total': 2},
        {'servico_id': tosa['id'], 'nome': 'Tosa', 'total': 1},
    ]


def test_por_servico_inclui_agendamentos_cancelados(client, funcionario, tutor, animal, servico):
    ag = agendar(client, tutor, animal, servico, 3)
    client.post('/agendamentos/' + str(ag['id']) + '/cancelar', headers=tutor)
    corpo = client.get('/relatorios/agendamentos', headers=funcionario).json()
    assert corpo['por_servico'] == [{'servico_id': servico['id'], 'nome': 'Banho', 'total': 1}]
    assert corpo['por_status']['CANCELADO'] == 1


def test_por_servico_respeita_o_periodo(client, funcionario, tutor, animal, servico):
    agendar(client, tutor, animal, servico, 1)
    agendar(client, tutor, animal, servico, 5)
    url = '/relatorios/agendamentos?inicio=' + dia(4) + '&fim=' + dia(6)
    corpo = client.get(url, headers=funcionario).json()
    assert corpo['total'] == 1
    assert corpo['por_servico'][0]['total'] == 1


def test_campos_antigos_do_relatorio_continuam(client, funcionario, tutor, animal, servico):
    agendar(client, tutor, animal, servico, 1)
    corpo = client.get('/relatorios/agendamentos', headers=funcionario).json()
    assert corpo['total'] == 1
    assert corpo['por_status'] == {'AGENDADO': 1, 'CONFIRMADO': 0, 'CANCELADO': 0, 'CONCLUIDO': 0}


# ---- GET /relatorios/agendamentos/itens ----

def test_itens_devolve_os_campos_pedidos(client, funcionario, tutor, animal, servico):
    ag = agendar(client, tutor, animal, servico, 3)
    r = client.get('/relatorios/agendamentos/itens', headers=funcionario)
    assert r.status_code == 200
    corpo = r.json()
    assert corpo['total'] == 1
    assert corpo['total_paginas'] == 1
    assert corpo['pagina'] == 1
    assert corpo['tamanho'] == 10
    item = corpo['itens'][0]
    assert item['id'] == ag['id']
    assert item['data_hora'] == ag['data_hora']
    assert item['animal_nome'] == 'Rex'
    assert item['servico_nome'] == 'Banho'
    assert item['tutor_nome'] == 'Ana'
    assert item['status'] == 'AGENDADO'


def test_itens_paginacao_padrao_de_10(client, funcionario, tutor, animal, servico):
    for d in range(1, 13):
        agendar(client, tutor, animal, servico, d)
    pagina1 = client.get('/relatorios/agendamentos/itens', headers=funcionario).json()
    assert len(pagina1['itens']) == 10
    assert pagina1['total'] == 12
    assert pagina1['total_paginas'] == 2
    pagina2 = client.get('/relatorios/agendamentos/itens?pagina=2', headers=funcionario).json()
    assert len(pagina2['itens']) == 2
    ids1 = {i['id'] for i in pagina1['itens']}
    ids2 = {i['id'] for i in pagina2['itens']}
    assert not ids1 & ids2


def test_itens_mais_recentes_primeiro(client, funcionario, tutor, animal, servico):
    for d in (2, 1, 3):
        agendar(client, tutor, animal, servico, d)
    itens = client.get('/relatorios/agendamentos/itens', headers=funcionario).json()['itens']
    datas = [i['data_hora'] for i in itens]
    assert datas == sorted(datas, reverse=True)


def test_itens_tamanho_personalizado(client, funcionario, tutor, animal, servico):
    for d in range(1, 8):
        agendar(client, tutor, animal, servico, d)
    corpo = client.get('/relatorios/agendamentos/itens?tamanho=3', headers=funcionario).json()
    assert len(corpo['itens']) == 3
    assert corpo['tamanho'] == 3
    assert corpo['total'] == 7
    assert corpo['total_paginas'] == 3


def test_itens_pagina_alem_do_fim_volta_lista_vazia(client, funcionario, tutor, animal, servico):
    agendar(client, tutor, animal, servico, 1)
    corpo = client.get('/relatorios/agendamentos/itens?pagina=5', headers=funcionario).json()
    assert corpo['itens'] == []
    assert corpo['total'] == 1
    assert corpo['total_paginas'] == 1


def test_itens_sem_agendamentos(client, funcionario):
    corpo = client.get('/relatorios/agendamentos/itens', headers=funcionario).json()
    assert corpo['itens'] == []
    assert corpo['total'] == 0
    assert corpo['total_paginas'] == 0


def test_itens_respeita_o_periodo(client, funcionario, tutor, animal, servico):
    agendar(client, tutor, animal, servico, 1)
    agendar(client, tutor, animal, servico, 5)
    url = '/relatorios/agendamentos/itens?inicio=' + dia(4) + '&fim=' + dia(6)
    corpo = client.get(url, headers=funcionario).json()
    assert corpo['total'] == 1
    assert len(corpo['itens']) == 1


def test_itens_periodo_invertido_da_400(client, funcionario):
    url = '/relatorios/agendamentos/itens?inicio=' + dia(6) + '&fim=' + dia(4)
    assert client.get(url, headers=funcionario).status_code == 400


def test_itens_parametros_invalidos_dao_422(client, funcionario):
    assert client.get('/relatorios/agendamentos/itens?pagina=0', headers=funcionario).status_code == 422
    assert client.get('/relatorios/agendamentos/itens?tamanho=0', headers=funcionario).status_code == 422
    assert client.get('/relatorios/agendamentos/itens?tamanho=101', headers=funcionario).status_code == 422


def test_administrador_acessa_os_itens(client, admin):
    assert client.get('/relatorios/agendamentos/itens', headers=admin).status_code == 200


def test_tutor_nao_acessa_os_itens(client, tutor):
    assert client.get('/relatorios/agendamentos/itens', headers=tutor).status_code == 403


def test_itens_sem_login_da_401(client):
    assert client.get('/relatorios/agendamentos/itens').status_code == 401
