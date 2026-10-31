from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Usuario(Base):
    __tablename__ = 'usuarios'
    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(150), unique=True, index=True)
    senha_hash: Mapped[str] = mapped_column(String(200))
    telefone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    perfil: Mapped[str] = mapped_column(String(20), default='tutor')  # tutor, funcionario, administrador
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)
    data_cadastro: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)


class Animal(Base):
    __tablename__ = 'animais'
    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(100))
    especie: Mapped[str] = mapped_column(String(50))
    raca: Mapped[str | None] = mapped_column(String(80), nullable=True)
    tutor_id: Mapped[int] = mapped_column(ForeignKey('usuarios.id'))
    tutor: Mapped['Usuario'] = relationship()


class Servico(Base):
    __tablename__ = 'servicos'
    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(100))
    descricao: Mapped[str] = mapped_column(String(300))
    preco: Mapped[float] = mapped_column(Float)
    duracao_min: Mapped[int] = mapped_column()
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)


class Agendamento(Base):
    __tablename__ = 'agendamentos'
    id: Mapped[int] = mapped_column(primary_key=True)
    animal_id: Mapped[int] = mapped_column(ForeignKey('animais.id'))
    servico_id: Mapped[int] = mapped_column(ForeignKey('servicos.id'))
    data_hora: Mapped[datetime] = mapped_column(DateTime)
    status: Mapped[str] = mapped_column(String(20), default='AGENDADO')  # AGENDADO, CONFIRMADO, CANCELADO, CONCLUIDO
    observacao: Mapped[str | None] = mapped_column(String(300), nullable=True)
    animal: Mapped['Animal'] = relationship()
    servico: Mapped['Servico'] = relationship()