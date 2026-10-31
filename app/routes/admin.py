from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix='/admin', tags=['Administração'])


def _buscar(db: Session, usuario_id: int) -> models.Usuario:
    alvo = db.get(models.Usuario, usuario_id)
    if not alvo:
        raise HTTPException(status_code=404, detail='Usuário não encontrado')
    return alvo


@router.get('/usuarios', response_model=list[schemas.UsuarioSaida])
def listar_usuarios(db: Session = Depends(get_db), _=Depends(auth.exigir_admin)):
    return db.query(models.Usuario).order_by(models.Usuario.id).all()


@router.get('/usuarios/{usuario_id}', response_model=schemas.UsuarioSaida)
def consultar_usuario(usuario_id: int, db: Session = Depends(get_db), _=Depends(auth.exigir_admin)):
    return _buscar(db, usuario_id)


@router.patch('/usuarios/{usuario_id}/desativar', response_model=schemas.UsuarioSaida)
def desativar_usuario(usuario_id: int, db: Session = Depends(get_db), admin=Depends(auth.exigir_admin)):
    alvo = _buscar(db, usuario_id)
    if alvo.id == admin.id:
        raise HTTPException(status_code=400, detail='Você não pode desativar a própria conta')
    alvo.ativo = False
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