from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UsuarioCriar(BaseModel):
    nome: str = Field(min_length=2, max_length=100)
    email: EmailStr
    senha: str = Field(min_length=6)
    telefone: str | None = None


class UsuarioAtualizar(BaseModel):
    nome: str = Field(min_length=2, max_length=100)
    telefone: str | None = None


class UsuarioSaida(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    nome: str
    email: EmailStr
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
    observacao: str | None = None


class AgendamentoSaida(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    animal_id: int
    servico_id: int
    data_hora: datetime
    status: str
    observacao: str | None = None


class StatusAtualizar(BaseModel):
    status: str
