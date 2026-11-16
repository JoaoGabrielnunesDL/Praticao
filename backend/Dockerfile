FROM python:3.14-slim

WORKDIR /app

# PRATICAO_EM_DOCKER=1 é o que autoriza a API a iniciar (veja app/database.py).
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PRATICAO_EM_DOCKER=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# Cria as tabelas e os dados iniciais (só o que ainda não existe) e sobe a API
CMD ["sh", "-c", "python seed.py && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
