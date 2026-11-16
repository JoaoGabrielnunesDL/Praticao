# Versão 2.0: gerenciar serviços passa a ser só do administrador, e ele pode excluir um serviço de vez.
from datetime import datetime, timedelta

CORPO = {'nome': 'Tosa', 'descricao': 'Tosa completa', 'preco': 70, 'duracao_min': 90}


def agendar(client, tutor, animal, servico):
    d = (datetime.now() + timedelta(days=3)).replace(hour=10, minute=0, second=0, microsecond=0)
    r = client.post('/agendamentos', json={'animal_id': animal['id'], 'servico_id': servico['id'],
                                           'data_hora': d.isoformat()}, headers=tutor)
    assert r.status_code == 201
    return r.json()


# ---- DELETE /servicos/{id} ----

def test_admin_exclui_servico_sem_agendamentos(client, admin, servico):
    r = client.delete('/servicos/' + str(servico['id']), headers=admin)
    assert r.status_code == 204
    # some de vez: nem a lista completa (com inativos) mostra mais
    assert client.get('/servicos?todos=true', headers=admin).json() == []


def test_excluir_servico_inativo_funciona(client, admin, servico):
    client.patch('/servicos/' + str(servico['id']) + '/desativar', headers=admin)
    assert client.delete('/servicos/' + str(servico['id']), headers=admin).status_code == 204
    assert client.get('/servicos?todos=true', headers=admin).json() == []


def test_servico_com_agendamento_nao_pode_ser_excluido(client, admin, servico, tutor, animal):
    agendar(client, tutor, animal, servico)
    r = client.delete('/servicos/' + str(servico['id']), headers=admin)
    assert r.status_code == 409
    assert 'agendamentos' in r.json()['detail']
    # continua existindo
    assert len(client.get('/servicos?todos=true', headers=admin).json()) == 1


def test_servico_com_agendamento_cancelado_tambem_nao_e_excluido(client, admin, servico, tutor, animal):
    ag = agendar(client, tutor, animal, servico)
    client.post('/agendamentos/' + str(ag['id']) + '/cancelar', headers=tutor)
    assert client.delete('/servicos/' + str(servico['id']), headers=admin).status_code == 409


def test_excluir_servico_inexistente_da_404(client, admin):
    r = client.delete('/servicos/9999', headers=admin)
    assert r.status_code == 404
    assert r.json() == {'detail': 'Serviço não encontrado'}


def test_excluir_sem_login_da_401(client, servico):
    assert client.delete('/servicos/' + str(servico['id'])).status_code == 401


def test_tutor_nao_exclui_servico(client, tutor, servico):
    assert client.delete('/servicos/' + str(servico['id']), headers=tutor).status_code == 403


def test_funcionario_nao_exclui_servico(client, funcionario, servico):
    assert client.delete('/servicos/' + str(servico['id']), headers=funcionario).status_code == 403
    assert len(client.get('/servicos').json()) == 1


# ---- funcionário não gerencia mais os serviços ----

def test_funcionario_nao_cria_servico(client, funcionario):
    assert client.post('/servicos', json=CORPO, headers=funcionario).status_code == 403


def test_funcionario_nao_edita_servico(client, funcionario, servico):
    r = client.put('/servicos/' + str(servico['id']), json=CORPO, headers=funcionario)
    assert r.status_code == 403
    assert client.get('/servicos').json()[0]['nome'] == 'Banho'


def test_funcionario_nao_desativa_nem_reativa_servico(client, funcionario, servico):
    assert client.patch('/servicos/' + str(servico['id']) + '/desativar', headers=funcionario).status_code == 403
    assert client.patch('/servicos/' + str(servico['id']) + '/ativar', headers=funcionario).status_code == 403
    assert client.get('/servicos').json()[0]['ativo'] is True


def test_funcionario_continua_vendo_os_servicos_inativos(client, funcionario, admin, servico):
    client.patch('/servicos/' + str(servico['id']) + '/desativar', headers=admin)
    r = client.get('/servicos?todos=true', headers=funcionario)
    assert [s['ativo'] for s in r.json()] == [False]
