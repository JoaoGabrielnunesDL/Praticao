from datetime import datetime, timedelta, date, time
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload
from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix='/agendamentos', tags=['Agendamentos'])

ANTECEDENCIA_CANCELAMENTO_HORAS = 2  # confirmar essa regra com o PO
TRANSICOES = {
    'AGENDADO': ['CONFIRMADO', 'CANCELADO'],
    'CONFIRMADO': ['CONCLUIDO', 'CANCELADO'],
    'CANCELADO': [],
    'CONCLUIDO': [],
}


def _buscar(db: Session, agendamento_id: int, usuario) -> models.Agendamento:
    ag = db.get(models.Agendamento, agendamento_id)
    if not ag:
        raise HTTPException(status_code=404, detail='Agendamento não encontrado')
    if usuario.perfil == 'tutor' and ag.animal.tutor_id != usuario.id:
        raise HTTPException(status_code=404, detail='Agendamento não encontrado')
    return ag


@router.post('', response_model=schemas.AgendamentoSaida, status_code=201)
def criar(dados: schemas.AgendamentoCriar, db: Session = Depends(get_db), usuario=Depends(auth.usuario_atual)):
    animal = db.get(models.Animal, dados.animal_id)
    if not animal or animal.tutor_id != usuario.id:
        raise HTTPException(status_code=404, detail='Animal não encontrado')
    servico = db.get(models.Servico, dados.servico_id)
    if not servico or not servico.ativo:
        raise HTTPException(status_code=400, detail='Serviço indisponível')
    if dados.data_hora <= datetime.now():
        raise HTTPException(status_code=400, detail='Escolha uma data e um horário futuros')

    inicio = dados.data_hora
    fim = inicio + timedelta(minutes=servico.duracao_min)
    ativos = db.query(models.Agendamento).filter(models.Agendamento.status.in_(['AGENDADO', 'CONFIRMADO'])).all()
    for outro in ativos:
        outro_fim = outro.data_hora + timedelta(minutes=outro.servico.duracao_min)
        if inicio < outro_fim and outro.data_hora < fim:
            raise HTTPException(status_code=409, detail='Horário indisponível')

    ag = models.Agendamento(**dados.model_dump())
    db.add(ag)
    db.commit()
    db.refresh(ag)
    return ag


@router.get('', response_model=list[schemas.AgendamentoSaida])
def listar(data: date | None = None, db: Session = Depends(get_db), usuario=Depends(auth.usuario_atual)):
    # Carrega animal, tutor e serviço de uma vez (a saída agora usa esses nomes).
    consulta = db.query(models.Agendamento).options(
        selectinload(models.Agendamento.animal).selectinload(models.Animal.tutor),
        selectinload(models.Agendamento.servico),
    )
    if usuario.perfil == 'tutor':
        consulta = consulta.join(models.Animal).filter(models.Animal.tutor_id == usuario.id)
    if data:
        ini = datetime.combine(data, time.min)
        consulta = consulta.filter(models.Agendamento.data_hora >= ini, models.Agendamento.data_hora < ini + timedelta(days=1))
    return consulta.order_by(models.Agendamento.data_hora).all()


@router.post('/{agendamento_id}/cancelar', response_model=schemas.AgendamentoSaida)
def cancelar(agendamento_id: int, db: Session = Depends(get_db), usuario=Depends(auth.usuario_atual)):
    ag = _buscar(db, agendamento_id, usuario)
    if 'CANCELADO' not in TRANSICOES[ag.status]:
        raise HTTPException(status_code=400, detail='Este agendamento não pode mais ser cancelado')
    limite = ag.data_hora - timedelta(hours=ANTECEDENCIA_CANCELAMENTO_HORAS)
    if usuario.perfil == 'tutor' and datetime.now() > limite:
        raise HTTPException(status_code=400, detail='Prazo para cancelamento encerrado')
    ag.status = 'CANCELADO'
    db.commit()
    db.refresh(ag)
    return ag


@router.patch('/{agendamento_id}/status', response_model=schemas.AgendamentoSaida)
def alterar_status(agendamento_id: int, dados: schemas.StatusAtualizar, db: Session = Depends(get_db), usuario=Depends(auth.exigir_funcionario)):
    ag = _buscar(db, agendamento_id, usuario)
    if dados.status not in TRANSICOES.get(ag.status, []):
        raise HTTPException(status_code=400, detail='Mudança de status não permitida')
    ag.status = dados.status
    db.commit()
    db.refresh(ag)
    return ag