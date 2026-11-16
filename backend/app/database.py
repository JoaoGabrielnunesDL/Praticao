import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# Esta API roda SOMENTE dentro do Docker. A imagem (Dockerfile) define PRATICAO_EM_DOCKER=1.
if os.getenv('PRATICAO_EM_DOCKER') != '1':
    raise RuntimeError('Esta API só roda dentro do Docker. Use: docker compose up -d --build')

# O único banco aceito é o PostgreSQL do docker-compose.yml, que já define a DATABASE_URL.
DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    raise RuntimeError('DATABASE_URL não definida. Suba a API pelo docker compose (veja o README).')
if not DATABASE_URL.startswith('postgresql'):
    raise RuntimeError('Somente PostgreSQL é aceito (a DATABASE_URL deve começar com "postgresql").')

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
