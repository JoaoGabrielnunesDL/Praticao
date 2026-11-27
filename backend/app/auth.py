import os
import uuid
import bcrypt
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database import get_db
from app import models

# Chave que assina os tokens JWT: vem da variável de ambiente SECRET_KEY (definida no .env e repassada pelo docker compose).
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
    # jti = identificador único do token; é ele que o logout marca como encerrado.
    return jwt.encode({'sub': str(usuario_id), 'exp': expira, 'jti': uuid.uuid4().hex}, SECRET_KEY, algorithm=ALGORITHM)


def buscar_por_email(db: Session, email: str):
    """Procura o usuário pelo e-mail sem diferenciar maiúsculas de minúsculas."""
    return db.query(models.Usuario).filter(func.lower(models.Usuario.email) == email.strip().lower()).first()


def revogar_token(token: str, db: Session) -> None:
    """Logout: guarda o token como encerrado, então ele deixa de valer mesmo antes de expirar."""
    try:
        dados = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return
    jti = dados.get('jti')
    if not jti:
        return
    agora = datetime.now(timezone.utc).replace(tzinfo=None)
    # Limpeza: tokens que já expiraram sozinhos não precisam ficar guardados.
    db.query(models.TokenRevogado).filter(models.TokenRevogado.expira < agora).delete()
    if not db.get(models.TokenRevogado, jti):
        expira = datetime.fromtimestamp(dados['exp'], timezone.utc).replace(tzinfo=None)
        db.add(models.TokenRevogado(jti=jti, expira=expira))
    db.commit()


# ----- Recuperação de senha -----
MINUTOS_RECUPERACAO = 30


def recuperacao_demo() -> bool:
    """Modo demonstração: a API devolve o token de recuperação na própria resposta (não há envio de e-mail).
    Ligado pelo docker compose (RECUPERACAO_DEMO=1). Em produção use 0 e envie o link por e-mail."""
    return os.getenv('RECUPERACAO_DEMO', '0') == '1'


def _marca_senha(senha_hash: str) -> str:
    # Pedaço do hash atual: quando a senha muda, o hash muda e o token antigo deixa de valer (uso único).
    return senha_hash[-12:]


def _token_recuperacao(usuario_id: int, marca: str) -> str:
    expira = datetime.now(timezone.utc) + timedelta(minutes=MINUTOS_RECUPERACAO)
    return jwt.encode(
        {'sub': str(usuario_id), 'tipo': 'recuperacao', 'marca': marca, 'exp': expira},
        SECRET_KEY, algorithm=ALGORITHM,
    )


def criar_token_recuperacao(usuario) -> str:
    return _token_recuperacao(usuario.id, _marca_senha(usuario.senha_hash))


def criar_token_recuperacao_falso() -> str:
    # Mesmo formato do verdadeiro, mas não funciona: evita revelar se o e-mail existe.
    return _token_recuperacao(0, 'invalido')


def usuario_do_token_recuperacao(token: str, db: Session):
    erro = HTTPException(status_code=400, detail='Link inválido ou expirado. Peça um novo.')
    try:
        dados = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        usuario_id = int(dados['sub'])
    except (JWTError, KeyError, ValueError):
        raise erro
    if dados.get('tipo') != 'recuperacao':
        raise erro
    usuario = db.get(models.Usuario, usuario_id)
    if not usuario or not usuario.ativo or dados.get('marca') != _marca_senha(usuario.senha_hash):
        raise erro
    return usuario


def usuario_atual(token: str = Depends(oauth2), db: Session = Depends(get_db)):
    erro = HTTPException(status_code=401, detail='Não autenticado')
    try:
        dados = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        usuario_id = int(dados['sub'])
    except (JWTError, KeyError, ValueError):
        raise erro
    if 'tipo' in dados:
        # Token de recuperação de senha não vale como login.
        raise erro
    jti = dados.get('jti')
    if jti and db.get(models.TokenRevogado, jti):
        # Sessão encerrada pelo logout.
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
