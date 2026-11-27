from datetime import datetime, timedelta
from fastapi import HTTPException

# Expediente do PratiCão: os mesmos horários do site (frontend/js/config.js).
# Dia da semana: 0 = domingo ... 6 = sábado. Valores: (abre, fecha) em horas.
EXPEDIENTE = {0: (8, 12), 1: (8, 18), 2: (8, 18), 3: (8, 18), 4: (8, 18), 5: (8, 18), 6: (8, 14)}
PASSO_MIN = 30  # os horários são oferecidos de 30 em 30 minutos

DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']


def dia_da_semana(data_hora: datetime) -> int:
    return data_hora.isoweekday() % 7  # domingo = 0


def janela_do_dia(data_hora: datetime) -> tuple[datetime, datetime]:
    """Abertura e fechamento do dia da data informada."""
    abre, fecha = EXPEDIENTE[dia_da_semana(data_hora)]
    base = data_hora.replace(hour=0, minute=0, second=0, microsecond=0)
    return base + timedelta(hours=abre), base + timedelta(hours=fecha)


def validar_horario(inicio: datetime, duracao_min: int) -> None:
    """Recusa (400) horário fora do expediente, que não termine antes de fechar ou que não seja de 30 em 30 minutos."""
    if inicio.minute % PASSO_MIN or inicio.second or inicio.microsecond:
        raise HTTPException(status_code=400, detail='Escolha um horário em ponto ou meia hora (ex.: 10:00 ou 10:30)')
    abertura, fechamento = janela_do_dia(inicio)
    if inicio < abertura or inicio + timedelta(minutes=duracao_min) > fechamento:
        abre, fecha = EXPEDIENTE[dia_da_semana(inicio)]
        raise HTTPException(
            status_code=400,
            detail=f'Horário fora do expediente. Em {DIAS[dia_da_semana(inicio)]} atendemos das {abre}h às {fecha}h '
                   f'e o serviço precisa terminar até o fechamento.',
        )
