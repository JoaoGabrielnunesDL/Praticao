from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas, auth

router = APIRouter(tags=['Usuários'])


@router.post('/cadastro', response_model=schemas.UsuarioSaida, status_code=201)
def cadastro(dados: schemas.UsuarioCriar, db: Session = Depends(get_db)):
    if db.query(models.Usuario).filter_by(email=dados.email).first():
        raise HTTPException(status_code=409, detail='E-mail já cadastrado')
    usuario = models.Usuario(
        nome=dados.nome,
        email=dados.email,
        senha_hash=auth.gerar_hash(dados.senha),
        telefone=dados.telefone,
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


@router.post('/login', response_model=schemas.Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter_by(email=form.username).first()
    if not usuario or not auth.verificar_senha(form.password, usuario.senha_hash):
        raise HTTPException(status_code=401, detail='E-mail ou senha incorretos')
    if not usuario.ativo:
        raise HTTPException(status_code=403, detail='Conta desativada')
    return schemas.Token(access_token=auth.criar_token(usuario.id))


@router.get('/me', response_model=schemas.UsuarioSaida)
def meus_dados(usuario=Depends(auth.usuario_atual)):
    return usuario


@router.put('/me', response_model=schemas.UsuarioSaida)
def atualizar_perfil(dados: schemas.UsuarioAtualizar, db: Session = Depends(get_db), usuario=Depends(auth.usuario_atual)):
    usuario.nome = dados.nome
    usuario.telefone = dados.telefone
    db.commit()
    db.refresh(usuario)
    return usuario


@router.post('/logout')
def logout(_=Depends(auth.usuario_atual)):
    # com JWT a sessão é encerrada quando o front-end descarta o token
    return {'mensagem': 'Sessão encerrada'}