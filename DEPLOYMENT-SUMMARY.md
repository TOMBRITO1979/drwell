# DrWell - Resumo do Deployment

## Status: Pronto para Deploy no Portainer

Tudo foi configurado e está pronto para você fazer o deploy!

---

## O Que Foi Feito

### 1. Código no GitHub
- **Repositório**: https://github.com/TOMBRITO1979/drwell
- **Status**: Código completo commitado e enviado com sucesso

### 2. Imagem Docker no DockerHub
- **Imagem**: `tomautomations/drwell:latest`
- **Status**: Publicada com sucesso
- **Digest**: `sha256:101fe67f5df9e03a06b11a93664a5a3e8ac4dbf44f3bbe8152c361c2d017bbdb`
- **URL**: https://hub.docker.com/r/tomautomations/drwell

### 3. Documentação Completa
Foram criados diversos guias para facilitar o deployment e uso:

#### Guias de Deploy:
- `PORTAINER-DEPLOY-FINAL.md` - **ESTE É O PRINCIPAL! USE ESTE!**
- `DEPLOYMENT-CHECKLIST.md` - Checklist passo-a-passo
- `PORTAINER-QUICKSTART.md` - Guia rápido de 5 minutos
- `DEPLOY.md` - Guia detalhado completo

#### Guias de Uso:
- `README.md` - Documentação principal do projeto
- `API-EXAMPLES.md` - Exemplos de uso da API
- `SECRETS-SETUP.md` - Como configurar secrets de forma segura

#### Referência:
- `START-HERE.txt` - Por onde começar
- `PUSH-TO-GITHUB.md` - Como fazer push (já executado)
- `README-DEPLOY.md` - Deploy alternativo

---

## Como Fazer o Deploy AGORA

### Opção Rápida: 3 Passos

1. **Abra o arquivo**: `PORTAINER-DEPLOY-FINAL.md`

2. **Siga os passos**:
   - Criar 2 secrets no Portainer (postgres_password e secret_key)
   - Ajustar 2 configurações no YAML (senha e domínios)
   - Colar a stack no Portainer
   - Executar migrations

3. **Pronto!** Seu sistema estará rodando

---

## Informações Importantes

### Estrutura do Projeto

```
DrWell/
├── API FastAPI (2 replicas)
│   └── Endpoints REST + Swagger/ReDoc
├── PostgreSQL (1 replica)
│   └── Banco de dados persistente
├── Celery Workers (2 replicas)
│   └── Processamento assíncrono de tasks
├── Celery Beat (1 replica)
│   └── Agendamento de sincronizações
└── Flower (1 replica)
    └── Monitoramento das tasks
```

### Recursos Implementados

#### Gestão de Escritórios
- CRUD completo de escritórios (master users)
- Configurações por escritório
- Isolamento de dados

#### Gestão de Advogados
- CRUD completo de advogados
- Associação com escritórios
- Controle de acesso por advogado

#### Gestão de Clientes
- CRUD completo de clientes
- CPF/CNPJ, contatos, endereços
- Associação com escritórios
- Atributos customizados

#### Gestão de Processos
- CRUD completo de processos
- Número do processo, vara, tribunal
- Status e categoria
- **Integração com DataJud CNJ**
- Sincronização automática configurável
- Armazenamento de movimentações

#### Sincronização DataJud
- Suporte para 70+ tribunais brasileiros
- Sincronização manual por demanda
- Sincronização automática agendada
- Configuração de intervalo por processo
- Armazenamento de dados brutos em JSON

#### Documentos
- Upload de arquivos
- Associação com processos e clientes
- Templates de documentos

#### Financeiro (estrutura básica)
- Gestão de honorários
- Associação com processos

#### Prazos & Kanban (estrutura básica)
- Sistema de deadlines
- Visualização em Kanban

#### Autenticação & Segurança
- JWT Authentication
- Controle de acesso baseado em roles
- Senhas hasheadas com bcrypt
- Docker Secrets para credenciais sensíveis

---

## Tecnologias Utilizadas

### Backend
- **FastAPI 0.109.0** - Framework web moderno e rápido
- **Python 3.11** - Linguagem base
- **SQLAlchemy 2.0** - ORM para banco de dados
- **Alembic** - Migrations do banco
- **Pydantic** - Validação de dados
- **Python-Jose** - JWT tokens

### Banco de Dados & Cache
- **PostgreSQL 15** - Banco relacional
- **Redis 7** - Cache e message broker

### Processamento Assíncrono
- **Celery 5.3** - Task queue
- **Celery Beat** - Task scheduler
- **Flower 2.0** - Monitoring

### Infraestrutura
- **Docker Swarm** - Orquestração
- **Traefik v2** - Reverse proxy + SSL automático
- **Docker Secrets** - Gestão segura de credenciais

### Integrações
- **DataJud CNJ API** - Tribunais brasileiros
- **HTTPx / Requests** - Cliente HTTP

---

## Endpoints da API

Após o deploy, você terá acesso a:

### Documentação Interativa
- **Swagger UI**: `https://seu-dominio.com/docs`
- **ReDoc**: `https://seu-dominio.com/redoc`

### Health & Status
- **Health Check**: `GET /health`
- **API Root**: `GET /`

### Autenticação
- **Registro**: `POST /api/v1/auth/register`
- **Login**: `POST /api/v1/auth/login`
- **Perfil**: `GET /api/v1/auth/me`

### Escritórios (Law Firms)
- `GET /api/v1/law-firms` - Listar
- `POST /api/v1/law-firms` - Criar
- `GET /api/v1/law-firms/{id}` - Buscar
- `PUT /api/v1/law-firms/{id}` - Atualizar
- `DELETE /api/v1/law-firms/{id}` - Deletar

### Advogados (Lawyers)
- `GET /api/v1/lawyers` - Listar
- `POST /api/v1/lawyers` - Criar
- `GET /api/v1/lawyers/{id}` - Buscar
- `PUT /api/v1/lawyers/{id}` - Atualizar
- `DELETE /api/v1/lawyers/{id}` - Deletar

### Clientes (Clients)
- `GET /api/v1/clients` - Listar
- `POST /api/v1/clients` - Criar
- `GET /api/v1/clients/{id}` - Buscar
- `PUT /api/v1/clients/{id}` - Atualizar
- `DELETE /api/v1/clients/{id}` - Deletar

### Processos (Processes)
- `GET /api/v1/processes` - Listar
- `POST /api/v1/processes` - Criar
- `GET /api/v1/processes/{id}` - Buscar
- `PUT /api/v1/processes/{id}` - Atualizar
- `DELETE /api/v1/processes/{id}` - Deletar
- **`POST /api/v1/processes/{id}/sync`** - Sincronizar com DataJud

### Documentos (Documents)
- `GET /api/v1/documents` - Listar
- `POST /api/v1/documents` - Upload
- `GET /api/v1/documents/{id}` - Buscar
- `DELETE /api/v1/documents/{id}` - Deletar

### Monitoramento
- **Flower**: `https://flower.seu-dominio.com`
  - Visualizar workers
  - Monitorar tasks
  - Ver filas
  - Histórico de execuções

---

## Exemplo de Uso Completo

### 1. Registrar Escritório
```bash
curl -X POST "https://seu-dominio.com/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "contato@escritorio.com",
    "password": "SenhaForte123!",
    "full_name": "Escritório Silva & Advogados",
    "role": "master"
  }'
```

### 2. Login
```bash
curl -X POST "https://seu-dominio.com/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "contato@escritorio.com",
    "password": "SenhaForte123!"
  }'
```

Retorna:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### 3. Criar Cliente
```bash
curl -X POST "https://seu-dominio.com/api/v1/clients" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "João Silva",
    "email": "joao@email.com",
    "cpf": "123.456.789-00",
    "phone": "(11) 98765-4321"
  }'
```

### 4. Criar Processo
```bash
curl -X POST "https://seu-dominio.com/api/v1/processes" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "process_number": "0001234-56.2024.8.26.0100",
    "court_type": "TJSP",
    "subject": "Ação de Cobrança",
    "value": 50000.00,
    "client_id": 1,
    "auto_sync_enabled": true,
    "sync_interval_hours": 24,
    "datajud_endpoint": "tjsp"
  }'
```

### 5. Sincronizar com DataJud
```bash
curl -X POST "https://seu-dominio.com/api/v1/processes/1/sync" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

Retorna:
```json
{
  "status": "success",
  "message": "Processo sincronizado com sucesso",
  "movements_found": 12
}
```

---

## Tribunais Suportados (DataJud CNJ)

O sistema suporta integração com 70+ tribunais brasileiros, incluindo:

### Tribunais de Justiça Estaduais
- **TJSP** - São Paulo
- **TJRJ** - Rio de Janeiro
- **TJMG** - Minas Gerais
- **TJRS** - Rio Grande do Sul
- **TJPR** - Paraná
- E todos os outros TJs...

### Tribunais Regionais Federais
- **TRF1** - 1ª Região
- **TRF2** - 2ª Região
- **TRF3** - 3ª Região
- **TRF4** - 4ª Região
- **TRF5** - 5ª Região
- **TRF6** - 6ª Região

### Tribunais Superiores
- **STF** - Supremo Tribunal Federal
- **STJ** - Superior Tribunal de Justiça
- **TST** - Tribunal Superior do Trabalho

### Tribunais do Trabalho
- Todos os TRTs (1 a 24)

### Tribunais Militares e Eleitorais
- **STM** - Superior Tribunal Militar
- **TSE** - Tribunal Superior Eleitoral
- Todos os TREs

---

## Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────┐
│                      Traefik Proxy                      │
│              (SSL/TLS + Load Balancing)                 │
└───────────────────┬─────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌───────────────┐       ┌──────────────┐
│   API (x2)    │       │  Flower (x1) │
│   FastAPI     │       │  Monitoring  │
└───────┬───────┘       └──────────────┘
        │
        ├─────────────┬──────────────┬────────────┐
        │             │              │            │
        ▼             ▼              ▼            ▼
┌──────────┐   ┌──────────┐   ┌─────────┐   ┌────────┐
│PostgreSQL│   │  Redis   │   │ Celery  │   │ Celery │
│   (x1)   │   │(externo) │   │Worker   │   │  Beat  │
│          │   │          │   │  (x2)   │   │  (x1)  │
└──────────┘   └──────────┘   └─────────┘   └────────┘
                                    │
                                    ▼
                            ┌───────────────┐
                            │  DataJud CNJ  │
                            │   API (70+)   │
                            └───────────────┘
```

---

## Configuração de Produção

### Secrets Criados
- `postgres_password` - Senha do PostgreSQL
- `secret_key` - Chave para JWT tokens

### Variáveis de Ambiente
- `ENVIRONMENT=production`
- `DATABASE_URL` - Conexão PostgreSQL
- `REDIS_URL` - Conexão Redis (redis_redis)
- `DATAJUD_API_KEY` - Chave da API CNJ

### Recursos Configurados
- **API**: 2 replicas, 512MB RAM, 1 CPU
- **Workers**: 2 replicas, 512MB RAM, 1 CPU
- **Beat**: 1 replica, 256MB RAM, 0.5 CPU
- **Flower**: 1 replica, 256MB RAM, 0.5 CPU
- **PostgreSQL**: 1 replica, 512MB RAM, 1 CPU

### Networks
- `network-public` - Externa (Traefik)
- `drwell_internal` - Interna (serviços)

### Volumes
- `postgres_data` - Dados do PostgreSQL
- `uploads` - Arquivos enviados

---

## Comandos Rápidos

### Ver Status
```bash
docker service ls | grep drwell
```

### Ver Logs
```bash
docker service logs -f drwell_api
```

### Escalar API
```bash
docker service scale drwell_api=3
```

### Atualizar para Nova Versão
```bash
docker service update --image tomautomations/drwell:latest drwell_api
```

### Backup
```bash
docker exec $(docker ps -q -f name=drwell_postgres) \
  pg_dump -U drwell drwell_db > backup.sql
```

---

## Próximos Passos Recomendados

### Curto Prazo (Hoje)
1. ✅ Deploy no Portainer (use `PORTAINER-DEPLOY-FINAL.md`)
2. ✅ Executar migrations
3. ✅ Criar primeiro usuário admin
4. ✅ Testar API via `/docs`
5. ✅ Configurar DNS dos domínios

### Médio Prazo (Esta Semana)
1. Testar integração com DataJud
2. Configurar backup automático do PostgreSQL
3. Adicionar Basic Auth no Flower
4. Configurar rate limiting no Traefik
5. Testar sincronização automática de processos

### Longo Prazo (Próximas Semanas)
1. Desenvolver frontend web (React/Vue)
2. Adicionar notificações por email
3. Implementar relatórios e dashboards
4. Adicionar auditoria de ações
5. Implementar sistema de permissões granulares

---

## Suporte e Documentação

### Documentação da API
- Swagger: `https://seu-dominio.com/docs`
- ReDoc: `https://seu-dominio.com/redoc`

### Código Fonte
- GitHub: https://github.com/TOMBRITO1979/drwell

### Imagem Docker
- DockerHub: https://hub.docker.com/r/tomautomations/drwell

### Logs e Monitoramento
- Logs: `docker service logs drwell_api`
- Monitoring: `https://flower.seu-dominio.com`

---

## Checklist de Deploy

Antes de fazer o deploy, verifique:

- [ ] Docker Swarm inicializado
- [ ] Portainer instalado e funcionando
- [ ] Rede `network-public` criada
- [ ] Redis `redis_redis` rodando
- [ ] Traefik configurado
- [ ] Secrets criados no Portainer
- [ ] Senha do PostgreSQL substituída no YAML
- [ ] Domínios ajustados no YAML
- [ ] DNS dos domínios apontando para o servidor

Durante o deploy:

- [ ] Stack criada no Portainer
- [ ] Todos os 5 serviços rodando
- [ ] Migrations executadas
- [ ] Health check retornando `{"status": "healthy"}`
- [ ] `/docs` acessível
- [ ] Flower acessível

Pós-deploy:

- [ ] Primeiro usuário criado
- [ ] API testada via Swagger
- [ ] Teste de criação de cliente
- [ ] Teste de criação de processo
- [ ] Teste de sincronização DataJud
- [ ] Flower mostrando workers ativos

---

## Contatos e Informações

**Projeto**: DrWell - Sistema de Gestão para Escritórios de Advocacia
**Versão**: 1.0.0
**Desenvolvido com**: FastAPI + PostgreSQL + Redis + Celery + Docker Swarm

---

**Tudo pronto para deploy!**

Abra o arquivo `PORTAINER-DEPLOY-FINAL.md` e siga os passos.

Boa sorte com o deploy!
