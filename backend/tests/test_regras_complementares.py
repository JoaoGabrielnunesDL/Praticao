"""Regras complementares: expediente, horários livres, logout, e-mail, limites de campos e gestão de perfis."""
from datetime import datetime, timedelta


def proximo_dia(dia_semana, a_partir_de=3):
    """Próxima data (>= a_partir_de dias à frente) no dia da semana pedido (1 = segunda ... 7 = domingo)."""
    d = datetime.now() + timedelta(days=a_partir_de)
    while d.isoweekday() != dia_semana:
        d += timedelta(days=1)
    return d


def agendar(client, tutor, animal, servico, dia, hora, minuto=0):
    quando = dia.replace(hour=hora, minute=minuto, second=0, microsecond=0)
    return client.post('/agendamentos', headers=tutor, json={
        'animal_id': animal['id'], 'servico_id': servico['id'], 'data_hora': quando.isoformat()})


# ---------- expediente ----------

def test_domingo_so_ate_meio_dia(client, tutor, animal, servico):
    domingo = proximo_dia(7)
    assert agendar(client, tutor, animal, servico, domingo, 13).status_code == 400
    # O serviço (60 min) precisa terminar até o fechamento: 11:30 terminaria 12:30.
    assert agendar(client, tutor, animal, servico, domingo, 11, 30).status_code == 400
    assert agendar(client, tutor, animal, servico, domingo, 11).status_code == 201


def test_sabado_ate_14h(client, tutor, animal, servico):
    sabado = proximo_dia(6)
    assert agendar(client, tutor, animal, servico, sabado, 14).status_code == 400
    assert agendar(client, tutor, animal, servico, sabado, 13).status_code == 201


def test_dia_util_antes_de_abrir_e_depois_de_fechar(client, tutor, animal, servico):
    terca = proximo_dia(2)
    assert agendar(client, tutor, animal, servico, terca, 7).status_code == 400
    assert agendar(client, tutor, animal, servico, terca, 17, 30).status_code == 400
    assert agendar(client, tutor, animal, servico, terca, 17).status_code == 201


def test_horario_fora_do_passo_de_30_minutos(client, tutor, animal, servico):
    r = agendar(client, tutor, animal, servico, proximo_dia(2), 10, 15)
    assert r.status_code == 400
    assert 'meia hora' in r.json()['detail']


def test_data_com_fuso_e_recusada(client, tutor, animal, servico):
    quando = proximo_dia(2).replace(hour=10, minute=0, second=0, microsecond=0).isoformat() + 'Z'
    r = client.post('/agendamentos', headers=tutor, json={
        'animal_id': animal['id'], 'servico_id': servico['id'], 'data_hora': quando})
    assert r.status_code == 400


# ---------- horários livres ----------

def test_horarios_livres_respeitam_expediente_e_conflitos(client, tutor, animal, servico):
    terca = proximo_dia(2)
    assert agendar(client, tutor, animal, servico, terca, 10).status_code == 201
    r = client.get('/agendamentos/horarios?data=' + terca.date().isoformat() + '&servico_id=' + str(servico['id']),
                   headers=tutor)
    assert r.status_code == 200
    horarios = r.json()['horarios']
    assert horarios[0] == '08:00' and horarios[-1] == '17:00'
    assert '09:00' in horarios and '11:00' in horarios
    assert all(h not in horarios for h in ('09:30', '10:00', '10:30'))


def test_horarios_livres_sem_horario_em_data_passada(client, tutor, servico):
    r = client.get('/agendamentos/horarios?data=2020-01-06&servico_id=' + str(servico['id']), headers=tutor)
    assert r.status_code == 200
    assert r.json()['horarios'] == []
    assert 'mensagem' in r.json()


def test_horarios_livres_exigem_login_e_servico_ativo(client, tutor, servico, admin):
    url = '/agendamentos/horarios?data=2030-01-07&servico_id=' + str(servico['id'])
    assert client.get(url).status_code == 401
    client.patch('/servicos/' + str(servico['id']) + '/desativar', headers=admin)
    assert client.get(url, headers=tutor).status_code == 400


# ---------- logout ----------

def test_logout_invalida_o_token(client, tutor):
    assert client.get('/me', headers=tutor).status_code == 200
    assert client.post('/logout', headers=tutor).status_code == 200
    assert client.get('/me', headers=tutor).status_code == 401
    # Um novo login continua funcionando.
    r = client.post('/login', data={'username': 'ana@teste.com', 'password': '123456'})
    novo = {'Authorization': 'Bearer ' + r.json()['access_token']}
    assert client.get('/me', headers=novo).status_code == 200


# ---------- e-mail e limites de campos ----------

def test_email_nao_diferencia_maiusculas(client):
    assert client.post('/cadastro', json={'nome': 'Ana', 'email': 'ANA@Teste.com', 'senha': '123456'}).status_code == 201
    assert client.post('/cadastro', json={'nome': 'Ana 2', 'email': 'ana@teste.com', 'senha': '123456'}).status_code == 409
    r = client.post('/login', data={'username': 'ANA@TESTE.COM', 'password': '123456'})
    assert r.status_code == 200


def test_nome_com_espacos_nas_pontas_e_cortado(client):
    r = client.post('/cadastro', json={'nome': '  Ana  ', 'email': 'ana@teste.com', 'senha': '123456'})
    assert r.json()['nome'] == 'Ana'
    assert client.post('/cadastro', json={'nome': '   ', 'email': 'b@teste.com', 'senha': '123456'}).status_code == 422


def test_limites_de_tamanho_dos_campos(client, tutor):
    base = {'nome': 'Ana', 'email': 'novo@teste.com', 'senha': '123456'}
    assert client.post('/cadastro', json={**base, 'telefone': '1' * 21}).status_code == 422
    assert client.post('/cadastro', json={**base, 'senha': 'a' * 73}).status_code == 422
    assert client.post('/cadastro', json={**base, 'email': 'a' * 150 + '@teste.com'}).status_code == 422
    assert client.put('/me', json={'nome': 'Ana', 'telefone': '1' * 21}, headers=tutor).status_code == 422
    assert client.post('/animais', json={'nome': 'Rex', 'especie': 'Cão', 'raca': 'x' * 81}, headers=tutor).status_code == 422
    assert client.post('/animais', json={'nome': '   ', 'especie': 'Cão'}, headers=tutor).status_code == 422


def test_animais_com_mesmo_nome_sao_permitidos(client, tutor):
    for _ in range(2):
        assert client.post('/animais', json={'nome': 'Rex', 'especie': 'Cão'}, headers=tutor).status_code == 201
    assert len(client.get('/animais', headers=tutor).json()) == 2


# ---------- administrador: cadastrar funcionário e definir perfil ----------

def test_admin_cadastra_funcionario(client, admin):
    r = client.post('/admin/usuarios', headers=admin, json={
        'nome': 'Carlos', 'email': 'carlos@praticao.com', 'senha': '123456', 'perfil': 'funcionario'})
    assert r.status_code == 201
    assert r.json()['perfil'] == 'funcionario'
    assert 'senha' not in r.json() and 'senha_hash' not in r.json()
    login = client.post('/login', data={'username': 'carlos@praticao.com', 'password': '123456'})
    func = {'Authorization': 'Bearer ' + login.json()['access_token']}
    assert client.get('/relatorios/agendamentos', headers=func).status_code == 200
    assert client.get('/admin/usuarios', headers=func).status_code == 403


def test_admin_cadastra_funcionario_validacoes(client, admin, tutor):
    corpo = {'nome': 'Carlos', 'email': 'carlos@praticao.com', 'senha': '123456'}
    assert client.post('/admin/usuarios', headers=admin, json=corpo).json()['perfil'] == 'funcionario'
    assert client.post('/admin/usuarios', headers=admin, json=corpo).status_code == 409
    assert client.post('/admin/usuarios', headers=admin, json={**corpo, 'email': 'x@x.com', 'perfil': 'dono'}).status_code == 422
    assert client.post('/admin/usuarios', headers=tutor, json={**corpo, 'email': 'y@y.com'}).status_code == 403
    assert client.post('/admin/usuarios', json=corpo).status_code == 401


def test_admin_altera_perfil(client, admin, tutor):
    id_tutor = client.get('/me', headers=tutor).json()['id']
    r = client.patch('/admin/usuarios/' + str(id_tutor) + '/perfil', headers=admin, json={'perfil': 'funcionario'})
    assert r.status_code == 200
    assert r.json()['perfil'] == 'funcionario'
    assert client.get('/relatorios/agendamentos', headers=tutor).status_code == 200


def test_admin_altera_perfil_regras(client, admin, tutor):
    id_admin = client.get('/me', headers=admin).json()['id']
    id_tutor = client.get('/me', headers=tutor).json()['id']
    assert client.patch('/admin/usuarios/' + str(id_admin) + '/perfil', headers=admin, json={'perfil': 'tutor'}).status_code == 400
    assert client.patch('/admin/usuarios/9999/perfil', headers=admin, json={'perfil': 'tutor'}).status_code == 404
    assert client.patch('/admin/usuarios/' + str(id_tutor) + '/perfil', headers=admin, json={'perfil': 'dono'}).status_code == 422
    assert client.patch('/admin/usuarios/' + str(id_admin) + '/perfil', headers=tutor, json={'perfil': 'tutor'}).status_code == 403
