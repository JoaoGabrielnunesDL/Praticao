
from datetime import date, datetime, time, timedelta
from math import ceil
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, selectinload
from app.database import get_db
from app import models, schemas, auth
 
router = APIRouter(prefix='/relatorios', tags=['Relatórios'])
 
STATUS = ['AGENDADO', 'CONFIRMADO', 'CANCELADO', 'CONCLUIDO']
TAMANHO_PADRAO = 10
TAMANHO_MAXIMO = 100
 
 
def _consulta_do_periodo(db: Session, inicio: date | None, fim: date | None):
    if inicio and fim and inicio > fim:
        raise HTTPException(status_code=400, detail='A data inicial não pode ser maior que a final')
 
    consulta = db.query(models.Agendamento)
    if inicio:
        consulta = consulta.filter(models.Agendamento.data_hora >= datetime.combine(inicio, time.min))
    if fim:
        consulta = consulta.filter(models.Agendamento.data_hora < datetime.combine(fim, time.min) + timedelta(days=1))
    return consulta
 
 
@router.get('/agendamentos')
def relatorio_agendamentos(
    inicio: date | None = None,
    fim: date | None = None,
    db: Session = Depends(get_db),
    _=Depends(auth.exigir_funcionario),
):
    consulta = _consulta_do_periodo(db, inicio, fim).options(selectinload(models.Agendamento.servico))
    agendamentos = consulta.all()
 
    por_status = {s: 0 for s in STATUS}
    por_servico = {}
    for ag in agendamentos:
        por_status[ag.status] += 1
        item = por_servico.setdefault(
            ag.servico_id, {'servico_id': ag.servico_id, 'nome': ag.servico.nome, 'total': 0}
        )
        item['total'] += 1
 
    resultado = {
        'total': len(agendamentos),
        'por_status': por_status,
        # Todos os status entram na contagem; mais pedidos primeiro, desempate pelo nome.
        'por_servico': sorted(por_servico.values(), key=lambda i: (-i['total'], i['nome'])),
    }
    if not agendamentos:
        resultado['mensagem'] = 'Nenhum agendamento encontrado para o período'
    return resultado
 
 
@router.get('/agendamentos/itens', response_model=schemas.ItensRelatorioAgendamentoSaida)
def itens_do_relatorio(
    inicio: date | None = None,
    fim: date | None = None,
    pagina: int = Query(1, ge=1),
    tamanho: int = Query(TAMANHO_PADRAO, ge=1, le=TAMANHO_MAXIMO),
    db: Session = Depends(get_db),
    _=Depends(auth.exigir_funcionario),
):
    consulta = _consulta_do_periodo(db, inicio, fim)
    total = consulta.count()
    agendamentos = (
        consulta.options(
            selectinload(models.Agendamento.animal).selectinload(models.Animal.tutor),
            selectinload(models.Agendamento.servico),
        )
        .order_by(models.Agendamento.data_hora.desc(), models.Agendamento.id.desc())
        .offset((pagina - 1) * tamanho)
        .limit(tamanho)
        .all()
    )
    itens = [
        {
            'id': ag.id,
            'data_hora': ag.data_hora,
            'animal_nome': ag.animal.nome,
            'servico_nome': ag.servico.nome,
            'tutor_nome': ag.animal.tutor.nome,
            'status': ag.status,
        }
        for ag in agendamentos
    ]
    return {
        'itens': itens,
        'pagina': pagina,
        'tamanho': tamanho,
        'total': total,
        'total_paginas': ceil(total / tamanho),
    }
 
