def test_criar_e_listar_animal(client, tutor):
    r = client.post('/animais', json={'nome': 'Rex', 'especie': 'Cão'}, headers=tutor)
    assert r.status_code == 201
    r = client.get('/animais', headers=tutor)
    assert r.status_code == 200
    assert len(r.json()) == 1


def test_nomes_iguais_sao_permitidos(client, tutor):
    for _ in range(2):
        r = client.post('/animais', json={'nome': 'Rex', 'especie': 'Cão'}, headers=tutor)
        assert r.status_code == 201
    assert len(client.get('/animais', headers=tutor).json()) == 2


def test_animal_sem_nome_e_rejeitado(client, tutor):
    r = client.post('/animais', json={'nome': '', 'especie': 'Cão'}, headers=tutor)
    assert r.status_code == 422


def test_sem_login_nao_acessa(client):
    assert client.get('/animais').status_code == 401


def test_detalhar_animal(client, tutor, animal):
    r = client.get('/animais/' + str(animal['id']), headers=tutor)
    assert r.status_code == 200
    assert r.json()['nome'] == 'Rex'


def test_editar_animal(client, tutor, animal):
    r = client.put('/animais/' + str(animal['id']), json={'nome': 'Rex II', 'especie': 'Cão'}, headers=tutor)
    assert r.status_code == 200
    assert r.json()['nome'] == 'Rex II'


def test_edicao_fica_salva(client, tutor, animal):
    client.put('/animais/' + str(animal['id']), json={'nome': 'Rex II', 'especie': 'Cão'}, headers=tutor)
    r = client.get('/animais/' + str(animal['id']), headers=tutor)
    assert r.json()['nome'] == 'Rex II'


def test_tutor_nao_ve_animal_de_outro(client, animal, outro_tutor):
    r = client.get('/animais/' + str(animal['id']), headers=outro_tutor)
    assert r.status_code == 404


def test_tutor_nao_edita_animal_de_outro(client, animal, outro_tutor):
    r = client.put('/animais/' + str(animal['id']), json={'nome': 'X', 'especie': 'Cão'}, headers=outro_tutor)
    assert r.status_code == 404


def test_tutor_nao_exclui_animal_de_outro(client, animal, outro_tutor):
    r = client.delete('/animais/' + str(animal['id']), headers=outro_tutor)
    assert r.status_code == 404


def test_lista_de_um_tutor_nao_mostra_animais_de_outro(client, animal, outro_tutor):
    assert client.get('/animais', headers=outro_tutor).json() == []


def test_excluir_animal(client, tutor, animal):
    r = client.delete('/animais/' + str(animal['id']), headers=tutor)
    assert r.status_code == 204
    assert client.get('/animais', headers=tutor).json() == []