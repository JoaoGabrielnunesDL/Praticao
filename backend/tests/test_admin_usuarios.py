from datetime import datetime, timedelta
from app import models, auth


def _criar_usuarios(db_session, quantidade, perfil='tutor'):
    for i in range(quantidade):
        db_session.add(models.Usuario(nome=f'Pessoa {i:02d}', email=f'pessoa{i}@teste.com',
                                      senha_hash=auth.gerar_hash('123456'), perfil=perfil))
    db_session.commit()


def test_busca_exige_administrador(client, tutor, funcionario):
    assert client.get('/admin/usuarios/busca', headers=tutor).status_code == 403
    assert client.get('/admin/usuarios/busca', headers=funcionario).status_code == 403
    assert client.get('/admin/usuarios/busca').status_code == 401


def test_busca_pagina_de_5_em_5(client, admin, db_session):
    _criar_usuarios(db_session, 7)  # 7 + o admin = 8 usuários
    p1 = client.get('/admin/usuarios/busca', headers=admin).json()
    assert p1['total'] == 8 and p1['total_paginas'] == 2 and p1['tamanho'] == 5
    assert len(p1['itens']) == 5
    p2 = client.get('/admin/usuarios/busca?pagina=2', headers=admin).json()
    assert len(p2['itens']) == 3
    ids = {u['id'] for u in p1['itens']} | {u['id'] for u in p2['itens']}
    assert len(ids) == 8  # sem repetir ninguém entre as páginas
    assert 'data_cadastro' in p1['itens'][0] and 'senha_hash' not in p1['itens'][0]


def test_busca_por_nome_ou_email_sem_diferenciar_maiusculas(client, admin, db_session):
    _criar_usuarios(db_session, 3)
    r = client.get('/admin/usuarios/busca?busca=  PESSOA 01 ', headers=admin).json()
    assert [u['email'] for u in r['itens']] == ['pessoa1@teste.com']
    r = client.get('/admin/usuarios/busca?busca=@TESTE.com', headers=admin).json()
    assert r['total'] == 4  # as 3 pessoas + o admin
    assert client.get('/admin/usuarios/busca?busca=%25', headers=admin).json()['total'] == 0  # % é literal


def test_busca_combina_perfil_situacao_e_texto(client, admin, db_session):
    _criar_usuarios(db_session, 3)
    _criar_usuarios_func = models.Usuario(nome='Pessoa Func', email='func1@teste.com',
                                          senha_hash=auth.gerar_hash('123456'), perfil='funcionario', ativo=False)
    db_session.add(_criar_usuarios_func)
    db_session.commit()
    assert client.get('/admin/usuarios/busca?perfil=funcionario', headers=admin).json()['total'] == 1
    assert client.get('/admin/usuarios/busca?situacao=inativas', headers=admin).json()['total'] == 1
    assert client.get('/admin/usuarios/busca?situacao=ativas', headers=admin).json()['total'] == 4
    r = client.get('/admin/usuarios/busca?busca=pessoa&perfil=tutor&situacao=ativas', headers=admin).json()
    assert r['total'] == 3
    assert client.get('/admin/usuarios/busca?busca=pessoa&perfil=administrador', headers=admin).json()['total'] == 0


def test_busca_valida_parametros(client, admin):
    assert client.get('/admin/usuarios/busca?perfil=dono', headers=admin).status_code == 400
    assert client.get('/admin/usuarios/busca?situacao=talvez', headers=admin).status_code == 400
    assert client.get('/admin/usuarios/busca?pagina=0', headers=admin).status_code == 422
    assert client.get('/admin/usuarios/busca?tamanho=500', headers=admin).status_code == 422


def test_busca_sem_resultado_devolve_lista_vazia(client, admin):
    r = client.get('/admin/usuarios/busca?busca=naoexiste', headers=admin).json()
    assert r['itens'] == [] and r['total'] == 0 and r['total_paginas'] == 0


def test_detalhes_com_ultimos_agendamentos(client, admin, tutor, animal, servico):
    quando = (datetime.now() + timedelta(days=3)).replace(hour=10, minute=0, second=0, microsecond=0)
    r = client.post('/agendamentos', json={'animal_id': animal['id'], 'servico_id': servico['id'],
                                           'data_hora': quando.isoformat()}, headers=tutor)
    assert r.status_code == 201
    tutor_id = client.get('/me', headers=tutor).json()['id']
    d = client.get(f'/admin/usuarios/{tutor_id}/detalhes', headers=admin)
    assert d.status_code == 200
    d = d.json()
    assert d['email'] == 'ana@teste.com' and d['data_cadastro']
    assert d['agendamentos_futuros'] == 1
    assert len(d['ultimos_agendamentos']) == 1
    assert d['ultimos_agendamentos'][0]['animal_nome'] == 'Rex'
    assert d['ultimos_agendamentos'][0]['servico_nome'] == 'Banho'


def test_detalhes_de_quem_nao_tem_agendamentos(client, admin):
    admin_id = client.get('/me', headers=admin).json()['id']
    d = client.get(f'/admin/usuarios/{admin_id}/detalhes', headers=admin).json()
    assert d['ultimos_agendamentos'] == [] and d['agendamentos_futuros'] == 0


def test_detalhes_permissao_e_404(client, admin, tutor):
    assert client.get('/admin/usuarios/999/detalhes', headers=admin).status_code == 404
    assert client.get('/admin/usuarios/1/detalhes', headers=tutor).status_code == 403


def test_desativar_tutor_preserva_agendamentos(client, admin, tutor, animal, servico):
    quando = (datetime.now() + timedelta(days=3)).replace(hour=11, minute=0, second=0, microsecond=0)
    ag = client.post('/agendamentos', json={'animal_id': animal['id'], 'servico_id': servico['id'],
                                            'data_hora': quando.isoformat()}, headers=tutor).json()
    tutor_id = client.get('/me', headers=tutor).json()['id']
    assert client.patch(f'/admin/usuarios/{tutor_id}/desativar', headers=admin).json()['ativo'] is False
    d = client.get(f'/admin/usuarios/{tutor_id}/detalhes', headers=admin).json()
    assert d['ativo'] is False
    assert d['ultimos_agendamentos'][0]['id'] == ag['id'] and d['ultimos_agendamentos'][0]['status'] == 'AGENDADO'
    assert client.patch(f'/admin/usuarios/{tutor_id}/ativar', headers=admin).json()['ativo'] is True


# ---------- excluir permanentemente ----------
def test_excluir_usuario_sem_animais(client, admin, db_session):
    _criar_usuarios(db_session, 1)
    uid = client.get('/admin/usuarios/busca?busca=pessoa0@', headers=admin).json()['itens'][0]['id']
    assert client.delete(f'/admin/usuarios/{uid}', headers=admin).status_code == 204
    assert client.get(f'/admin/usuarios/{uid}', headers=admin).status_code == 404


def test_nao_exclui_a_propria_conta(client, admin):
    meu_id = client.get('/me', headers=admin).json()['id']
    r = client.delete(f'/admin/usuarios/{meu_id}', headers=admin)
    assert r.status_code == 400
    assert client.get(f'/admin/usuarios/{meu_id}', headers=admin).status_code == 200


def test_nao_exclui_usuario_com_animais(client, admin, tutor, animal):
    tutor_id = client.get('/me', headers=tutor).json()['id']
    r = client.delete(f'/admin/usuarios/{tutor_id}', headers=admin)
    assert r.status_code == 409
    assert client.get(f'/admin/usuarios/{tutor_id}', headers=admin).status_code == 200  # continua cadastrado


def test_excluir_usuario_inexistente_e_permissao(client, admin, tutor, funcionario):
    assert client.delete('/admin/usuarios/9999', headers=admin).status_code == 404
    assert client.delete('/admin/usuarios/1', headers=tutor).status_code == 403
    assert client.delete('/admin/usuarios/1', headers=funcionario).status_code == 403


def test_admin_exclui_o_administrador_antigo_e_sempre_sobra_um(client, admin, db_session):
    # Troca de gerente: com 2 administradores, um exclui o outro. Quem exclui nunca se exclui,
    # então sempre sobra pelo menos um administrador (e com um só, não há "outro" para excluir).
    db_session.add(models.Usuario(nome='Gerente Antigo', email='antigo@teste.com',
                                  senha_hash=auth.gerar_hash('123456'), perfil='administrador'))
    db_session.commit()
    antigo = client.get('/admin/usuarios/busca?perfil=administrador&busca=antigo', headers=admin).json()['itens'][0]
    assert client.delete(f"/admin/usuarios/{antigo['id']}", headers=admin).status_code == 204
    restantes = client.get('/admin/usuarios/busca?perfil=administrador', headers=admin).json()
    assert restantes['total'] == 1
    meu_id = client.get('/me', headers=admin).json()['id']
    assert client.delete(f'/admin/usuarios/{meu_id}', headers=admin).status_code == 400
    assert client.get('/admin/usuarios/busca?perfil=administrador', headers=admin).json()['total'] == 1