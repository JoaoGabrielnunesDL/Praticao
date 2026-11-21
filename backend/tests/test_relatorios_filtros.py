# Versão 2.0: tela de Relatórios com filtros por status e por serviço, detalhes e exportação CSV.
from datetime import datetime, timedelta


def agendar(client, tutor, animal, servico, dias, hora=10, observacao=None):
    d = (datetime.now() + timedelta(days=dias)).replace(hour=hora, minute=0, second=0, microsecond=0)
    corpo = {'animal_id': animal['id'], 'servico_id': servico['id'], 'data_hora': d.isoformat()}
    if observacao:
        corpo['observacao'] = observacao
    r = client.post('/agendamentos', json=corpo, headers=tutor)
    assert r.status_code == 201
    return r.json()


def criar_servico(client, admin, nome):
    return client.post('/servicos', json={'nome': nome, 'descricao': 'Descrição do serviço',
                                          'preco': 30, 'duracao_min': 30}, headers=admin).json()


def itens(client, headers, consulta=''):
    return client.get('/relatorios/agendamentos/itens' + consulta, headers=headers)


# ---- filtro por status ----

def test_filtra_itens_por_status(client, funcionario, tutor, animal, servico):
    a1 = agendar(client, tutor, animal, servico, 1)
    agendar(client, tutor, animal, servico, 2)
    client.post('/agendamentos/' + str(a1['id']) + '/cancelar', headers=tutor)
    corpo = itens(client, funcionario, '?status=CANCELADO').json()
    assert corpo['total'] == 1
    assert corpo['itens'][0]['id'] == a1['id']
    assert itens(client, funcionario, '?status=AGENDADO').json()['total'] == 1


def test_status_invalido_da_400(client, funcionario):
    r = itens(client, funcionario, '?status=QUALQUER')
    assert r.status_code == 400
    assert r.json() == {'detail': 'Status inválido'}


# ---- filtro por serviço ----

def test_filtra_itens_por_servico(client, funcionario, admin, tutor, animal, servico):
    tosa = criar_servico(client, admin, 'Tosa')
    agendar(client, tutor, animal, servico, 1)
    agendar(client, tutor, animal, tosa, 2)
    agendar(client, tutor, animal, tosa, 3)
    corpo = itens(client, funcionario, '?servico_id=' + str(tosa['id'])).json()
    assert corpo['total'] == 2
    assert {i['servico_nome'] for i in corpo['itens']} == {'Tosa'}


def test_filtros_combinados_status_e_servico(client, funcionario, admin, tutor, animal, servico):
    tosa = criar_servico(client, admin, 'Tosa')
    ag = agendar(client, tutor, animal, tosa, 1)
    agendar(client, tutor, animal, tosa, 2)
    agendar(client, tutor, animal, servico, 3)
    client.post('/agendamentos/' + str(ag['id']) + '/cancelar', headers=tutor)
    url = '?status=CANCELADO&servico_id=' + str(tosa['id'])
    corpo = itens(client, funcionario, url).json()
    assert corpo['total'] == 1
    assert corpo['itens'][0]['id'] == ag['id']
    # servico certo, mas nenhum cancelado
    assert itens(client, funcionario, '?status=CANCELADO&servico_id=' + str(servico['id'])).json()['total'] == 0


def test_paginacao_mantem_os_filtros(client, funcionario, tutor, animal, servico):
    for d in range(1, 6):
        agendar(client, tutor, animal, servico, d)
    corpo = itens(client, funcionario, '?status=AGENDADO&tamanho=2&pagina=3').json()
    assert corpo['total'] == 5
    assert corpo['total_paginas'] == 3
    assert len(corpo['itens']) == 1


# ---- campos usados na janela de detalhes ----

def test_itens_trazem_os_dados_dos_detalhes(client, funcionario, tutor, animal, servico):
    agendar(client, tutor, animal, servico, 1, observacao='Pelo muito embaraçado')
    item = itens(client, funcionario).json()['itens'][0]
    assert item['animal_especie'] == 'Cão'
    assert item['servico_preco'] == 50
    assert item['servico_duracao_min'] == 60
    assert item['observacao'] == 'Pelo muito embaraçado'
    assert 'tutor_telefone' in item and 'animal_raca' in item


# ---- exportação CSV ----

def test_exportar_csv_do_periodo(client, funcionario, tutor, animal, servico):
    agendar(client, tutor, animal, servico, 1)
    r = client.get('/relatorios/agendamentos/exportar', headers=funcionario)
    assert r.status_code == 200
    assert r.headers['content-type'].startswith('text/csv')
    assert 'attachment' in r.headers['content-disposition']
    linhas = r.content.decode('utf-8-sig').strip().splitlines()
    assert linhas[0] == 'Data;Horário;Serviço;Pet;Tutor;Status;Valor (R$)'
    assert len(linhas) == 2
    assert ';Banho;Rex;Ana;AGENDADO;50,00' in linhas[1]


def test_exportar_csv_respeita_os_filtros(client, funcionario, tutor, animal, servico):
    ag = agendar(client, tutor, animal, servico, 1)
    agendar(client, tutor, animal, servico, 2)
    client.post('/agendamentos/' + str(ag['id']) + '/cancelar', headers=tutor)
    r = client.get('/relatorios/agendamentos/exportar?status=CANCELADO', headers=funcionario)
    assert len(r.content.decode('utf-8-sig').strip().splitlines()) == 2


def test_exportar_sem_registros_traz_so_o_cabecalho(client, funcionario):
    r = client.get('/relatorios/agendamentos/exportar', headers=funcionario)
    assert len(r.content.decode('utf-8-sig').strip().splitlines()) == 1


def test_exportar_periodo_invertido_da_400(client, funcionario):
    r = client.get('/relatorios/agendamentos/exportar?inicio=2026-12-10&fim=2026-12-01', headers=funcionario)
    assert r.status_code == 400


def test_tutor_nao_exporta(client, tutor):
    assert client.get('/relatorios/agendamentos/exportar', headers=tutor).status_code == 403


def test_exportar_sem_login_da_401(client):
    assert client.get('/relatorios/agendamentos/exportar').status_code == 401
