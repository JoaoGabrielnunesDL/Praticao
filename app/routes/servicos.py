from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix='/servicos', tags=['Serviços'])


@router.get('', response_model=list[schemas.ServicoSaida])
def listar(db: Session = Depends(get_db)):
    return db.query(models.Servico).filter_by(ativo=True).all()


@router.post('', response_model=schemas.ServicoSaida, status_code=201)
def criar(dados: schemas.ServicoCriar, db: Session = Depends(get_db), _=Depends(auth.exigir_funcionario)):
    servico = models.Servico(**dados.model_dump())
    db.add(servico)
    db.commit()
    db.refresh(servico)
    return servico


@router.put('/{servico_id}', response_model=schemas.ServicoSaida)
def atualizar(servico_id: int, dados: schemas.ServicoCriar, db: Session = Depends(get_db), _=Depends(auth.exigir_funcionario)):
    servico = db.get(models.Servico, servico_id)
    if not servico:
        raise HTTPException(status_code=404, detail='Serviço não encontrado')
    for campo, valor in dados.model_dump().items():
        setattr(servico, campo, valor)
    db.commit()
    db.refresh(servico)
    return servico


@router.patch('/{servico_id}/desativar', response_model=schemas.ServicoSaida)
def desativar(servico_id: int, db: Session = Depends(get_db), _=Depends(auth.exigir_funcionario)):
    servico = db.get(models.Servico, servico_id)
    if not servico:
        raise HTTPException(status_code=404, detail='Serviço não encontrado')
    servico.ativo = False
    db.commit()
    db.refresh(servico)
    return servico