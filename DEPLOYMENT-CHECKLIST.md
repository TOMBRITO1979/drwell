# DrWell - Checklist de Deploy

Use este checklist para garantir que tudo está configurado corretamente.

---

## 📋 Pré-Deploy

### Infraestrutura
- [ ] Docker Swarm inicializado
- [ ] Portainer instalado e acessível
- [ ] Rede `network-public` criada
- [ ] Redis rodando como `redis_redis`
- [ ] Traefik configurado com Let's Encrypt
- [ ] Domínios apontando para o servidor (DNS)

### Códigos e Repositórios
- [ ] Código commitado no GitHub
- [ ] Repositório: https://github.com/TOMBRITO1979/drwell
- [ ] Branch `main` ou `master` atualizada

---

## 🔐 Secrets e Senhas

### GitHub Secrets (para CI/CD)
- [ ] `DOCKER_USERNAME` = `tomautomations`
- [ ] `DOCKER_TOKEN` = [token fornecido]

### Portainer Secrets
- [ ] Secret `postgres_password` criado (senha forte!)
- [ ] Secret `secret_key` criado (chave aleatória!)

### Gerar Senhas
```bash
# Secret Key
python3 -c "import secrets; print(secrets.token_urlsafe(50))"

# Postgres Password
openssl rand -base64 32
```

---

## 🐳 Docker Image

### Opção A: Build Local
- [ ] Executar `build-and-push.sh` (Linux/Mac)
- [ ] Ou `build-and-push.bat` (Windows)
- [ ] Login no DockerHub bem-sucedido
- [ ] Imagem enviada: `tomautomations/drwell:latest`

### Opção B: CI/CD GitHub Actions
- [ ] Secrets configurados no GitHub
- [ ] Push para `main`/`master` realizado
- [ ] GitHub Actions executado com sucesso
- [ ] Imagem disponível no DockerHub

### Verificar Imagem
```bash
docker pull tomautomations/drwell:latest
docker run --rm tomautomations/drwell:latest python -c "import app; print('OK')"
```

---

## ⚙️ Configuração da Stack

### Ajustar docker-stack.yml

#### 1. Senha do PostgreSQL
- [ ] Substituir `POSTGRES_PASSWORD_PLACEHOLDER` nos serviços:
  - `api`
  - `celery_worker`
  - `celery_beat`

#### 2. Domínios
- [ ] API: `Host(\`seu-dominio.com\`)`
- [ ] Flower: `Host(\`flower.seu-dominio.com\`)`

#### 3. Labels Traefik
- [ ] `certresolver=letsencrypt` configurado
- [ ] Entrypoint `websecure` (HTTPS)

#### 4. Recursos
- [ ] Replicas configuradas (api: 2, workers: 2)
- [ ] Limites de CPU/Memory apropriados

---

## 🚀 Deploy

### No Portainer
- [ ] Stacks → Add stack
- [ ] Nome: `drwell`
- [ ] Web editor com `docker-stack.yml` ajustado
- [ ] Deploy the stack
- [ ] Aguardar ~30-60 segundos

### Verificar Deploy
```bash
# Ver serviços
docker service ls | grep drwell

# Deve mostrar:
# - drwell_postgres (1/1)
# - drwell_api (2/2)
# - drwell_celery_worker (2/2)
# - drwell_celery_beat (1/1)
# - drwell_flower (1/1)
```

---

## 💾 Banco de Dados

### Executar Migrations

#### Via Portainer:
- [ ] Swarm → Services → `drwell_api`
- [ ] Containers → Selecionar container
- [ ] Console → Connect
- [ ] Executar:
  ```bash
  alembic revision --autogenerate -m "Initial migration"
  alembic upgrade head
  ```

#### Via SSH:
```bash
docker exec -it $(docker ps -q -f name=drwell_api | head -1) bash
alembic revision --autogenerate -m "Initial"
alembic upgrade head
exit
```

### Verificar Tabelas
- [ ] Conectar ao PostgreSQL
- [ ] Verificar se tabelas foram criadas
  ```bash
  docker exec -it $(docker ps -q -f name=drwell_postgres) psql -U drwell -d drwell_db -c "\dt"
  ```

---

## ✅ Testes de Verificação

### Health Check
```bash
curl https://seu-dominio.com/health
# Esperado: {"status": "healthy"}
```
- [ ] Health check responde OK

### API Root
```bash
curl https://seu-dominio.com/
```
- [ ] Retorna informações da API

### Documentação
- [ ] https://seu-dominio.com/docs (Swagger UI)
- [ ] https://seu-dominio.com/redoc (ReDoc)

### Flower (Monitor Celery)
- [ ] https://flower.seu-dominio.com
- [ ] Mostra workers ativos

### Logs
```bash
docker service logs -f drwell_api
docker service logs drwell_celery_worker
docker service logs drwell_postgres
```
- [ ] Sem erros críticos nos logs

### SSL/TLS
- [ ] HTTPS funcionando (Let's Encrypt)
- [ ] Certificado válido
- [ ] Sem avisos de segurança

---

## 🔧 Pós-Deploy

### Monitoramento
- [ ] Flower acessível e mostrando workers
- [ ] Logs sendo gerados corretamente
- [ ] Métricas de recursos OK (CPU, RAM)

### Segurança
- [ ] Flower protegido (Basic Auth recomendado)
- [ ] Rate limiting configurado (opcional)
- [ ] Firewall configurado
- [ ] Apenas portas necessárias expostas

### Backup
- [ ] Configurar backup automático do PostgreSQL
- [ ] Testar restauração de backup
- [ ] Definir política de retenção

### Escala
- [ ] Escalar API se necessário: `docker service scale drwell_api=3`
- [ ] Escalar workers se necessário: `docker service scale drwell_celery_worker=4`

---

## 📊 Testes Funcionais

### Criar Primeiro Usuário
- [ ] POST /api/v1/auth/register
- [ ] Verificar criação no banco

### Criar Escritório
- [ ] POST /api/v1/law-firms
- [ ] Verificar dados salvos

### Criar Processo
- [ ] POST /api/v1/processes
- [ ] Verificar se Celery processa sync

### Testar Sync DataJud
- [ ] POST /api/v1/processes/{id}/sync
- [ ] Verificar logs do Celery Worker
- [ ] Verificar movimentações salvas

---

## 🎯 Otimizações (Opcional)

### Performance
- [ ] Configurar cache Redis para queries
- [ ] Otimizar índices do PostgreSQL
- [ ] Configurar connection pooling

### Alta Disponibilidade
- [ ] Múltiplos nós no Swarm
- [ ] PostgreSQL com replicação
- [ ] Redis Sentinel/Cluster

### Monitoramento Avançado
- [ ] Prometheus + Grafana
- [ ] Sentry para errors
- [ ] APM (Application Performance Monitoring)

---

## 📝 Documentação

- [ ] Atualizar README com URLs de produção
- [ ] Documentar APIs personalizadas
- [ ] Criar guia para usuários finais
- [ ] Documentar procedimentos de backup/restore

---

## 🆘 Troubleshooting

Se algo der errado:

1. **Verificar logs**:
   ```bash
   docker service logs -f drwell_api
   ```

2. **Verificar status**:
   ```bash
   docker service ps drwell_api
   ```

3. **Reiniciar serviço**:
   ```bash
   docker service update --force drwell_api
   ```

4. **Rollback se necessário**:
   ```bash
   docker service rollback drwell_api
   ```

---

## 🎉 Deploy Completo!

Quando todos os itens estiverem marcados:

✅ **Parabéns! Seu DrWell está no ar!**

Acesse:
- **API**: https://seu-dominio.com
- **Docs**: https://seu-dominio.com/docs
- **Flower**: https://flower.seu-dominio.com

---

## 📞 Suporte

Problemas? Consulte:
- `DEPLOY.md` - Guia completo de deploy
- `PORTAINER-QUICKSTART.md` - Guia rápido
- GitHub Issues: https://github.com/TOMBRITO1979/drwell/issues
