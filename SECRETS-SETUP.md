# Configuração de Secrets e Tokens

Este documento contém instruções para configurar os secrets necessários sem expor informações sensíveis.

## GitHub Actions Secrets

Para habilitar CI/CD automático, configure estes secrets no GitHub:

### Passo a Passo:

1. Acesse seu repositório no GitHub
2. Vá em `Settings` → `Secrets and variables` → `Actions`
3. Clique em `New repository secret`

### Secrets necessários:

#### 1. DOCKER_USERNAME
- **Nome**: `DOCKER_USERNAME`
- **Valor**: `tomautomations`
- **Descrição**: Username do DockerHub

#### 2. DOCKER_TOKEN
- **Nome**: `DOCKER_TOKEN`
- **Valor**: Use o token fornecido
- **Descrição**: Token de acesso do DockerHub

---

## Portainer Secrets

### 1. postgres_password

Crie um secret forte para o PostgreSQL:

```bash
# Gerar senha aleatória (Linux/Mac)
openssl rand -base64 32

# Ou use uma senha forte personalizada
```

**No Portainer:**
- Nome: `postgres_password`
- Valor: [Sua senha gerada]

### 2. secret_key

Crie uma chave secreta para JWT:

```bash
# Gerar secret key aleatória (Python)
python3 -c "import secrets; print(secrets.token_urlsafe(50))"

# Ou (Linux/Mac)
openssl rand -base64 64
```

**No Portainer:**
- Nome: `secret_key`
- Valor: [Sua chave gerada]

---

## Variáveis de Ambiente

### .env para desenvolvimento local

Copie `.env.example` para `.env` e configure:

```bash
cp .env.example .env
```

Edite e configure:

```env
# Ambiente
ENVIRONMENT=development

# Segurança (MUDE ESTAS!)
SECRET_KEY=sua-chave-secreta-aqui
POSTGRES_PASSWORD=sua-senha-postgres
REDIS_PASSWORD=sua-senha-redis

# DataJud API
DATAJUD_API_KEY=cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==
```

---

## URLs e Endpoints

### Produção

Ajuste no `docker-stack.yml`:

```yaml
# API
- "traefik.http.routers.drwell-api.rule=Host(`seu-dominio.com`)"

# Flower
- "traefik.http.routers.drwell-flower.rule=Host(`flower.seu-dominio.com`)"
```

### Desenvolvimento

API Local: `http://localhost/api/v1`
Docs: `http://localhost/docs`

---

## Checklist de Segurança

Antes de fazer deploy em produção:

- [ ] Secrets criados no Portainer
- [ ] Senhas fortes configuradas
- [ ] Domínios configurados corretamente
- [ ] HTTPS habilitado (Traefik + Let's Encrypt)
- [ ] Flower protegido com Basic Auth
- [ ] Backups configurados
- [ ] Monitoramento ativo

---

## IMPORTANTE: Segurança dos Tokens

**NUNCA:**
- ❌ Commite arquivos `.env` no Git
- ❌ Exponha tokens em logs públicos
- ❌ Compartilhe secrets em canais inseguros
- ❌ Use senhas fracas em produção

**SEMPRE:**
- ✅ Use secrets do Docker Swarm
- ✅ Gere senhas aleatórias fortes
- ✅ Rotacione tokens periodicamente
- ✅ Use HTTPS em produção
- ✅ Mantenha backups seguros

---

## Rotação de Secrets

### Para atualizar um secret no Swarm:

```bash
# 1. Criar novo secret
echo "nova-senha" | docker secret create postgres_password_v2 -

# 2. Atualizar serviço
docker service update \
  --secret-rm postgres_password \
  --secret-add source=postgres_password_v2,target=postgres_password \
  drwell_api

# 3. Remover secret antigo (após confirmar que funciona)
docker secret rm postgres_password
```

---

Para mais informações sobre segurança, consulte:
- [Docker Secrets](https://docs.docker.com/engine/swarm/secrets/)
- [OWASP Cheat Sheet](https://cheatsheetseries.owasp.org/)
