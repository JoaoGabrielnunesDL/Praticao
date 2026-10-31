from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.database import Base, engine
from app import models
from app.routes import usuarios, animais, servicos, agendamentos, admin, relatorios

Base.metadata.create_all(bind=engine)

app = FastAPI(title='PratiCão API')

app.include_router(usuarios.router)
app.include_router(animais.router)
app.include_router(servicos.router)
app.include_router(agendamentos.router)
app.include_router(admin.router)
app.include_router(relatorios.router)


@app.get('/ola')
def ola():
    return {'mensagem': 'PratiCão funcionando'}


# Sempre por último: serve as telas da pasta static
app.mount('/', StaticFiles(directory='static', html=True), name='static')