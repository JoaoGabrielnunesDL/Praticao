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


class RecuperarSenhaEntrada(BaseModel):
    email: EmailStr


class RecuperarSenhaSaida(BaseModel):
    mensagem: str
    token: str | None = None  # só vem preenchido no modo demonstração (RECUPERACAO_DEMO=1)


class RedefinirSenhaEntrada(BaseModel):
    token: str = Field(min_length=1)
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


class UsuarioItem(UsuarioSaida):
    # Usado na tela "Gerenciar usuários": a saída normal mais a data de cadastro.
    data_cadastro: datetime


class UsuariosPaginadosSaida(BaseModel):
    itens: list[UsuarioItem]
    pagina: int
    tamanho: int
    total: int
    total_paginas: int


class AgendamentoResumo(BaseModel):
    id: int
    data_hora: datetime
    status: str
    animal_nome: str
    servico_nome: str


class UsuarioDetalheSaida(UsuarioItem):
    # Painel "Ver detalhes": últimos agendamentos dos animais do usuário (só tutores têm) e
    # quantos ainda estão por vir (usado no aviso antes de desativar).
    ultimos_agendamentos: list[AgendamentoResumo]
    agendamentos_futuros: int


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
    # O validador abaixo tira os espaços das pontas: "  Banho  " vira "Banho" e "   " vira vazio (recusado pelo min_length).
    nome: str = Field(min_length=2, max_length=100)
    descricao: str = Field(default='', max_length=300)  # opcional: sem descrição vira texto vazio
    preco: float = Field(gt=0)
    duracao_min: int = Field(gt=0)

    @field_validator('nome', 'descricao', mode='before')
    @classmethod
    def tirar_espacos(cls, valor):
        return valor.strip() if isinstance(valor, str) else valor


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
    # Campos extras usados na janela de detalhes da tela de Relatórios.
    animal_especie: str
    animal_raca: str | None = None
    tutor_telefone: str | None = None
    servico_preco: float
    servico_duracao_min: int
    observacao: str | None = None


class ItensRelatorioAgendamentoSaida(BaseModel):
    itens: list[ItemRelatorioAgendamento]
    pagina: int
    tamanho: int
    total: int
    total_paginas: int
