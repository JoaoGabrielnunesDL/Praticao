
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas, auth
 
router = APIRouter(prefix='/servicos', tags=['Serviços'])
 
PERFIS_EQUIPE = ('funcionario', 'administrador')
 
 
def _usuario_opcional(request: Request, db: Session = Depends(get_db)):
    """Rota pública: sem token (ou com token inválido) o visitante é tratado como público."""
    cabecalho = request.headers.get('Authorization', '')
    esquema, _, token = cabecalho.partition(' ')
    if esquema.lower() != 'bearer' or not token:
        return None
    try:
        # Reaproveita a validação do token que o resto da API já usa.
        return auth.usuario_atual(token=token, db=db)
    except HTTPException:
        return None
 
 
@router.get('', response_model=list[schemas.ServicoSaida])
def listar(todos: bool = False, db: Session = Depends(get_db), usuario=Depends(_usuario_opcional)):
    consulta = db.query(models.Servico)
    # `todos=true` só vale para funcionário ou administrador; para os demais é ignorado.
    if not (todos and usuario is not None and usuario.perfil in PERFIS_EQUIPE):
        consulta = consulta.filter_by(ativo=True)
    return consulta.order_by(models.Servico.id).all()
 
 
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
 
 
@router.patch('/{servico_id}/ativar', response_model=schemas.ServicoSaida)
def ativar(servico_id: int, db: Session = Depends(get_db), _=Depends(auth.exigir_funcionario)):
    servico = db.get(models.Servico, servico_id)
    if not servico:
        raise HTTPException(status_code=404, detail='Serviço não encontrado')
    servico.ativo = True
    db.commit()
    db.refresh(servico)
    return servico
 

