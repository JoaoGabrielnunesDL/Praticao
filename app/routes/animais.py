from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix='/animais', tags=['Animais'])


def _buscar_do_tutor(db: Session, animal_id: int, usuario) -> models.Animal:
    animal = db.get(models.Animal, animal_id)
    if not animal or animal.tutor_id != usuario.id:
        raise HTTPException(status_code=404, detail='Animal não encontrado')
    return animal


@router.post('', response_model=schemas.AnimalSaida, status_code=201)
def criar(dados: schemas.AnimalCriar, db: Session = Depends(get_db), usuario=Depends(auth.usuario_atual)):
    animal = models.Animal(**dados.model_dump(), tutor_id=usuario.id)
    db.add(animal)
    db.commit()
    db.refresh(animal)
    return animal


@router.get('', response_model=list[schemas.AnimalSaida])
def listar(db: Session = Depends(get_db), usuario=Depends(auth.usuario_atual)):
    return db.query(models.Animal).filter_by(tutor_id=usuario.id).all()


@router.get('/{animal_id}', response_model=schemas.AnimalSaida)
def detalhar(animal_id: int, db: Session = Depends(get_db), usuario=Depends(auth.usuario_atual)):
    return _buscar_do_tutor(db, animal_id, usuario)


@router.put('/{animal_id}', response_model=schemas.AnimalSaida)
def atualizar(animal_id: int, dados: schemas.AnimalCriar, db: Session = Depends(get_db), usuario=Depends(auth.usuario_atual)):
    animal = _buscar_do_tutor(db, animal_id, usuario)
    for campo, valor in dados.model_dump().items():
        setattr(animal, campo, valor)
    db.commit()
    db.refresh(animal)
    return animal


@router.delete('/{animal_id}', status_code=204)
def excluir(animal_id: int, db: Session = Depends(get_db), usuario=Depends(auth.usuario_atual)):
    animal = _buscar_do_tutor(db, animal_id, usuario)
    if db.query(models.Agendamento).filter_by(animal_id=animal.id).first():
        raise HTTPException(status_code=409, detail='Animal possui agendamentos e não pode ser excluído')
    db.delete(animal)
    db.commit()