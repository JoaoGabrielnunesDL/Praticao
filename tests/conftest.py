import os

# Chave fictícia só para os testes; precisa existir antes de importar app.auth.
os.environ.setdefault('SECRET_KEY', 'chave-ficticia-somente-para-testes')

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.database import Base, get_db
from app import models, auth


@pytest.fixture()
def db_session():
    engine = create_engine('sqlite://', connect_args={'check_same_thread': False}, poolclass=StaticPool)
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    db = TestingSession()
    yield db
    db.close()


@pytest.fixture()
def client(db_session):
    def sobrescrever():
        yield db_session

    app.dependency_overrides[get_db] = sobrescrever
    yield TestClient(app)
    app.dependency_overrides.clear()


def fazer_login(client, email, senha='123456'):
    r = client.post('/login', data={'username': email, 'password': senha})
    return {'Authorization': 'Bearer ' + r.json()['access_token']}


@pytest.fixture()
def tutor(client):
    client.post('/cadastro', json={'nome': 'Ana', 'email': 'ana@teste.com', 'senha': '123456'})
    return fazer_login(client, 'ana@teste.com')


@pytest.fixture()
def outro_tutor(client):
    client.post('/cadastro', json={'nome': 'Bia', 'email': 'bia@teste.com', 'senha': '123456'})
    return fazer_login(client, 'bia@teste.com')


@pytest.fixture()
def funcionario(client, db_session):
    db_session.add(models.Usuario(nome='Func', email='func@teste.com',
                                  senha_hash=auth.gerar_hash('123456'), perfil='funcionario'))
    db_session.commit()
    return fazer_login(client, 'func@teste.com')


@pytest.fixture()
def admin(client, db_session):
    db_session.add(models.Usuario(nome='Admin', email='admin@teste.com',
                                  senha_hash=auth.gerar_hash('123456'), perfil='administrador'))
    db_session.commit()
    return fazer_login(client, 'admin@teste.com')


@pytest.fixture()
def animal(client, tutor):
    r = client.post('/animais', json={'nome': 'Rex', 'especie': 'Cão'}, headers=tutor)
    return r.json()


@pytest.fixture()
def servico(client, funcionario):
    r = client.post('/servicos', json={'nome': 'Banho', 'descricao': 'Banho completo',
                                       'preco': 50, 'duracao_min': 60}, headers=funcionario)
    return r.json()