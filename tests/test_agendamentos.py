from datetime import datetime, timedelta


def horario(hora=10, minuto=0, dias=3):
    d = datetime.now() + timedelta(days=dias)
    return d.replace(hour=hora, minute=minuto, second=0, microsecond=0).isoformat()


def agendar(client, headers, animal, servico, data_hora):
    return client.post('/agendamentos', headers=headers, json={
        'animal_id': animal['id'],
        'servico_id': servico['id'],
        'data_hora': data_hora,
    })


def test_criar_agendamento(client, tutor, animal, servico):
    r = agendar(client, tutor, animal, servico, horario())
    assert r.status_code == 201
    assert r.json()['status'] == 'AGENDADO'


def test_conflito_de_horario(client, tutor, animal, servico):
    assert agendar(client, tutor, animal, servico, horario(10, 0)).status_code == 201
    assert agendar(client, tutor, animal, servico, horario(10, 0)).status_code == 409
    assert agendar(client, tutor, animal, servico, horario(10, 30)).status_code == 409
    assert agendar(client, tutor, animal, servico, horario(11, 0)).status_code == 201


def test_data_passada(client, tutor, animal, servico):
    r = agendar(client, tutor, animal, servico, '2020-01-01T10:00:00')
    assert r.status_code == 400


def test_servico_desativado_nao_agenda(client, tutor, animal, servico, funcionario):
    client.patch('/servicos/' + str(servico['id']) + '/desativar', headers=funcionario)
    r = agendar(client, tutor, animal, servico, horario())
    assert r.status_code == 400


def test_tutor_nao_agenda_animal_de_outro(client, animal, servico, outro_tutor):
    r = agendar(client, outro_tutor, animal, servico, horario())
    assert r.status_code == 404


def test_sem_login_nao_agenda(client, animal, servico):
    r = client.post('/agendamentos', json={
        'animal_id': animal['id'],
        'servico_id': servico['id'],
        'data_hora': horario(),
    })
    assert r.status_code == 401


def test_cancelar_libera_horario(client, tutor, animal, servico):
    ag = agendar(client, tutor, animal, servico, horario()).json()
    r = client.post('/agendamentos/' + str(ag['id']) + '/cancelar', headers=tutor)
    assert r.status_code == 200
    assert r.json()['status'] == 'CANCELADO'
    assert agendar(client, tutor, animal, servico, horario()).status_code == 201


def test_cancelar_duas_vezes(client, tutor, animal, servico):
    ag = agendar(client, tutor, animal, servico, horario()).json()
    client.post('/agendamentos/' + str(ag['id']) + '/cancelar', headers=tutor)
    r = client.post('/agendamentos/' + str(ag['id']) + '/cancelar', headers=tutor)
    assert r.status_code == 400


def test_cancelar_fora_do_prazo(client, tutor, animal, servico):
    daqui_1h = (datetime.now() + timedelta(hours=1)).replace(microsecond=0).isoformat()
    ag = agendar(client, tutor, animal, servico, daqui_1h).json()
    r = client.post('/agendamentos/' + str(ag['id']) + '/cancelar', headers=tutor)
    assert r.status_code == 400


def test_tutor_nao_cancela_agendamento_de_outro(client, tutor, animal, servico, outro_tutor):
    ag = agendar(client, tutor, animal, servico, horario()).json()
    r = client.post('/agendamentos/' + str(ag['id']) + '/cancelar', headers=outro_tutor)
    assert r.status_code == 404


def test_cancelado_continua_no_historico(client, tutor, animal, servico):
    ag = agendar(client, tutor, animal, servico, horario()).json()
    client.post('/agendamentos/' + str(ag['id']) + '/cancelar', headers=tutor)
    lista = client.get('/agendamentos', headers=tutor).json()
    assert len(lista) == 1
    assert lista[0]['status'] == 'CANCELADO'


def test_tutor_so_ve_os_proprios_agendamentos(client, tutor, animal, servico, outro_tutor):
    agendar(client, tutor, animal, servico, horario())
    assert len(client.get('/agendamentos', headers=tutor).json()) == 1
    assert client.get('/agendamentos', headers=outro_tutor).json() == []


def test_lista_de_agendamentos_vazia(client, tutor):
    r = client.get('/agendamentos', headers=tutor)
    assert r.status_code == 200
    assert r.json() == []


def test_tutor_nao_muda_status(client, tutor, animal, servico):
    ag = agendar(client, tutor, animal, servico, horario()).json()
    r = client.patch('/agendamentos/' + str(ag['id']) + '/status',
                     json={'status': 'CONFIRMADO'}, headers=tutor)
    assert r.status_code == 403


def test_funcionario_confirma_e_bloqueia_transicao_invalida(client, tutor, animal, servico, funcionario):
    ag = agendar(client, tutor, animal, servico, horario()).json()
    url = '/agendamentos/' + str(ag['id']) + '/status'
    r = client.patch(url, json={'status': 'CONFIRMADO'}, headers=funcionario)
    assert r.status_code == 200
    assert r.json()['status'] == 'CONFIRMADO'
    r = client.patch(url, json={'status': 'AGENDADO'}, headers=funcionario)
    assert r.status_code == 400


def test_funcionario_conclui_e_tutor_nao_cancela_depois(client, tutor, animal, servico, funcionario):
    ag = agendar(client, tutor, animal, servico, horario()).json()
    url = '/agendamentos/' + str(ag['id']) + '/status'
    client.patch(url, json={'status': 'CONFIRMADO'}, headers=funcionario)
    r = client.patch(url, json={'status': 'CONCLUIDO'}, headers=funcionario)
    assert r.status_code == 200
    assert r.json()['status'] == 'CONCLUIDO'
    r = client.post('/agendamentos/' + str(ag['id']) + '/cancelar', headers=tutor)
    assert r.status_code == 400


def test_funcionario_ve_todos_e_filtra_por_data(client, tutor, animal, servico, funcionario):
    data_hora = horario()
    agendar(client, tutor, animal, servico, data_hora)
    dia = data_hora[:10]
    r = client.get('/agendamentos?data=' + dia, headers=funcionario)
    assert r.status_code == 200
    assert len(r.json()) == 1
    r = client.get('/agendamentos?data=2020-01-01', headers=funcionario)
    assert r.json() == []


def test_relatorio_vazio(client, funcionario):
    r = client.get('/relatorios/agendamentos', headers=funcionario)
    assert r.status_code == 200
    assert r.json()['total'] == 0
    assert 'mensagem' in r.json()


def test_relatorio_conta_por_status(client, tutor, animal, servico, funcionario):
    a1 = agendar(client, tutor, animal, servico, horario(10)).json()
    agendar(client, tutor, animal, servico, horario(12))
    client.post('/agendamentos/' + str(a1['id']) + '/cancelar', headers=tutor)
    r = client.get('/relatorios/agendamentos', headers=funcionario)
    assert r.status_code == 200
    assert r.json()['total'] == 2
    assert r.json()['por_status']['CANCELADO'] == 1
    assert r.json()['por_status']['AGENDADO'] == 1


def test_tutor_nao_acessa_relatorio(client, tutor):
    assert client.get('/relatorios/agendamentos', headers=tutor).status_code == 403


def test_relatorio_periodo_invalido(client, funcionario):
    r = client.get('/relatorios/agendamentos?inicio=2026-12-10&fim=2026-12-01', headers=funcionario)
    assert r.status_code == 400