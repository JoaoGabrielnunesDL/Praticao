from app.database import SessionLocal, Base, engine
from app import models, auth

Base.metadata.create_all(bind=engine)
db = SessionLocal()

if not db.query(models.Usuario).filter_by(email='funcionario@praticao.com').first():
    db.add(models.Usuario(nome='Funcionário', email='funcionario@praticao.com',
                          senha_hash=auth.gerar_hash('123456'), perfil='funcionario'))
    db.add(models.Usuario(nome='Administrador', email='admin@praticao.com',
                          senha_hash=auth.gerar_hash('123456'), perfil='administrador'))
    db.add_all([
        models.Servico(nome='Banho', descricao='Banho completo com secagem', preco=50, duracao_min=60),
        models.Servico(nome='Tosa', descricao='Tosa higiênica ou completa', preco=70, duracao_min=90),
    ])
    db.commit()
    print('Dados iniciais criados')
else:
    print('Dados iniciais já existem')
