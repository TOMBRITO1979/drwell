# DrWell - Deploy em Produção (Docker Swarm + Portainer)

🚀 **Projeto pronto para deploy!**

Este projeto está 100% configurado para deploy em Docker Swarm usando Portainer.

---

## 📦 O que você está recebendo

### ✅ Stack Completa
- **FastAPI** - API REST moderna e rápida
- **PostgreSQL 15** - Banco de dados principal
- **Redis** - Cache e message broker (usa seu Redis existente)
- **Celery** - Jobs assíncronos para sync de processos
- **Celery Beat** - Scheduler para jobs periódicos
- **Flower** - Monitor de jobs (opcional)
- **Traefik** - Reverse proxy com SSL automático

### ✅ Integração DataJud (CNJ)
- 70+ tribunais brasileiros suportados
- Sincronização automática de processos
- Histórico completo de movimentações
- API Key já configurada

### ✅ Pronto para Produção
- Multi-stage Docker build otimizado
- Docker Swarm stack configurada
- Healthchecks em todos os serviços
- Secrets management integrado
- CI/CD com GitHub Actions
- SSL/TLS automático via Traefik

---

## 🚀 Deploy Rápido (5 minutos)

### Passo 1: Build da Imagem

**No seu computador local (Windows):**
```bash
build-and-push.bat
```

**Ou no Linux/Mac:**
```bash
chmod +x build-and-push.sh
./build-and-push.sh
```

Faça login quando solicitado:
- Username: `tomautomations`
- Password: [use o token fornecido]

### Passo 2: Criar Secrets no Portainer

**Portainer → Swarm → Secrets → Add Secret**

1. **postgres_password**
   ```bash
   # Gerar senha forte
   openssl rand -base64 32
   ```

2. **secret_key**
   ```bash
   # Gerar chave JWT
   python3 -c "import secrets; print(secrets.token_urlsafe(50))"
   ```

### Passo 3: Ajustar docker-stack.yml

Edite o arquivo `docker-stack.yml`:

1. **Substituir senha do PostgreSQL** (linha ~37, ~69, ~113):
   ```yaml
   # De:
   - DATABASE_URL=postgresql://drwell:POSTGRES_PASSWORD_PLACEHOLDER@postgres:5432/drwell_db

   # Para:
   - DATABASE_URL=postgresql://drwell:SUA_SENHA_AQUI@postgres:5432/drwell_db
   ```

2. **Ajustar domínios** (linhas ~86, ~155):
   ```yaml
   # API
   - "traefik.http.routers.drwell-api.rule=Host(`seu-dominio.com`)"

   # Flower
   - "traefik.http.routers.drwell-flower.rule=Host(`flower.seu-dominio.com`)"
   ```

### Passo 4: Deploy no Portainer

1. **Portainer → Stacks → Add stack**
2. **Name**: `drwell`
3. **Web editor**: Cole o `docker-stack.yml` (ajustado)
4. **Deploy the stack**

Aguarde ~30 segundos.

### Passo 5: Executar Migrations

**Portainer → Services → drwell_api → Containers → Console:**
```bash
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

### Passo 6: Criar Usuário Admin

```bash
python init-admin.py
```

### Passo 7: Testar

```bash
curl https://seu-dominio.com/health
```

Acesse: `https://seu-dominio.com/docs`

---

## 📚 Documentação Completa

| Arquivo | Descrição |
|---------|-----------|
| **PORTAINER-QUICKSTART.md** | Guia rápido de 5 minutos |
| **DEPLOY.md** | Guia completo de deploy |
| **DEPLOYMENT-CHECKLIST.md** | Checklist passo a passo |
| **SECRETS-SETUP.md** | Configuração de senhas e tokens |
| **API-EXAMPLES.md** | Exemplos de uso da API |
| **README.md** | Documentação geral do projeto |

---

## 🏗️ Arquitetura

```
                                    Internet
                                       |
                                   Traefik (SSL)
                                       |
                    +-----------------+------------------+
                    |                                    |
               FastAPI (2x)                          Flower
                    |                                    |
           +--------+--------+                           |
           |                 |                           |
      PostgreSQL         Redis (seu)                     |
                            |                            |
                    +-------+--------+                   |
                    |                |                   |
              Celery Worker     Celery Beat              |
                                                          |
                    +---------------------------------+---+
                                  |
                            DataJud CNJ API
```

---

## 🔧 Comandos Úteis

```bash
# Ver status dos serviços
docker service ls | grep drwell

# Logs em tempo real
docker service logs -f drwell_api

# Escalar serviços
docker service scale drwell_api=3
docker service scale drwell_celery_worker=4

# Atualizar imagem
docker service update --image tomautomations/drwell:latest drwell_api

# Reiniciar serviço
docker service update --force drwell_api

# Backup do PostgreSQL
docker exec $(docker ps -q -f name=drwell_postgres) \
  pg_dump -U drwell drwell_db > backup_$(date +%Y%m%d).sql
```

---

## 🔐 Segurança

### ✅ Implementado:
- [x] Secrets do Docker Swarm
- [x] SSL/TLS automático (Traefik + Let's Encrypt)
- [x] Senhas hash (bcrypt)
- [x] JWT para autenticação
- [x] Non-root user no container
- [x] Healthchecks

### 📋 Recomendações:
- [ ] Habilitar Basic Auth no Flower
- [ ] Configurar rate limiting
- [ ] Habilitar firewall
- [ ] Backup automático diário
- [ ] Monitoramento com alertas

---

## 📊 Recursos Necessários

### Mínimo (Desenvolvimento):
- 2 CPU cores
- 4 GB RAM
- 20 GB disco

### Recomendado (Produção):
- 4 CPU cores
- 8 GB RAM
- 50 GB disco SSD

### Escalável:
- Adicione mais réplicas conforme necessário
- PostgreSQL pode ser movido para servidor dedicado
- Redis Cluster para alta disponibilidade

---

## 🆘 Troubleshooting

### Serviço não inicia
```bash
docker service ps drwell_api --no-trunc
docker service logs drwell_api
```

### Erro de conexão com banco
```bash
docker service logs drwell_postgres
docker exec -it $(docker ps -q -f name=drwell_postgres) psql -U drwell -d drwell_db
```

### Erro com Redis
```bash
docker exec -it redis_redis redis-cli ping
```

### Problema com migrations
```bash
# Remover e recriar banco (CUIDADO!)
docker service scale drwell_postgres=0
docker volume rm drwell_postgres_data
docker service scale drwell_postgres=1
# Execute migrations novamente
```

---

## 🔄 CI/CD Automático

### Configurar GitHub Actions:

1. **No GitHub, vá em Settings → Secrets → Actions**

2. **Adicione os secrets:**
   - `DOCKER_USERNAME`: `tomautomations`
   - `DOCKER_TOKEN`: [token fornecido]

3. **Push para GitHub:**
   ```bash
   git add .
   git commit -m "Deploy configuration"
   git push origin main
   ```

4. **GitHub Actions fará o build e push automaticamente!**

Veja o workflow em: `.github/workflows/docker-build.yml`

---

## 📈 Próximos Passos

Após o deploy:

1. ✅ Criar usuário admin (`init-admin.py`)
2. ✅ Cadastrar escritório
3. ✅ Adicionar advogados
4. ✅ Cadastrar clientes
5. ✅ Importar processos
6. ✅ Configurar sync automático
7. ✅ Testar integração DataJud
8. ✅ Configurar backup
9. ✅ Monitorar via Flower

---

## 🎯 Endpoints Principais

- **API**: https://seu-dominio.com
- **Docs**: https://seu-dominio.com/docs
- **Health**: https://seu-dominio.com/health
- **Flower**: https://flower.seu-dominio.com

---

## 📞 Suporte

- **GitHub**: https://github.com/TOMBRITO1979/drwell
- **Issues**: https://github.com/TOMBRITO1979/drwell/issues
- **Documentação**: Veja os arquivos `*.md` neste repositório

---

## 📄 Licença

[Definir licença]

---

**DrWell** - Sistema de Gestão para Escritórios de Advocacia
Desenvolvido com FastAPI + PostgreSQL + Redis + Celery + Docker Swarm

🚀 **Está tudo pronto para produção!**
