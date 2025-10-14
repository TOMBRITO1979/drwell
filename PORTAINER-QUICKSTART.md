# DrWell - Quick Start Portainer

Guia rápido para deploy no Portainer em 5 minutos.

---

## 🚀 Passo 1: Build da Imagem (Escolha um método)

### Método A: Build Local (Mais rápido para testar)

```bash
# Windows
build-and-push.bat

# Linux/Mac
chmod +x build-and-push.sh
./build-and-push.sh
```

### Método B: CI/CD GitHub (Recomendado para produção)

1. Configure secrets no GitHub (veja SECRETS-SETUP.md)
2. Faça push:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/TOMBRITO1979/drwell.git
   git push -u origin main
   ```
3. GitHub Actions fará o build automaticamente!

---

## 🔐 Passo 2: Criar Secrets no Portainer

### 2.1 Gerar Senhas

```bash
# Secret Key (JWT)
python3 -c "import secrets; print(secrets.token_urlsafe(50))"

# Postgres Password (ou use uma senha forte)
openssl rand -base64 32
```

### 2.2 Criar no Portainer

**Portainer** → **Swarm** → **Configs/Secrets** → **Add Secret**

1. **Secret**: `postgres_password`
   - Valor: [senha gerada acima]

2. **Secret**: `secret_key`
   - Valor: [secret key gerada acima]

---

## ⚙️ Passo 3: Ajustar docker-stack.yml

Abra `docker-stack.yml` e altere:

### 3.1 Substitua POSTGRES_PASSWORD_PLACEHOLDER

**Encontre** (em api, celery_worker, celery_beat):
```yaml
- DATABASE_URL=postgresql://drwell:POSTGRES_PASSWORD_PLACEHOLDER@postgres:5432/drwell_db
```

**Substitua** pela senha que criou:
```yaml
- DATABASE_URL=postgresql://drwell:SuaSenhaAqui@postgres:5432/drwell_db
```

### 3.2 Altere os Domínios

**Encontre**:
```yaml
- "traefik.http.routers.drwell-api.rule=Host(`drwell.tombrito.com.br`)"
```

**Substitua** pelo seu domínio:
```yaml
- "traefik.http.routers.drwell-api.rule=Host(`seu-dominio.com`)"
```

Faça o mesmo para Flower.

---

## 📦 Passo 4: Deploy no Portainer

1. **Portainer** → **Stacks** → **Add stack**
2. **Name**: `drwell`
3. **Web editor**: Cole o conteúdo de `docker-stack.yml` (ajustado)
4. **Deploy the stack** → Aguarde ~30 segundos

---

## 💾 Passo 5: Executar Migrations

### Via Portainer UI:

1. **Swarm** → **Services** → `drwell_api`
2. **Containers** → Clique em um container
3. **Console** → **Connect**
4. Execute:

```bash
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

### Via SSH:

```bash
# Entrar no container
docker exec -it $(docker ps -q -f name=drwell_api | head -1) bash

# Executar migrations
alembic revision --autogenerate -m "Initial"
alembic upgrade head
exit
```

---

## ✅ Passo 6: Verificar

### 6.1 Testar a API

```bash
curl https://seu-dominio.com/health
```

Deve retornar:
```json
{"status": "healthy"}
```

### 6.2 Acessar Documentação

- **Swagger UI**: https://seu-dominio.com/docs
- **Flower**: https://flower.seu-dominio.com

### 6.3 Ver Logs

**Portainer** → **Swarm** → **Services** → `drwell_api` → **Logs**

---

## 🔧 Comandos Úteis

```bash
# Ver serviços
docker service ls | grep drwell

# Logs em tempo real
docker service logs -f drwell_api

# Escalar API
docker service scale drwell_api=3

# Reiniciar serviço
docker service update --force drwell_api

# Atualizar imagem
docker service update --image tomautomations/drwell:latest drwell_api
```

---

## 🆘 Problemas Comuns

### Serviço não inicia
```bash
docker service logs drwell_api
```

### Erro de conexão com banco
```bash
docker service logs drwell_postgres
```

### Erro de conexão com Redis
```bash
docker exec -it redis_redis redis-cli ping
```

### Traefik não roteia
- Verifique labels no `docker service inspect drwell_api`
- Verifique dashboard Traefik: http://seu-servidor:8080

---

## 📚 Próximos Passos

1. ✅ Configurar backup automático do PostgreSQL
2. ✅ Proteger Flower com Basic Auth
3. ✅ Configurar alertas de monitoramento
4. ✅ Criar primeiro usuário admin
5. ✅ Importar processos

---

## 📖 Documentação Completa

- Deploy completo: `DEPLOY.md`
- Configuração de secrets: `SECRETS-SETUP.md`
- README geral: `README.md`

---

**Está tudo pronto!** 🎉

Para suporte: https://github.com/TOMBRITO1979/drwell/issues
