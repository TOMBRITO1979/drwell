# DrWell - Quick Start Guide

## Início Rápido (5 minutos)

### 1. Configure o ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite e configure suas variáveis (IMPORTANTE!)
# Mínimo: SECRET_KEY, POSTGRES_PASSWORD, REDIS_PASSWORD
```

### 2. Inicie o projeto

```bash
# Opção 1: Usando Make (recomendado)
make up

# Opção 2: Usando Docker Compose
docker-compose up -d
```

### 3. Execute as migrations

```bash
# Criar migration inicial
docker-compose exec api alembic revision --autogenerate -m "Initial migration"

# Aplicar migrations
docker-compose exec api alembic upgrade head
```

### 4. Acesse os serviços

- **API**: http://localhost/api/v1
- **Documentação Interativa**: http://localhost/docs
- **Flower (Monitor Celery)**: http://localhost:5555
- **Traefik Dashboard**: http://localhost:8080

## Testando a API

### 1. Health Check

```bash
curl http://localhost/health
```

### 2. Ver Documentação

Abra o navegador em: http://localhost/docs

### 3. Criar um processo (exemplo)

```bash
curl -X POST "http://localhost/api/v1/processes/" \
  -H "Content-Type: application/json" \
  -d '{
    "process_number": "00008323520184013202",
    "subject": "Previdenciário",
    "court_type": "trf"
  }'
```

## Comandos Úteis

```bash
# Ver logs
docker-compose logs -f api

# Ver status
docker-compose ps

# Reiniciar API
docker-compose restart api

# Parar tudo
docker-compose down

# Limpar tudo (CUIDADO: apaga dados)
docker-compose down -v
```

## Próximos Passos

1. Implemente a autenticação nos endpoints
2. Crie o primeiro usuário Master
3. Cadastre seu escritório
4. Adicione advogados
5. Cadastre clientes
6. Comece a adicionar processos

## Problemas Comuns

### Porta 80 já está em uso

```bash
# Edite docker-compose.yml e mude a porta:
ports:
  - "8000:80"  # Acesse via localhost:8000
```

### Migrations não funcionam

```bash
# Delete o banco e recrie
docker-compose down -v
docker-compose up -d
# Execute migrations novamente
```

### Celery não processa tasks

```bash
# Verifique os logs
docker-compose logs celery_worker

# Reinicie o worker
docker-compose restart celery_worker celery_beat
```

## Dúvidas?

Consulte o README.md completo para mais informações.
