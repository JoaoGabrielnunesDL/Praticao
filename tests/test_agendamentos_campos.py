from datetime import datetime, timedelta


def futuro(dias=3, hora=10):
    """Data futura sem fuso, no formato que a API usa (ex.: 2026-12-10T14:00:00)."""
    d = datetime.now() + timedelta(days=dias)
    return d.replace(hour=hora, minute=0, second=0, microsecond=0).isoformat()


def agendar(client, tutor, animal, servico, dias=3, hora=10, **extra):
    corpo = {'animal_id': animal['id'], 'servico_id': servico['id'], 'data_hora': futuro(dias, hora), **extra}
    return client.post('/agendamentos', json=corpo, headers=tutor)


CAMPOS_NOVOS = {'animal_nome', 'tutor_id', 'tutor_nome', 'servico_nome', 'servico_preco', 'servico_duracao_min'}
CAMPOS_ANTIGOS = {'id', 'animal_id', 'servico_id', 'data_hora', 'status', 'observacao'}


def test_criar_agendamento_devolve_campos_de_leitura(client, tutor, animal, servico):
    r = agendar(client, tutor, animal, servico)
    assert r.status_code == 201
    corpo = r.json()
    assert corpo['animal_nome'] == 'Rex'
    assert corpo['tutor_id'] == animal['tutor_id']
    assert corpo['tutor_nome'] == 'Ana'
    assert corpo['servico_nome'] == 'Banho'
    assert corpo['servico_preco'] == 50
    assert corpo['servico_duracao_min'] == 60


def test_campos_antigos_continuam_na_resposta(client, tutor, animal, servico):
    corpo = agendar(client, tutor, animal, servico).json()
    assert CAMPOS_ANTIGOS | CAMPOS_NOVOS <= set(corpo)
    assert corpo['status'] == 'AGENDADO'
    assert corpo['animal_id'] == animal['id']
    assert corpo['servico_id'] == servico['id']


def test_listagem_do_tutor_traz_campos_de_leitura(client, tutor, animal, servico):
    agendar(client, tutor, animal, servico)
    r = client.get('/agendamentos', headers=tutor)
    assert r.status_code == 200
    item = r.json()[0]
    assert CAMPOS_NOVOS <= set(item)
    assert item['animal_nome'] == 'Rex'
    assert item['servico_nome'] == 'Banho'


def test_funcionario_ve_nome_do_tutor_na_agenda(client, tutor, animal, servico, funcionario):
    agendar(client, tutor, animal, servico)
    r = client.get('/agendamentos', headers=funcionario)
    assert r.status_code == 200
    assert [i['tutor_nome'] for i in r.json()] == ['Ana']


def test_tutor_continua_sem_ver_agendamento_de_outro(client, tutor, animal, servico, outro_tutor):
    agendar(client, tutor, animal, servico)
    assert client.get('/agendamentos', headers=outro_tutor).json() == []


def test_filtro_por_data_continua_funcionando(client, tutor, animal, servico, funcionario):
    agendar(client, tutor, animal, servico, dias=3)
    dia = (datetime.now() + timedelta(days=3)).date().isoformat()
    outro_dia = (datetime.now() + timedelta(days=5)).date().isoformat()
    assert len(client.get('/agendamentos?data=' + dia, headers=funcionario).json()) == 1
    assert client.get('/agendamentos?data=' + outro_dia, headers=funcionario).json() == []


def test_cancelar_devolve_campos_de_leitura(client, tutor, animal, servico):
    ag = agendar(client, tutor, animal, servico).json()
    r = client.post('/agendamentos/' + str(ag['id']) + '/cancelar', headers=tutor)
    assert r.status_code == 200
    assert r.json()['status'] == 'CANCELADO'
    assert r.json()['tutor_nome'] == 'Ana'


def test_alterar_status_devolve_campos_de_leitura(client, tutor, animal, servico, funcionario):
    ag = agendar(client, tutor, animal, servico).json()
    r = client.patch('/agendamentos/' + str(ag['id']) + '/status', json={'status': 'CONFIRMADO'}, headers=funcionario)
    assert r.status_code == 200
    assert r.json()['status'] == 'CONFIRMADO'
    assert r.json()['servico_preco'] == 50


def test_observacao_com_300_caracteres_e_aceita(client, tutor, animal, servico):
    r = agendar(client, tutor, animal, servico, observacao='a' * 300)
    assert r.status_code == 201
    assert len(r.json()['observacao']) == 300


def test_observacao_com_301_caracteres_e_rejeitada(client, tutor, animal, servico):
    r = agendar(client, tutor, animal, servico, observacao='a' * 301)
    assert r.status_code == 422


def test_observacao_continua_opcional(client, tutor, animal, servico):
    r = agendar(client, tutor, animal, servico)
    assert r.status_code == 201
    assert r.json()['observacao'] is None
