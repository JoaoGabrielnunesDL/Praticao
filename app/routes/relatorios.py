from datetime import date, datetime, time, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, auth

router = APIRouter(prefix='/relatorios', tags=['Relatórios'])

STATUS = ['AGENDADO', 'CONFIRMADO', 'CANCELADO', 'CONCLUIDO']


@router.get('/agendamentos')
def relatorio_agendamentos(
    inicio: date | None = None,
    fim: date | None = None,
    db: Session = Depends(get_db),
    _=Depends(auth.exigir_funcionario),
):
    if inicio and fim and inicio > fim:
        raise HTTPException(status_code=400, detail='A data inicial não pode ser maior que a final')

    consulta = db.query(models.Agendamento)
    if inicio:
        consulta = consulta.filter(models.Agendamento.data_hora >= datetime.combine(inicio, time.min))
    if fim:
        consulta = consulta.filter(models.Agendamento.data_hora < datetime.combine(fim, time.min) + timedelta(days=1))
    agendamentos = consulta.all()

    por_status = {s: 0 for s in STATUS}
    for ag in agendamentos:
        por_status[ag.status] += 1

    resultado = {'total': len(agendamentos), 'por_status': por_status}
    if not agendamentos:
        resultado['mensagem'] = 'Nenhum agendamento encontrado para o período'
    return resultado