# DrWell - Guia de Deploy no Portainer (Docker Swarm)

## Pré-requisitos

- Docker Swarm inicializado
- Portainer instalado e funcionando
- Rede `network-public` criada
- Redis rodando como `redis_redis`
- Traefik configurado na rede `network-public`

---

## Passo 1: Build e Push da Imagem Docker

### Opção A: Build Manual Local

#### Windows:
```bash
build-and-push.bat
```

#### Linux/Mac:
```bash
chmod +x build-and-push.sh
./build-and-push.sh
```

Quando solicitado, faça login com:
- **Username**: tomautomations
- **Password**: [use o token do DockerHub]

### Opção B: CI/CD Automático com GitHub Actions

1. **Configure os Secrets no GitHub:**

   Vá em: `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

   Adicione:
   - Nome: `DOCKER_USERNAME`
     Valor: `tomautomations`

   - Nome: `DOCKER_TOKEN`
     Valor: `[seu-token-dockerhub-aqui]`

2. **Faça push para o GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/TOMBRITO1979/drwell.git
   git push -u origin main
   ```

3. **GitHub Actions fará o build automaticamente!**

---

## Passo 2: Criar Secrets no Portainer

### 2.1 Acesse o Portainer
- URL: `https://seu-portainer.com`
- Vá em: **Swarm** → **Configs/Secrets** → **Add Secret**

### 2.2 Criar Secret: `postgres_password`
- **Name**: `postgres_password`
- **Secret**: `SuaSenhaPostgresSegura123!`
- Clique em **Create secret**

### 2.3 Criar Secret: `secret_key`
- **Name**: `secret_key`
- **Secret**: Gere uma chave aleatória (exemplo abaixo)

```bash
# Gerar uma secret key aleatória
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

Ou use: `sua-chave-secreta-muito-segura-aqui-mude-isto`

- Clique em **Create secret**

---

## Passo 3: Ajustar a Stack YAML

Antes de fazer deploy, você precisa ajustar algumas configurações no arquivo `docker-stack.yml`:

### 3.1 Substituir o Placeholder da Senha do Postgres

Encontre esta linha em **TODOS** os serviços (api, celery_worker, celery_beat):
```yaml
- DATABASE_URL=postgresql://drwell:POSTGRES_PASSWORD_PLACEHOLDER@postgres:5432/drwell_db
```

Substitua `POSTGRES_PASSWORD_PLACEHOLDER` pela senha que você criou no secret:
```yaml
- DATABASE_URL=postgresql://drwell:SuaSenhaPostgresSegura123!@postgres:5432/drwell_db
```

**NOTA**: Em produção, o ideal é usar Docker Secrets para a senha. Por enquanto, estamos usando direto na env var.

### 3.2 Ajustar Domínios

Encontre estas linhas e ajuste para seus domínios:
```yaml
- "traefik.http.routers.drwell-api.rule=Host(`drwell.tombrito.com.br`) || Host(`api.drwell.tombrito.com.br`)"
```

Substitua por seus domínios:
```yaml
- "traefik.http.routers.drwell-api.rule=Host(`seu-dominio.com`) || Host(`api.seu-dominio.com`)"
```

Faça o mesmo para o Flower:
```yaml
- "traefik.http.routers.drwell-flower.rule=Host(`flower.seu-dominio.com`)"
```

---

## Passo 4: Deploy da Stack no Portainer

### 4.1 Acesse o Portainer
- Vá em: **Stacks** → **Add stack**

### 4.2 Configure a Stack
- **Name**: `drwell`
- **Build method**: Selecione **Web editor**
- **Web editor**: Cole o conteúdo do arquivo `docker-stack.yml` (ajustado)

### 4.3 Deploy
- Clique em **Deploy the stack**
- Aguarde alguns segundos

---

## Passo 5: Executar Migrations do Banco de Dados

Após o deploy, você precisa criar as tabelas no banco:

### 5.1 Via Portainer UI

1. Vá em **Swarm** → **Services**
2. Encontre o serviço `drwell_api`
3. Clique no service
4. Vá na aba **Containers**
5. Clique em um dos containers
6. Clique em **Console** → **Connect**
7. Execute:

```bash
# Criar migration inicial
alembic revision --autogenerate -m "Initial migration"

# Aplicar migrations
alembic upgrade head
```

### 5.2 Via SSH no Servidor

```bash
# Encontrar o container da API
docker ps | grep drwell_api

# Entrar no container (substitua CONTAINER_ID)
docker exec -it <CONTAINER_ID> bash

# Dentro do container
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

---

## Passo 6: Verificar o Deploy

### 6.1 Verificar Serviços
```bash
# Listar todos os serviços
docker service ls | grep drwell

# Ver logs de um serviço específico
docker service logs -f drwell_api
docker service logs -f drwell_celery_worker
docker service logs -f drwell_postgres
```

### 6.2 Testar a API

#### Health Check
```bash
curl https://seu-dominio.com/health
```

Resposta esperada:
```json
{"status": "healthy"}
```

#### API Root
```bash
curl https://seu-dominio.com/
```

#### Documentação
Abra no navegador:
- **Swagger UI**: `https://seu-dominio.com/docs`
- **ReDoc**: `https://seu-dominio.com/redoc`

#### Flower (Monitor Celery)
- **URL**: `https://flower.seu-dominio.com`

---

## Passo 7: Verificar Componentes

### PostgreSQL
```bash
# Conectar ao PostgreSQL
docker exec -it $(docker ps -q -f name=drwell_postgres) psql -U drwell -d drwell_db

# Listar tabelas
\dt

# Sair
\q
```

### Redis
```bash
# Testar conexão com Redis
docker exec -it redis_redis redis-cli

# Testar
PING
# Deve retornar: PONG

# Sair
exit
```

### Celery
```bash
# Ver workers ativos via Flower
curl https://flower.seu-dominio.com/api/workers

# Ou acesse pelo navegador
https://flower.seu-dominio.com
```

---

## Atualizar a Stack

### Atualizar apenas a imagem (após novo build):

```bash
# Atualizar o serviço da API
docker service update --image tomautomations/drwell:latest drwell_api

# Atualizar workers
docker service update --image tomautomations/drwell:latest drwell_celery_worker
docker service update --image tomautomations/drwell:latest drwell_celery_beat
docker service update --image tomautomations/drwell:latest drwell_flower
```

### Atualizar a stack completa:

1. No Portainer: **Stacks** → `drwell` → **Editor**
2. Faça as alterações necessárias
3. Clique em **Update the stack**

---

## Troubleshooting

### Problema: Serviços não iniciam

```bash
# Ver logs detalhados
docker service logs -f drwell_api

# Ver eventos do swarm
docker events

# Inspecionar serviço
docker service inspect drwell_api
```

### Problema: Erro de conexão com banco de dados

1. Verifique se o PostgreSQL está rodando:
   ```bash
   docker service ls | grep postgres
   ```

2. Verifique os logs do PostgreSQL:
   ```bash
   docker service logs drwell_postgres
   ```

3. Teste a conexão:
   ```bash
   docker exec -it $(docker ps -q -f name=drwell_api) bash
   psql postgresql://drwell:senha@postgres:5432/drwell_db
   ```

### Problema: Erro de conexão com Redis

1. Verifique se o Redis está rodando:
   ```bash
   docker ps | grep redis_redis
   ```

2. Teste a conexão:
   ```bash
   docker exec -it redis_redis redis-cli
   PING
   ```

### Problema: Traefik não roteia

1. Verifique se a rede está correta:
   ```bash
   docker network ls | grep network-public
   ```

2. Verifique os labels do Traefik:
   ```bash
   docker service inspect drwell_api --format='{{json .Spec.Labels}}' | jq
   ```

3. Verifique o dashboard do Traefik:
   - URL: `http://seu-servidor:8080`

### Problema: Celery não processa tasks

1. Verifique os logs do worker:
   ```bash
   docker service logs -f drwell_celery_worker
   ```

2. Verifique se o Redis está acessível:
   ```bash
   docker exec -it $(docker ps -q -f name=drwell_celery_worker) bash
   redis-cli -h redis_redis ping
   ```

3. Acesse o Flower e veja os workers:
   ```
   https://flower.seu-dominio.com
   ```

---

## Comandos Úteis

```bash
# Escalar serviços
docker service scale drwell_api=3
docker service scale drwell_celery_worker=4

# Reiniciar serviço
docker service update --force drwell_api

# Ver uso de recursos
docker stats

# Limpar resources não usados
docker system prune -a

# Backup do PostgreSQL
docker exec $(docker ps -q -f name=drwell_postgres) \
  pg_dump -U drwell drwell_db > backup.sql

# Restaurar backup
cat backup.sql | docker exec -i $(docker ps -q -f name=drwell_postgres) \
  psql -U drwell drwell_db
```

---

## Segurança em Produção

### 1. Proteger o Flower com Basic Auth

Gere uma senha:
```bash
echo $(htpasswd -nb admin SuaSenha123) | sed -e s/\\$/\\$\\$/g
```

Adicione ao docker-stack.yml:
```yaml
- "traefik.http.routers.drwell-flower.middlewares=flower-auth"
- "traefik.http.middlewares.flower-auth.basicauth.users=admin:$$apr1$$...$$..."
```

### 2. Rate Limiting

Adicione middleware de rate limit:
```yaml
- "traefik.http.routers.drwell-api.middlewares=api-ratelimit"
- "traefik.http.middlewares.api-ratelimit.ratelimit.average=100"
- "traefik.http.middlewares.api-ratelimit.ratelimit.burst=50"
```

### 3. Backup Automático

Configure backup automático do PostgreSQL com cron.

---

## Suporte

Para problemas ou dúvidas:
1. Verifique os logs: `docker service logs drwell_api`
2. Consulte a documentação: `/docs`
3. GitHub Issues: https://github.com/TOMBRITO1979/drwell/issues

---

**DrWell** - Sistema de Gestão para Escritórios de Advocacia
