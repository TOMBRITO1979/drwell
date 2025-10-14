# DrWell - Deploy Final no Portainer

## Imagem Docker Disponível

A imagem Docker já está publicada no DockerHub:

```
tomautomations/drwell:latest
```

Digest: `sha256:101fe67f5df9e03a06b11a93664a5a3e8ac4dbf44f3bbe8152c361c2d017bbdb`

---

## Pré-requisitos

Antes de fazer o deploy, certifique-se que você tem:

- ✅ Docker Swarm inicializado
- ✅ Portainer rodando
- ✅ Rede `network-public` criada e configurada
- ✅ Redis rodando como serviço `redis_redis` (sem senha)
- ✅ Traefik configurado na rede `network-public`

---

## Passo 1: Criar Secrets no Portainer

### 1.1 Acessar Portainer
Vá em: **Swarm** → **Configs/Secrets** → **Add secret**

### 1.2 Criar Secret: postgres_password

**Name**: `postgres_password`

**Secret**: Escolha uma senha forte para o PostgreSQL (exemplo):
```
DrW3ll$P0stgr3s#2024!Secure
```

Clique em **Create secret**

### 1.3 Criar Secret: secret_key

**Name**: `secret_key`

**Secret**: Gere uma chave aleatória segura:

```bash
# No Linux/Mac:
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Ou use esta:
DrW3ll-JWT-S3cr3t-K3y-2024-Pr0duct10n-V3ry-S3cur3
```

Clique em **Create secret**

---

## Passo 2: Ajustar Configurações da Stack

Antes de colar a stack no Portainer, você precisa fazer 2 ajustes:

### 2.1 Substituir a Senha do PostgreSQL

No arquivo YAML abaixo, encontre **TODAS** as ocorrências de:
```yaml
DATABASE_URL=postgresql://drwell:POSTGRES_PASSWORD_PLACEHOLDER@postgres:5432/drwell_db
```

Substitua `POSTGRES_PASSWORD_PLACEHOLDER` pela **MESMA SENHA** que você criou no secret `postgres_password`.

Por exemplo, se sua senha é `DrW3ll$P0stgr3s#2024!Secure`, ficará:
```yaml
DATABASE_URL=postgresql://drwell:DrW3ll$P0stgr3s#2024!Secure@postgres:5432/drwell_db
```

**IMPORTANTE**: Substitua em 3 lugares:
- Serviço `api` (linha 44)
- Serviço `celery_worker` (linha 102)
- Serviço `celery_beat` (linha 135)

### 2.2 Ajustar os Domínios

Encontre e ajuste para seus domínios reais:

**API Principal** (linha 78):
```yaml
- "traefik.http.routers.drwell-api.rule=Host(`drwell.tombrito.com.br`) || Host(`api.drwell.tombrito.com.br`)"
```

Substitua por seus domínios:
```yaml
- "traefik.http.routers.drwell-api.rule=Host(`seu-dominio.com`) || Host(`api.seu-dominio.com`)"
```

**Flower** (linha 181):
```yaml
- "traefik.http.routers.drwell-flower.rule=Host(`flower.drwell.tombrito.com.br`)"
```

Substitua por:
```yaml
- "traefik.http.routers.drwell-flower.rule=Host(`flower.seu-dominio.com`)"
```

---

## Passo 3: Deploy da Stack no Portainer

### 3.1 Acessar Portainer
Vá em: **Stacks** → **Add stack**

### 3.2 Configurar a Stack
- **Name**: `drwell`
- **Build method**: Selecione **Web editor**

### 3.3 Colar a Stack YAML

Cole o conteúdo abaixo (DEPOIS de fazer os ajustes do Passo 2):

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: drwell
      POSTGRES_PASSWORD_FILE: /run/secrets/postgres_password
      POSTGRES_DB: drwell_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - drwell_internal
    secrets:
      - postgres_password
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U drwell"]
      interval: 10s
      timeout: 5s
      retries: 5

  # FastAPI Application
  api:
    image: tomautomations/drwell:latest
    environment:
      - ENVIRONMENT=production
      - DATABASE_URL=postgresql://drwell:POSTGRES_PASSWORD_PLACEHOLDER@postgres:5432/drwell_db
      - REDIS_URL=redis://redis_redis:6379/0
      - SECRET_KEY_FILE=/run/secrets/secret_key
      - DATAJUD_API_KEY=cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==
    volumes:
      - uploads:/app/uploads
    networks:
      - network-public
      - drwell_internal
    secrets:
      - secret_key
      - postgres_password
    deploy:
      replicas: 2
      update_config:
        parallelism: 1
        delay: 10s
        order: start-first
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
      labels:
        - "traefik.enable=true"
        - "traefik.docker.network=network-public"

        # HTTP Router
        - "traefik.http.routers.drwell-api.rule=Host(`drwell.tombrito.com.br`) || Host(`api.drwell.tombrito.com.br`)"
        - "traefik.http.routers.drwell-api.entrypoints=websecure"
        - "traefik.http.routers.drwell-api.tls=true"
        - "traefik.http.routers.drwell-api.tls.certresolver=letsencrypt"

        # Service
        - "traefik.http.services.drwell-api.loadbalancer.server.port=8000"
        - "traefik.http.services.drwell-api.loadbalancer.healthcheck.path=/health"
        - "traefik.http.services.drwell-api.loadbalancer.healthcheck.interval=10s"

        # Middleware (opcional - descomente se precisar)
        # - "traefik.http.routers.drwell-api.middlewares=drwell-compress,drwell-ratelimit"
        # - "traefik.http.middlewares.drwell-compress.compress=true"
        # - "traefik.http.middlewares.drwell-ratelimit.ratelimit.average=100"
        # - "traefik.http.middlewares.drwell-ratelimit.ratelimit.burst=50"
    depends_on:
      - postgres

  # Celery Worker - Background Jobs
  celery_worker:
    image: tomautomations/drwell:latest
    command: celery -A app.workers.celery_app worker --loglevel=info --concurrency=4
    environment:
      - ENVIRONMENT=production
      - DATABASE_URL=postgresql://drwell:POSTGRES_PASSWORD_PLACEHOLDER@postgres:5432/drwell_db
      - REDIS_URL=redis://redis_redis:6379/0
      - SECRET_KEY_FILE=/run/secrets/secret_key
      - DATAJUD_API_KEY=cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==
    networks:
      - network-public
      - drwell_internal
    secrets:
      - secret_key
      - postgres_password
    deploy:
      replicas: 2
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
    depends_on:
      - postgres
      - api

  # Celery Beat - Scheduler
  celery_beat:
    image: tomautomations/drwell:latest
    command: celery -A app.workers.celery_app beat --loglevel=info
    environment:
      - ENVIRONMENT=production
      - DATABASE_URL=postgresql://drwell:POSTGRES_PASSWORD_PLACEHOLDER@postgres:5432/drwell_db
      - REDIS_URL=redis://redis_redis:6379/0
      - SECRET_KEY_FILE=/run/secrets/secret_key
      - DATAJUD_API_KEY=cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==
    networks:
      - network-public
      - drwell_internal
    secrets:
      - secret_key
      - postgres_password
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
        reservations:
          cpus: '0.1'
          memory: 128M
    depends_on:
      - postgres
      - celery_worker

  # Flower - Celery Monitoring
  flower:
    image: tomautomations/drwell:latest
    command: celery -A app.workers.celery_app flower --port=5555
    environment:
      - REDIS_URL=redis://redis_redis:6379/0
    networks:
      - network-public
      - drwell_internal
    deploy:
      replicas: 1
      labels:
        - "traefik.enable=true"
        - "traefik.docker.network=network-public"

        # HTTP Router
        - "traefik.http.routers.drwell-flower.rule=Host(`flower.drwell.tombrito.com.br`)"
        - "traefik.http.routers.drwell-flower.entrypoints=websecure"
        - "traefik.http.routers.drwell-flower.tls=true"
        - "traefik.http.routers.drwell-flower.tls.certresolver=letsencrypt"

        # Service
        - "traefik.http.services.drwell-flower.loadbalancer.server.port=5555"

        # Basic Auth (Recomendado - descomente e configure)
        # Gere a senha: echo $(htpasswd -nb admin sua-senha) | sed -e s/\\$/\\$\\$/g
        # - "traefik.http.routers.drwell-flower.middlewares=flower-auth"
        # - "traefik.http.middlewares.flower-auth.basicauth.users=admin:$$apr1$$hash$$aqui"
      restart_policy:
        condition: on-failure
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
    depends_on:
      - celery_worker

networks:
  network-public:
    external: true
  drwell_internal:
    driver: overlay
    attachable: true

volumes:
  postgres_data:
    driver: local
  uploads:
    driver: local

secrets:
  postgres_password:
    external: true
  secret_key:
    external: true
```

### 3.4 Deploy
Clique em **Deploy the stack**

Aguarde alguns segundos enquanto os containers são criados.

---

## Passo 4: Executar Migrations do Banco de Dados

### 4.1 Via Portainer UI

1. Vá em **Swarm** → **Services**
2. Encontre o serviço `drwell_api`
3. Clique no service
4. Vá na aba **Containers**
5. Clique em um dos containers
6. Clique em **Console** → **Connect** → Selecione `/bin/bash`
7. Execute:

```bash
# Criar migration inicial
alembic revision --autogenerate -m "Initial migration"

# Aplicar migrations
alembic upgrade head
```

### 4.2 Via SSH no Servidor (Alternativa)

```bash
# Encontrar o container
docker ps | grep drwell_api

# Entrar no container (substitua CONTAINER_ID)
docker exec -it <CONTAINER_ID> bash

# Dentro do container
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
exit
```

---

## Passo 5: Verificar o Deploy

### 5.1 Verificar Serviços

No Portainer, vá em **Swarm** → **Services**

Você deve ver 5 serviços rodando:
- ✅ `drwell_api` (2 replicas)
- ✅ `drwell_celery_worker` (2 replicas)
- ✅ `drwell_celery_beat` (1 replica)
- ✅ `drwell_flower` (1 replica)
- ✅ `drwell_postgres` (1 replica)

### 5.2 Testar a API

#### Health Check
```bash
curl https://seu-dominio.com/health
```

Resposta esperada:
```json
{"status": "healthy"}
```

#### Documentação Interativa

Abra no navegador:
- **Swagger UI**: `https://seu-dominio.com/docs`
- **ReDoc**: `https://seu-dominio.com/redoc`

#### Flower (Monitor Celery)
- **URL**: `https://flower.seu-dominio.com`

Você deve ver os 2 workers ativos processando tasks.

---

## Passo 6: Criar Primeiro Usuário (Opcional)

Você pode criar um usuário admin via API:

```bash
curl -X POST "https://seu-dominio.com/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@drwell.com",
    "password": "SuaSenhaForte123!",
    "full_name": "Administrador",
    "role": "master"
  }'
```

Ou use a interface Swagger em: `https://seu-dominio.com/docs`

---

## Comandos Úteis

### Ver Logs dos Serviços

```bash
# API
docker service logs -f drwell_api

# Workers
docker service logs -f drwell_celery_worker

# Scheduler
docker service logs -f drwell_celery_beat

# PostgreSQL
docker service logs -f drwell_postgres
```

### Escalar Serviços

```bash
# Escalar API para 3 replicas
docker service scale drwell_api=3

# Escalar workers para 4 replicas
docker service scale drwell_celery_worker=4
```

### Atualizar Serviço (após novo build)

```bash
# Atualizar para nova versão da imagem
docker service update --image tomautomations/drwell:latest drwell_api
docker service update --image tomautomations/drwell:latest drwell_celery_worker
docker service update --image tomautomations/drwell:latest drwell_celery_beat
docker service update --image tomautomations/drwell:latest drwell_flower
```

### Reiniciar Serviço

```bash
docker service update --force drwell_api
```

### Backup do PostgreSQL

```bash
docker exec $(docker ps -q -f name=drwell_postgres) \
  pg_dump -U drwell drwell_db > backup-$(date +%Y%m%d).sql
```

### Restaurar Backup

```bash
cat backup-20240101.sql | docker exec -i $(docker ps -q -f name=drwell_postgres) \
  psql -U drwell drwell_db
```

---

## Troubleshooting

### Serviços não iniciam

```bash
# Ver logs detalhados
docker service logs -f drwell_api

# Ver tarefas do serviço
docker service ps drwell_api --no-trunc

# Inspecionar serviço
docker service inspect drwell_api
```

### Erro de conexão com PostgreSQL

1. Verifique se o PostgreSQL está rodando:
   ```bash
   docker service ls | grep postgres
   ```

2. Teste a conexão:
   ```bash
   docker exec -it $(docker ps -q -f name=drwell_postgres) \
     psql -U drwell -d drwell_db
   ```

3. Verifique se a senha no `DATABASE_URL` está correta

### Erro de conexão com Redis

1. Verifique se o Redis está rodando:
   ```bash
   docker ps | grep redis_redis
   ```

2. Teste a conexão:
   ```bash
   docker exec -it redis_redis redis-cli ping
   # Deve retornar: PONG
   ```

### Traefik não roteia

1. Verifique os labels do serviço:
   ```bash
   docker service inspect drwell_api --format='{{json .Spec.Labels}}' | jq
   ```

2. Verifique o dashboard do Traefik (se disponível)

3. Verifique se os domínios estão apontando para o servidor

### Celery não processa tasks

1. Acesse o Flower: `https://flower.seu-dominio.com`

2. Verifique se os workers estão online

3. Veja os logs:
   ```bash
   docker service logs -f drwell_celery_worker
   ```

---

## Segurança em Produção

### 1. Proteger o Flower com Basic Auth

Gere uma senha:
```bash
echo $(htpasswd -nb admin SuaSenha123) | sed -e s/\\$/\\$\\$/g
```

Adicione ao docker-stack.yml (seção do flower):
```yaml
- "traefik.http.routers.drwell-flower.middlewares=flower-auth"
- "traefik.http.middlewares.flower-auth.basicauth.users=admin:$$apr1$$...$$..."
```

### 2. Rate Limiting

Adicione middleware de rate limit na API:
```yaml
- "traefik.http.routers.drwell-api.middlewares=api-ratelimit"
- "traefik.http.middlewares.api-ratelimit.ratelimit.average=100"
- "traefik.http.middlewares.api-ratelimit.ratelimit.burst=50"
```

### 3. Firewall

Configure firewall para permitir apenas portas necessárias:
- 80 (HTTP - redireciona para HTTPS)
- 443 (HTTPS)
- 22 (SSH - apenas IPs confiáveis)

---

## Próximos Passos

1. **Configurar Backups Automáticos**
   - Configure backup diário do PostgreSQL
   - Configure backup dos uploads

2. **Monitoramento**
   - Configure alertas no Flower
   - Configure monitoramento de recursos (CPU, memória)

3. **Logs**
   - Configure centralização de logs (ELK, Graylog, etc.)

4. **Domínios**
   - Configure DNS apontando para seu servidor
   - Aguarde a geração automática dos certificados SSL pelo Traefik

---

## Informações Importantes

### Endpoints da API

- **Health Check**: `GET /health`
- **API Root**: `GET /`
- **Docs (Swagger)**: `GET /docs`
- **ReDoc**: `GET /redoc`
- **Auth**: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`
- **Escritórios**: `GET/POST /api/v1/law-firms`
- **Advogados**: `GET/POST /api/v1/lawyers`
- **Clientes**: `GET/POST /api/v1/clients`
- **Processos**: `GET/POST /api/v1/processes`
- **DataJud Sync**: `POST /api/v1/processes/{id}/sync`

### Recursos do Sistema

- **Alta Disponibilidade**: 2 replicas da API com load balancing
- **Processamento Assíncrono**: 2 workers Celery para tasks pesadas
- **Sincronização Automática**: Celery Beat agenda sync dos processos
- **Monitoramento**: Flower para visualizar tasks e workers
- **Persistência**: PostgreSQL com volume persistente
- **Cache**: Redis para performance e fila de mensagens
- **SSL/TLS**: Automático via Traefik + Let's Encrypt
- **Health Checks**: Automático para todos os serviços

---

## Suporte

Para problemas ou dúvidas:
1. Verifique os logs: `docker service logs drwell_api`
2. Consulte a documentação da API: `/docs`
3. Verifique o Flower: `https://flower.seu-dominio.com`
4. GitHub: https://github.com/TOMBRITO1979/drwell

---

**DrWell v1.0** - Sistema de Gestão para Escritórios de Advocacia

Desenvolvido com ❤️ usando FastAPI, PostgreSQL, Redis, Celery, Docker Swarm e Traefik
