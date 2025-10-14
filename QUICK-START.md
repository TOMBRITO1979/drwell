# DrWell - Quick Start Guide

## Status: Pronto para Deploy

✅ Código no GitHub: https://github.com/TOMBRITO1979/drwell
✅ Imagem Docker: `tomautomations/drwell:latest`
✅ Documentação completa criada

---

## Deploy em 5 Passos

### 1. Criar Secrets no Portainer

Acesse: **Swarm → Configs/Secrets → Add secret**

**Secret 1**: `postgres_password`
```
Valor: DrW3ll$P0stgr3s#2024!Secure
```

**Secret 2**: `secret_key`
```
Valor: DrW3ll-JWT-S3cr3t-K3y-2024-Pr0duct10n-V3ry-S3cur3
```

---

### 2. Abrir o Arquivo de Deploy

Abra: `PORTAINER-DEPLOY-FINAL.md`

---

### 3. Ajustar 2 Configurações

No YAML do arquivo, encontre e substitua:

**A) Senha do PostgreSQL** (3 lugares - linhas 44, 102, 135):
```yaml
# Encontre:
DATABASE_URL=postgresql://drwell:POSTGRES_PASSWORD_PLACEHOLDER@postgres:5432/drwell_db

# Substitua por (use a mesma senha do secret):
DATABASE_URL=postgresql://drwell:DrW3ll$P0stgr3s#2024!Secure@postgres:5432/drwell_db
```

**B) Domínios** (2 lugares - linhas 78 e 181):
```yaml
# Encontre:
Host(`drwell.tombrito.com.br`)

# Substitua por:
Host(`seu-dominio.com`)
```

---

### 4. Deploy no Portainer

1. Acesse: **Stacks → Add stack**
2. Name: `drwell`
3. Cole o YAML ajustado
4. Clique em **Deploy the stack**

---

### 5. Executar Migrations

No Portainer:
1. Vá em: **Swarm → Services → drwell_api**
2. Clique em um container
3. Console → Connect → `/bin/bash`
4. Execute:

```bash
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

---

## Verificar Deploy

### Health Check
```bash
curl https://seu-dominio.com/health
```

Deve retornar:
```json
{"status": "healthy"}
```

### Documentação
Abra no navegador:
- `https://seu-dominio.com/docs` (Swagger)
- `https://flower.seu-dominio.com` (Monitoring)

---

## Criar Primeiro Usuário

Via Swagger (`/docs`) ou curl:

```bash
curl -X POST "https://seu-dominio.com/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@seu-escritorio.com",
    "password": "SuaSenhaForte123!",
    "full_name": "Administrador",
    "role": "master"
  }'
```

---

## Testar Integração DataJud

### 1. Fazer Login
```bash
curl -X POST "https://seu-dominio.com/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@seu-escritorio.com",
    "password": "SuaSenhaForte123!"
  }'
```

### 2. Criar Processo
```bash
curl -X POST "https://seu-dominio.com/api/v1/processes" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "process_number": "0001234-56.2024.8.26.0100",
    "court_type": "TJSP",
    "subject": "Teste",
    "datajud_endpoint": "tjsp",
    "auto_sync_enabled": true
  }'
```

### 3. Sincronizar
```bash
curl -X POST "https://seu-dominio.com/api/v1/processes/1/sync" \
  -H "Authorization: Bearer SEU_TOKEN"
```

---

## Comandos Úteis

### Ver Logs
```bash
docker service logs -f drwell_api
```

### Escalar API
```bash
docker service scale drwell_api=3
```

### Backup
```bash
docker exec $(docker ps -q -f name=drwell_postgres) \
  pg_dump -U drwell drwell_db > backup.sql
```

---

## Problemas Comuns

### Serviço não inicia
```bash
docker service logs -f drwell_api
docker service ps drwell_api --no-trunc
```

### PostgreSQL não conecta
Verifique se a senha no `DATABASE_URL` está correta

### Traefik não roteia
Verifique se os domínios DNS estão apontando para o servidor

---

## Arquivos Importantes

- `PORTAINER-DEPLOY-FINAL.md` - **Deploy principal (USE ESTE!)**
- `DEPLOYMENT-SUMMARY.md` - Resumo completo do projeto
- `API-EXAMPLES.md` - Exemplos de uso da API
- `README.md` - Documentação do projeto

---

## Recursos do Sistema

✅ Gestão de Escritórios
✅ Gestão de Advogados
✅ Gestão de Clientes
✅ Gestão de Processos
✅ **Integração DataJud CNJ (70+ tribunais)**
✅ Sincronização automática de processos
✅ Documentos e uploads
✅ Celery para tasks assíncronas
✅ Autenticação JWT
✅ API REST completa
✅ Swagger/ReDoc docs
✅ Monitoramento com Flower
✅ Alta disponibilidade (2 replicas)
✅ SSL/TLS automático

---

## Endpoints Principais

**Docs**: `GET /docs`
**Health**: `GET /health`
**Register**: `POST /api/v1/auth/register`
**Login**: `POST /api/v1/auth/login`
**Clientes**: `GET/POST /api/v1/clients`
**Processos**: `GET/POST /api/v1/processes`
**Sync DataJud**: `POST /api/v1/processes/{id}/sync`

---

## Suporte

- GitHub: https://github.com/TOMBRITO1979/drwell
- DockerHub: https://hub.docker.com/r/tomautomations/drwell
- Logs: `docker service logs drwell_api`
- Monitoring: `https://flower.seu-dominio.com`

---

**Pronto! Agora é só fazer o deploy!**

Abra `PORTAINER-DEPLOY-FINAL.md` e siga os 5 passos acima.
