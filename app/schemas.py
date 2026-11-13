from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator, model_validator


class UsuarioCriar(BaseModel):
    nome: str = Field(min_length=2, max_length=100)
    email: EmailStr
    senha: str = Field(min_length=6)
    telefone: str | None = None


class UsuarioAtualizar(BaseModel):
    nome: str = Field(min_length=2, max_length=100)
    telefone: str | None = None


class UsuarioAlterarSenha(BaseModel):
    senha_atual: str = Field(min_length=1)
    nova_senha: str = Field(min_length=6)

    @field_validator('nova_senha')
    @classmethod
    def validar_limite_bcrypt(cls, valor: str) -> str:
        if len(valor.encode('utf-8')) > 72:
            raise ValueError('A nova senha não pode exceder 72 bytes em UTF-8.')
        return valor


class UsuarioSaida(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    nome: str
    email: EmailStr
    telefone: str | None = None
    perfil: str
    ativo: bool


class Token(BaseModel):
    access_token: str
    token_type: str = 'bearer'


class AnimalCriar(BaseModel):
    nome: str = Field(min_length=1, max_length=100)
    especie: str = Field(min_length=1, max_length=50)
    raca: str | None = None


class AnimalSaida(AnimalCriar):
    model_config = ConfigDict(from_attributes=True)
    id: int
    tutor_id: int


class ServicoCriar(BaseModel):
    nome: str = Field(min_length=2, max_length=100)
    descricao: str = Field(min_length=2, max_length=300)
    preco: float = Field(gt=0)
    duracao_min: int = Field(gt=0)


class ServicoSaida(ServicoCriar):
    model_config = ConfigDict(from_attributes=True)
    id: int
    ativo: bool


class AgendamentoCriar(BaseModel):
    animal_id: int
    servico_id: int
    data_hora: datetime
    observacao: str | None = Field(default=None, max_length=300)


class AgendamentoSaida(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    animal_id: int
    servico_id: int
    data_hora: datetime
    status: str
    observacao: str | None = None
    # Campos de leitura, preenchidos pelos relacionamentos (animal, animal.tutor, servico).
    animal_nome: str
    tutor_id: int
    tutor_nome: str
    servico_nome: str
    servico_preco: float
    servico_duracao_min: int

    @model_validator(mode='before')
    @classmethod
    def preencher_campos_de_leitura(cls, dados):
        # Recebe o objeto do banco (Agendamento) e monta os campos extras a partir
        # dos relacionamentos. Se já vier um dict (ex.: testes), não mexe.
        if isinstance(dados, dict):
            return dados
        animal = dados.animal
        servico = dados.servico
        return {
            'id': dados.id,
            'animal_id': dados.animal_id,
            'servico_id': dados.servico_id,
            'data_hora': dados.data_hora,
            'status': dados.status,
            'observacao': dados.observacao,
            'animal_nome': animal.nome,
            'tutor_id': animal.tutor_id,
            'tutor_nome': animal.tutor.nome,
            'servico_nome': servico.nome,
            'servico_preco': servico.preco,
            'servico_duracao_min': servico.duracao_min,
        }


class StatusAtualizar(BaseModel):
    status: str


class ItemRelatorioAgendamento(BaseModel):
    id: int
    data_hora: datetime
    animal_nome: str
    servico_nome: str
    tutor_nome: str
    status: str


class ItensRelatorioAgendamentoSaida(BaseModel):
    itens: list[ItemRelatorioAgendamento]
    pagina: int
    tamanho: int
    total: int
    total_paginas: int
