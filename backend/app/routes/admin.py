import math
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload
from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix='/admin', tags=['Administração'])

PERFIS = ('tutor', 'funcionario', 'administrador')
SITUACOES = ('ativas', 'inativas')


def _buscar(db: Session, usuario_id: int) -> models.Usuario:
    alvo = db.get(models.Usuario, usuario_id)
    if not alvo:
        raise HTTPException(status_code=404, detail='Usuário não encontrado')
    return alvo


@router.post('/usuarios', response_model=schemas.UsuarioSaida, status_code=201)
def criar_usuario(dados: schemas.UsuarioAdminCriar, db: Session = Depends(get_db), _=Depends(auth.exigir_admin)):
    """O administrador cadastra funcionários (ou outros administradores): o /cadastro público só cria tutores."""
    if auth.buscar_por_email(db, dados.email):
        raise HTTPException(status_code=409, detail='E-mail já cadastrado')
    usuario = models.Usuario(
        nome=dados.nome, email=dados.email, senha_hash=auth.gerar_hash(dados.senha),
        telefone=dados.telefone, perfil=dados.perfil,
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


@router.get('/usuarios', response_model=list[schemas.UsuarioSaida])
def listar_usuarios(db: Session = Depends(get_db), _=Depends(auth.exigir_admin)):
    return db.query(models.Usuario).order_by(models.Usuario.id).all()


# Atenção: esta rota precisa vir ANTES de /usuarios/{usuario_id}, senão "busca" seria lido como um id.
@router.get('/usuarios/busca', response_model=schemas.UsuariosPaginadosSaida)
def buscar_usuarios(
    busca: str | None = Query(default=None, max_length=100),
    perfil: str | None = None,
    situacao: str | None = None,
    pagina: int = Query(default=1, ge=1),
    tamanho: int = Query(default=5, ge=1, le=50),
    db: Session = Depends(get_db),
    _=Depends(auth.exigir_admin),
):
    """Lista paginada da tela Gerenciar usuários. Busca, perfil e situação funcionam juntos."""
    if perfil and perfil not in PERFIS:
        raise HTTPException(status_code=400, detail='Perfil inválido')
    if situacao and situacao not in SITUACOES:
        raise HTTPException(status_code=400, detail='Situação inválida')

    consulta = db.query(models.Usuario)
    termo = (busca or '').strip()
    if termo:
        # Escapa % e _ para a pessoa poder procurar esses caracteres literalmente.
        seguro = termo.replace('\\', '\\\\').replace('%', '\\%').replace('_', '\\_')
        padrao = f'%{seguro}%'
        consulta = consulta.filter(
            models.Usuario.nome.ilike(padrao, escape='\\') | models.Usuario.email.ilike(padrao, escape='\\'))
    if perfil:
        consulta = consulta.filter(models.Usuario.perfil == perfil)
    if situacao:
        consulta = consulta.filter(models.Usuario.ativo == (situacao == 'ativas'))

    total = consulta.count()
    itens = (consulta.order_by(func.lower(models.Usuario.nome), models.Usuario.id)
             .offset((pagina - 1) * tamanho).limit(tamanho).all())
    return {'itens': itens, 'pagina': pagina, 'tamanho': tamanho, 'total': total,
            'total_paginas': math.ceil(total / tamanho)}


@router.get('/usuarios/{usuario_id}', response_model=schemas.UsuarioSaida)
def consultar_usuario(usuario_id: int, db: Session = Depends(get_db), _=Depends(auth.exigir_admin)):
    return _buscar(db, usuario_id)


@router.get('/usuarios/{usuario_id}/detalhes', response_model=schemas.UsuarioDetalheSaida)
def detalhes_usuario(usuario_id: int, db: Session = Depends(get_db), _=Depends(auth.exigir_admin)):
    """Dados completos do usuário + últimos agendamentos (painel lateral da tela)."""
    alvo = _buscar(db, usuario_id)
    base = (db.query(models.Agendamento).join(models.Animal)
            .filter(models.Animal.tutor_id == alvo.id))
    ultimos = (base.options(selectinload(models.Agendamento.animal), selectinload(models.Agendamento.servico))
               .order_by(models.Agendamento.data_hora.desc()).limit(5).all())
    futuros = base.filter(models.Agendamento.status.in_(['AGENDADO', 'CONFIRMADO']),
                          models.Agendamento.data_hora > datetime.now()).count()
    return {
        'id': alvo.id, 'nome': alvo.nome, 'email': alvo.email, 'telefone': alvo.telefone,
        'perfil': alvo.perfil, 'ativo': alvo.ativo, 'data_cadastro': alvo.data_cadastro,
        'agendamentos_futuros': futuros,
        'ultimos_agendamentos': [
            {'id': a.id, 'data_hora': a.data_hora, 'status': a.status,
             'animal_nome': a.animal.nome, 'servico_nome': a.servico.nome} for a in ultimos],
    }


@router.patch('/usuarios/{usuario_id}/desativar', response_model=schemas.UsuarioSaida)
def desativar_usuario(usuario_id: int, db: Session = Depends(get_db), admin=Depends(auth.exigir_admin)):
    alvo = _buscar(db, usuario_id)
    if alvo.id == admin.id:
        raise HTTPException(status_code=400, detail='Você não pode desativar a própria conta')
    # Só desativa a conta (ativo = False): animais e agendamentos continuam no banco.
    # Como o próprio admin nunca se desativa, sempre sobra pelo menos um administrador ativo.
    alvo.ativo = False
    db.commit()
    db.refresh(alvo)
    return alvo


@router.patch('/usuarios/{usuario_id}/perfil', response_model=schemas.UsuarioSaida)
def alterar_perfil(usuario_id: int, dados: schemas.PerfilAtualizar, db: Session = Depends(get_db), admin=Depends(auth.exigir_admin)):
    """Define as permissões do usuário (tutor, funcionário ou administrador)."""
    alvo = _buscar(db, usuario_id)
    if alvo.id == admin.id:
        # Assim sempre sobra pelo menos um administrador.
        raise HTTPException(status_code=400, detail='Você não pode alterar o próprio perfil')
    alvo.perfil = dados.perfil
    db.commit()
    db.refresh(alvo)
    return alvo


@router.patch('/usuarios/{usuario_id}/ativar', response_model=schemas.UsuarioSaida)
def ativar_usuario(usuario_id: int, db: Session = Depends(get_db), _=Depends(auth.exigir_admin)):
    alvo = _buscar(db, usuario_id)
    alvo.ativo = True
    db.commit()
    db.refresh(alvo)
    return alvo


@router.delete('/usuarios/{usuario_id}', status_code=204)
def excluir_usuario(usuario_id: int, db: Session = Depends(get_db), admin=Depends(auth.exigir_admin)):
    """Exclusão permanente (some do banco). Não vale para a própria conta nem para quem tem animais."""
    alvo = _buscar(db, usuario_id)
    if alvo.id == admin.id:
        raise HTTPException(status_code=400, detail='Você não pode excluir a própria conta')
    if db.query(models.Animal).filter_by(tutor_id=alvo.id).first():
        # Animais e agendamentos dependem do tutor: nesse caso só é possível desativar.
        raise HTTPException(
            status_code=409,
            detail='Este usuário possui animais cadastrados e não pode ser excluído. Desative a conta em vez de excluir.',
        )
    db.delete(alvo)
    db.commit()
