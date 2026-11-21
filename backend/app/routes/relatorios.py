import csv
import io
from datetime import date, datetime, time, timedelta
from math import ceil
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session, selectinload
from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix='/relatorios', tags=['Relatórios'])

STATUS = ['AGENDADO', 'CONFIRMADO', 'CANCELADO', 'CONCLUIDO']
TAMANHO_PADRAO = 10
TAMANHO_MAXIMO = 100


def _consulta_do_periodo(
    db: Session,
    inicio: date | None,
    fim: date | None,
    status: str | None = None,
    servico_id: int | None = None,
):
    if inicio and fim and inicio > fim:
        raise HTTPException(status_code=400, detail='A data inicial não pode ser maior que a final')
    if inicio and fim and (fim - inicio).days > 366:
        raise HTTPException(status_code=400, detail='O período máximo é de 12 meses')
    if status and status not in STATUS:
        raise HTTPException(status_code=400, detail='Status inválido')

    consulta = db.query(models.Agendamento)
    if inicio:
        consulta = consulta.filter(models.Agendamento.data_hora >= datetime.combine(inicio, time.min))
    if fim:
        consulta = consulta.filter(models.Agendamento.data_hora < datetime.combine(fim, time.min) + timedelta(days=1))
    # Filtros opcionais usados ao clicar nos cartões e nos gráficos da tela.
    if status:
        consulta = consulta.filter(models.Agendamento.status == status)
    if servico_id:
        consulta = consulta.filter(models.Agendamento.servico_id == servico_id)
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


def _com_relacionamentos(consulta):
    return consulta.options(
        selectinload(models.Agendamento.animal).selectinload(models.Animal.tutor),
        selectinload(models.Agendamento.servico),
    ).order_by(models.Agendamento.data_hora.desc(), models.Agendamento.id.desc())


@router.get('/agendamentos/itens', response_model=schemas.ItensRelatorioAgendamentoSaida)
def itens_do_relatorio(
    inicio: date | None = None,
    fim: date | None = None,
    status: str | None = None,
    servico_id: int | None = None,
    pagina: int = Query(1, ge=1),
    tamanho: int = Query(TAMANHO_PADRAO, ge=1, le=TAMANHO_MAXIMO),
    db: Session = Depends(get_db),
    _=Depends(auth.exigir_funcionario),
):
    consulta = _consulta_do_periodo(db, inicio, fim, status, servico_id)
    total = consulta.count()
    agendamentos = (
        _com_relacionamentos(consulta)
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
            'animal_especie': ag.animal.especie,
            'animal_raca': ag.animal.raca,
            'tutor_telefone': ag.animal.tutor.telefone,
            'servico_preco': ag.servico.preco,
            'servico_duracao_min': ag.servico.duracao_min,
            'observacao': ag.observacao,
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


@router.get('/agendamentos/exportar')
def exportar_csv(
    inicio: date | None = None,
    fim: date | None = None,
    status: str | None = None,
    servico_id: int | None = None,
    db: Session = Depends(get_db),
    _=Depends(auth.exigir_funcionario),
):
    """Baixa os agendamentos do período (com os mesmos filtros da tela) em CSV, que abre direto no Excel."""
    agendamentos = _com_relacionamentos(_consulta_do_periodo(db, inicio, fim, status, servico_id)).all()
    saida = io.StringIO()
    escritor = csv.writer(saida, delimiter=';')  # ponto e vírgula: o Excel em português separa as colunas assim
    escritor.writerow(['Data', 'Horário', 'Serviço', 'Pet', 'Tutor', 'Status', 'Valor (R$)'])
    for ag in agendamentos:
        escritor.writerow([
            ag.data_hora.strftime('%d/%m/%Y'),
            ag.data_hora.strftime('%H:%M'),
            ag.servico.nome,
            ag.animal.nome,
            ag.animal.tutor.nome,
            ag.status,
            f'{ag.servico.preco:.2f}'.replace('.', ','),
        ])
    # utf-8-sig (com BOM) para o Excel mostrar os acentos corretamente.
    return Response(
        content=saida.getvalue().encode('utf-8-sig'),
        media_type='text/csv; charset=utf-8',
        headers={'Content-Disposition': 'attachment; filename="relatorio-agendamentos.csv"'},
    )
