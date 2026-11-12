from app.database import SessionLocal, Base, engine
from app import models, auth

Base.metadata.create_all(bind=engine)
db = SessionLocal()

USUARIOS = [
    ('Funcionário', 'funcionario@praticao.com', 'funcionario'),
    ('Administrador', 'admin@praticao.com', 'administrador'),
    ('Tutor Teste', 'tutor@teste.com', 'tutor'),
]

SERVICOS = [
    ('Banho', 'Banho completo com secagem', 50, 60),
    ('Tosa', 'Tosa higiênica ou completa', 70, 90),
    ('Hidratação', 'Hidratação dos pelos com produtos específicos', 60, 60),
    ('Corte de Unhas', 'Corte e lixamento das unhas', 30, 30),
]

criados = 0

for nome, email, perfil in USUARIOS:
    if not db.query(models.Usuario).filter_by(email=email).first():
        db.add(models.Usuario(nome=nome, email=email,
                              senha_hash=auth.gerar_hash('123456'), perfil=perfil))
        criados += 1

for nome, descricao, preco, duracao in SERVICOS:
    if not db.query(models.Servico).filter_by(nome=nome).first():
        db.add(models.Servico(nome=nome, descricao=descricao, preco=preco, duracao_min=duracao))
        criados += 1

db.commit()
print('Dados iniciais criados' if criados else 'Dados iniciais já existem')