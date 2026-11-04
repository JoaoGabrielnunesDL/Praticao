from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import Base, engine
from app import models
from app.routes import usuarios, animais, servicos, agendamentos, admin, relatorios

Base.metadata.create_all(bind=engine)

app = FastAPI(title='PratiCão API')

# Permite usar o Live Server do VS Code na porta 5500 durante o desenvolvimento.
app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://127.0.0.1:5500', 'http://localhost:5500'],
    allow_credentials=False,
    allow_methods=['*'],
    allow_headers=['*'],
)

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
