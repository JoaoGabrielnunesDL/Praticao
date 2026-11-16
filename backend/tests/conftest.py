import os
from urllib.parse import urlsplit, urlunsplit

# Chave fictícia só para os testes; precisa existir antes de importar app.auth.
os.environ.setdefault('SECRET_KEY', 'chave-ficticia-somente-para-testes')

import psycopg2
from psycopg2 import sql


def _usar_banco_de_teste():
    """Aponta a aplicação para um banco separado (<banco>_test) no PostgreSQL do Docker.

    Os testes apagam e recriam as tabelas a cada teste, então NUNCA podem rodar no banco real.
    O banco de teste é criado automaticamente se ainda não existir.
    """
    url = os.environ.get('DATABASE_URL')
    if not url:
        raise RuntimeError('Rode os testes dentro do Docker: docker compose run --rm api python -m pytest -q')
    partes = urlsplit(url)
    nome = partes.path.lstrip('/')
    nome_teste = nome if nome.endswith('_test') else nome + '_test'

    # Conecta no banco administrativo "postgres" só para criar o banco de teste.
    dsn_admin = urlunsplit(partes._replace(path='/postgres')).replace('postgresql+psycopg2://', 'postgresql://')
    conexao = psycopg2.connect(dsn_admin)
    conexao.autocommit = True
    with conexao.cursor() as cursor:
        cursor.execute('SELECT 1 FROM pg_database WHERE datname = %s', (nome_teste,))
        if not cursor.fetchone():
            cursor.execute(sql.SQL('CREATE DATABASE {}').format(sql.Identifier(nome_teste)))
    conexao.close()

    os.environ['DATABASE_URL'] = urlunsplit(partes._replace(path='/' + nome_teste))


_usar_banco_de_teste()  # precisa rodar antes de importar app.main / app.database

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, engine, get_db
from app import models, auth


@pytest.fixture()
def db_session():
    # Garantia extra: só mexe em banco cujo nome termina com _test.
    assert engine.url.database.endswith('_test'), 'Os testes só podem rodar no banco de teste'
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    db = TestingSession()
    yield db
    db.close()
    Base.metadata.drop_all(bind=engine)


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
def servico(client, admin):
    r = client.post('/servicos', json={'nome': 'Banho', 'descricao': 'Banho completo',
                                       'preco': 50, 'duracao_min': 60}, headers=admin)
    return r.json()
