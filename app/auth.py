import os
import bcrypt
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.database import get_db  # também carrega o .env (load_dotenv)
from app import models

# Chave que assina os tokens JWT: vem da variável de ambiente SECRET_KEY (.env ou docker compose).
# Sem valor padrão de propósito: uma chave fixa no código ficaria exposta no Git.
SECRET_KEY = os.getenv('SECRET_KEY')
if not SECRET_KEY:
    raise RuntimeError('Defina a variável de ambiente SECRET_KEY (veja o .env.example).')
ALGORITHM = 'HS256'
oauth2 = OAuth2PasswordBearer(tokenUrl='/login')


def gerar_hash(senha: str) -> str:
    # o bcrypt só aceita até 72 bytes
    return bcrypt.hashpw(senha.encode()[:72], bcrypt.gensalt()).decode()


def verificar_senha(senha: str, senha_hash: str) -> bool:
    return bcrypt.checkpw(senha.encode()[:72], senha_hash.encode())


def criar_token(usuario_id: int) -> str:
    expira = datetime.now(timezone.utc) + timedelta(hours=8)
    return jwt.encode({'sub': str(usuario_id), 'exp': expira}, SECRET_KEY, algorithm=ALGORITHM)


def usuario_atual(token: str = Depends(oauth2), db: Session = Depends(get_db)):
    erro = HTTPException(status_code=401, detail='Não autenticado')
    try:
        dados = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        usuario_id = int(dados['sub'])
    except (JWTError, KeyError, ValueError):
        raise erro
    usuario = db.get(models.Usuario, usuario_id)
    if not usuario or not usuario.ativo:
        raise erro
    return usuario


def exigir_funcionario(usuario=Depends(usuario_atual)):
    if usuario.perfil not in ('funcionario', 'administrador'):
        raise HTTPException(status_code=403, detail='Sem permissão para esta ação')
    return usuario


def exigir_admin(usuario=Depends(usuario_atual)):
    if usuario.perfil != 'administrador':
        raise HTTPException(status_code=403, detail='Sem permissão para esta ação')
    return usuario